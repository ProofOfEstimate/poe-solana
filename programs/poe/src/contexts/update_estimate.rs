use std::f32::consts::LN_2;

use crate::constants::EPSILON;
use crate::errors::*;
use crate::states::*;
use crate::utils::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateEstimate<'info> {
    #[account(mut)]
    pub forecaster: Signer<'info>,
    #[account(
      mut,
      seeds=[Poll::SEED_PREFIX.as_bytes(), &poll.id.to_le_bytes()],
      bump=poll.bump
    )]
    pub poll: Account<'info, Poll>,
    #[account(
      mut,
      seeds=[UserEstimate::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
      bump = user_estimate.bump,
    )]
    pub user_estimate: Account<'info, UserEstimate>,
    // TODO: Instead of init_if_needed, close user_estimate_update accounts when user removes estimate, but how to ensure that?
    #[account(
        init_if_needed,
        payer = forecaster,
        seeds=[UserEstimateUpdate::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref(), &user_estimate.num_estimate_updates.to_le_bytes()],
        space= UserEstimateUpdate::LEN,
        bump,
    )]
    pub user_estimate_update: Account<'info, UserEstimateUpdate>,
    #[account(
        init,
        payer = forecaster,
        seeds=[PollEstimateUpdate::SEED_PREFIX.as_bytes(), poll.key().as_ref(), &poll.num_estimate_updates.to_le_bytes()],
        space= PollEstimateUpdate::LEN,
        bump,
    )]
    pub estimate_update: Account<'info, PollEstimateUpdate>,
    #[account(
        mut,
        seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
        bump=scoring_list.bump
    )]
    pub scoring_list: Box<Account<'info, ScoringList>>,
    #[account(
        mut,
        seeds=[UserScore::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
        bump=user_score.bump,
      )]
    pub user_score: Account<'info, UserScore>,
    pub system_program: Program<'info, System>,
}

impl<'info> UpdateEstimate<'info> {
    pub fn update_collective_estimate(
        &mut self,
        bumps: &UpdateEstimateBumps,
        new_estimate: u16,
        new_uncertainty: f32,
    ) -> Result<()> {
        assert!(new_estimate <= 100);
        if self.poll.end_slot.is_some() {
            return err!(CustomErrorCode::PollClosed);
        }
        match self.poll.collective_estimate {
            Some(collective_estimate) => {
                assert!(self.poll.num_forecasters > 0);
                assert!(self.poll.num_estimate_updates > 0);
                assert!(self.poll.accumulated_weights > 0.0);
                self.poll.num_estimate_updates += 1;

                let old_estimate = self.user_estimate.get_estimate();
                let old_uncertainty =
                    (self.user_estimate.upper_estimate - self.user_estimate.lower_estimate) as f32
                        / 100.0;

                let aw_old = self.poll.accumulated_weights;
                let aws_old = self.poll.accumulated_weights_squared;
                let weight_old = (1.0 - old_uncertainty)
                    * self.user_estimate.score_weight
                    * self.user_estimate.recency_weight;

                let current_slot = Clock::get().unwrap().slot as f32;
                let new_recency_weight = recency_weight(
                    self.poll.decay_rate,
                    current_slot,
                    self.poll.start_slot as f32,
                );
                self.user_estimate.recency_weight = new_recency_weight;
                let weight_new =
                    (1.0 - new_uncertainty) * self.user_estimate.score_weight * new_recency_weight;

                let weight_diff = weight_new - weight_old;

                self.poll.accumulated_weights += weight_diff;
                self.poll.accumulated_weights_squared +=
                    weight_new * weight_new - weight_old * weight_old;

                let old_ue_f =
                    convert_to_float(10u32.pow(ESTIMATE_PRECISION as u32) * old_estimate as u32);
                let old_ce_f = convert_to_float(collective_estimate);
                let new_ue_f =
                    convert_to_float(10u32.pow(ESTIMATE_PRECISION as u32) * new_estimate as u32);

                let delta = weight_new * new_ue_f - weight_old * old_ue_f - weight_diff * old_ce_f;

                // update collective estimate
                let new_ce_f = old_ce_f + delta / self.poll.accumulated_weights;

                let new_collective_estimate = convert_from_float(new_ce_f);
                self.poll.collective_estimate = Some(new_collective_estimate);

                // update variance
                let var_old = self.poll.variance.unwrap();
                let var_new = ((2.0 * aw_old - aws_old / aw_old) * var_old
                    - 2.0 * delta * delta / self.poll.accumulated_weights
                    - weight_old
                        * (2.0 * (old_ce_f - old_ue_f) * (old_ce_f - old_ue_f)
                            + 0.5 * old_uncertainty * 100.0 * old_uncertainty * 100.0)
                    + weight_new
                        * (2.0 * (old_ce_f - new_ue_f) * (old_ce_f - new_ue_f)
                            + 0.5 * new_uncertainty * 100.0 * new_uncertainty * 100.0))
                    / (2.0 * self.poll.accumulated_weights
                        - self.poll.accumulated_weights_squared / self.poll.accumulated_weights);

                self.poll.variance = Some(var_new);

                // Calculate log of geometric mean
                let ln_p = (111111111 as f32 / 100.0 + EPSILON).ln();
                let old_ln_gm = self.poll.ln_gm.unwrap();
                let new_ln_gm = old_ln_gm + (ln_p - old_ln_gm) / (self.poll.num_forecasters as f32);

                self.poll.ln_gm = Some(new_ln_gm);

                let current_slot = Clock::get().unwrap().slot;

                // Update score list
                self.scoring_list.update(
                    old_ce_f,
                    var_old / 10000.0,
                    current_slot,
                    self.poll.num_forecasters as f32,
                    old_ln_gm,
                );

                // Update user score
                let last_user_score_slot = self.user_score.last_slot;
                // Idea to improve score_weight (still need to think about it):
                // Use ratio of num_forecaster when user made estimation and current num_forecasters
                // instead of just num_forecasters when user made estimation
                let score_weight = 0.49
                    * (2.0
                        + (-LN_2 * self.user_estimate.num_forecasters as f32 / 42.0).exp()
                        + 1000.0 / (1000.0 + self.user_estimate.num_forecasters as f32));
                self.user_score.ln_a += score_weight
                    * (current_slot - last_user_score_slot) as f32
                    * (1.0 - old_uncertainty * old_uncertainty)
                    * ((old_ue_f / 100.0 + EPSILON).ln() + LN_2);

                self.user_score.ln_b += score_weight
                    * (current_slot - last_user_score_slot) as f32
                    * (1.0 - old_uncertainty * old_uncertainty)
                    * ((1.0 - old_ue_f / 100.0 + EPSILON).ln() + LN_2);

                let add_option = (self.scoring_list.options
                    [self.user_estimate.upper_estimate as usize]
                    - self.user_score.last_upper_option
                    + self.scoring_list.options[self.user_estimate.lower_estimate as usize]
                    - self.user_score.last_lower_option)
                    / 2.0;

                let add_cost = (self.scoring_list.cost[self.user_estimate.upper_estimate as usize]
                    - self.user_score.last_upper_cost
                    + self.scoring_list.cost[self.user_estimate.lower_estimate as usize]
                    - self.user_score.last_lower_cost)
                    / 2.0;

                self.user_score.options += add_option;
                self.user_score.cost += add_cost;
                self.user_score.last_slot = current_slot;

                msg!("Updated collective estimate");
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

        Ok(())
    }

    pub fn update_user_estimate(&mut self, lower_estimate: u16, upper_estimate: u16) -> Result<()> {
        assert!(lower_estimate <= 100);
        assert!(upper_estimate <= 100);
        assert!(lower_estimate <= upper_estimate);
        if self.poll.end_slot.is_some() {
            return err!(CustomErrorCode::PollClosed);
        }
        self.user_estimate.lower_estimate = lower_estimate;
        self.user_estimate.upper_estimate = upper_estimate;
        self.user_estimate.num_forecasters = self.poll.num_forecasters;
        self.user_estimate.num_estimate_updates += 1;

        self.user_estimate_update.set_inner(UserEstimateUpdate::new(
            self.poll.key(),
            self.forecaster.key(),
            lower_estimate,
            upper_estimate,
        ));

        self.user_score.last_lower_option = self.scoring_list.options[lower_estimate as usize];
        self.user_score.last_upper_option = self.scoring_list.options[upper_estimate as usize];
        self.user_score.last_lower_cost = self.scoring_list.cost[lower_estimate as usize];
        self.user_score.last_upper_cost = self.scoring_list.cost[upper_estimate as usize];
        msg!("Updated user estimate");
        Ok(())
    }
}
