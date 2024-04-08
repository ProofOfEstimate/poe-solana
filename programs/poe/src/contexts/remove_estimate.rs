use crate::errors::*;
use crate::states::*;
use crate::utils::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct RemoveEstimate<'info> {
    #[account(mut)]
    pub forecaster: Signer<'info>,
    #[account(
        mut,
        seeds=[User::SEED_PREFIX.as_bytes(), forecaster.key().as_ref()],
        bump=user.bump,
      )]
    pub user: Box<Account<'info, User>>,
    #[account(
      mut,
      seeds=[Poll::SEED_PREFIX.as_bytes(), &poll.id.to_le_bytes()],
      bump=poll.bump
    )]
    pub poll: Box<Account<'info, Poll>>,
    #[account(
      mut,
      seeds=[UserEstimate::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
      bump = user_estimate.bump,
      close = forecaster
    )]
    pub user_estimate: Box<Account<'info, UserEstimate>>,
    #[account(
        init,
        payer = forecaster,
        seeds=[PollEstimateUpdate::SEED_PREFIX.as_bytes(), poll.key().as_ref(), &poll.num_estimate_updates.to_le_bytes()],
        space= PollEstimateUpdate::LEN,
        bump,
    )]
    pub estimate_update: Box<Account<'info, PollEstimateUpdate>>,
    #[account(
        mut,
        seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
        bump=scoring_list.bump
    )]
    pub scoring_list: Box<Account<'info, ScoringList>>,
    #[account(
        mut,
        seeds=[UserScore::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
        bump = user_score.bump,
        close = forecaster
      )]
    pub user_score: Box<Account<'info, UserScore>>,
    pub system_program: Program<'info, System>,
}

impl<'info> RemoveEstimate<'info> {
    pub fn remove_estimate(&mut self, bumps: &RemoveEstimateBumps) -> Result<()> {
        if self.poll.end_slot.is_some() {
            return err!(CustomErrorCode::PollClosed);
        }
        match self.poll.collective_estimate {
            Some(collective_estimate) => {
                assert!(self.poll.num_forecasters > 0);
                assert!(self.poll.num_estimate_updates > 0);
                self.poll.num_estimate_updates += 1;
                self.poll.num_forecasters -= 1;

                let user_estimate = self.user_estimate.get_estimate();
                let uncertainty = (self.user_estimate.upper_estimate
                    - self.user_estimate.lower_estimate) as f32
                    / 100.0;

                let weight = (1.0 - uncertainty)
                    * self.user_estimate.score_weight
                    * self.user_estimate.recency_weight;
                let aw_old = self.poll.accumulated_weights;
                let aws_old = self.poll.accumulated_weights_squared;

                self.poll.accumulated_weights -= weight;
                self.poll.accumulated_weights_squared -= weight * weight;

                let ue_f =
                    convert_to_float(10u32.pow(ESTIMATE_PRECISION as u32) * user_estimate as u32);
                let ce_f = convert_to_float(collective_estimate);
                let var_old = self.poll.variance.unwrap();

                if self.poll.num_forecasters == 0 {
                    self.poll.collective_estimate = None;
                    self.poll.variance = None;
                } else {
                    let new_ce_f = (aw_old * ce_f - weight * ue_f) / self.poll.accumulated_weights;
                    let new_collective_estimate = convert_from_float(new_ce_f);
                    self.poll.collective_estimate = Some(new_collective_estimate);

                    let d = ce_f - ue_f;

                    let var_new = ((2.0 * aw_old - aws_old / aw_old) * var_old
                        - 2.0 * weight * weight * d * d / self.poll.accumulated_weights
                        - 2.0 * weight * d * d
                        - 0.5 * weight * uncertainty * 100.0 * uncertainty * 1000.0)
                        / (2.0 * self.poll.accumulated_weights
                            - self.poll.accumulated_weights_squared
                                / self.poll.accumulated_weights);

                    self.poll.variance = Some(var_new);
                }

                let old_ln_gm = 0.0;

                let current_slot = Clock::get().unwrap().slot;
                self.scoring_list.update(
                    ce_f,
                    var_old / 10000.0,
                    current_slot,
                    self.poll.num_forecasters as f32 + 1.0,
                    old_ln_gm,
                );

                msg!("Updated collective estimate");

                // TODO: subtract points from user, e.g. worse outcome of user_score
            }
            None => {
                assert!(false);
            }
        }

        self.estimate_update.set_inner(PollEstimateUpdate::new(
            self.poll.key(),
            self.poll.collective_estimate,
            self.poll.variance,
            bumps.estimate_update,
        ));

        self.user.participation_count -= 1;

        Ok(())
    }
}
