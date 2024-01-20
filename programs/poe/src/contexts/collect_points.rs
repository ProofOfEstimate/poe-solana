use std::f32::consts::LN_2;

use crate::constants::EPSILON;
use crate::errors::*;
use crate::states::*;
use crate::utils::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct CollectPoints<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK: It is the public key of the account where the points will be collected
    pub forecaster: UncheckedAccount<'info>,
    #[account(
      mut,
      seeds=[User::SEED_PREFIX.as_bytes(), forecaster.key().as_ref()],
      bump=user.bump,
    )]
    pub user: Account<'info, User>,
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
        close = payer
      )]
    pub user_score: Account<'info, UserScore>,
    pub system_program: Program<'info, System>,
}

impl<'info> CollectPoints<'info> {
    pub fn collect_points(&mut self) -> Result<()> {
        if self.poll.open {
            return err!(CustomErrorCode::PollNotResolved);
        }

        assert!(self.poll.num_forecasters > 0);
        assert!(self.poll.num_estimate_updates > 0);
        assert!(self.poll.accumulated_weights > 0.0);

        let user_estimate = self.user_estimate.get_estimate();
        let uncertainty =
            (self.user_estimate.upper_estimate - self.user_estimate.lower_estimate) as f32 / 100.0;
        let ue_f = convert_to_float(10u32.pow(ESTIMATE_PRECISION as u32) * user_estimate as u32);

        // Update user score
        let last_poll_slot = self.poll.end_slot.unwrap();
        let last_user_score_slot = self.user_score.last_slot;

        let score_weight = 0.49
            * (2.0
                + (-LN_2 * self.user_estimate.num_forecasters as f32 / 42.0).exp()
                + 1000.0 / (1000.0 + self.user_estimate.num_forecasters as f32));
        self.user_score.ln_a += score_weight
            * (last_poll_slot - last_user_score_slot) as f32
            * (1.0 - uncertainty * uncertainty)
            * ((ue_f / 100.0 + EPSILON).ln() + LN_2);

        self.user_score.ln_b += score_weight
            * (last_poll_slot - last_user_score_slot) as f32
            * (1.0 - uncertainty * uncertainty)
            * ((1.0 - ue_f / 100.0 + EPSILON).ln() + LN_2);

        let add_option = (self.scoring_list.options[self.user_estimate.upper_estimate as usize]
            - self.user_score.last_upper_option
            + self.scoring_list.options[self.user_estimate.lower_estimate as usize]
            - self.user_score.last_lower_option)
            / 2.0;

        let add_cost = (self.scoring_list.cost[self.user_estimate.upper_estimate as usize]
            - self.user_score.last_upper_cost
            + self.scoring_list.cost[self.user_estimate.lower_estimate as usize]
            - self.user_score.last_lower_cost)
            / 2.0;

        self.user_score.last_lower_option =
            self.scoring_list.options[self.user_estimate.lower_estimate as usize];
        self.user_score.last_upper_option =
            self.scoring_list.options[self.user_estimate.upper_estimate as usize];
        self.user_score.last_lower_cost =
            self.scoring_list.cost[self.user_estimate.lower_estimate as usize];
        self.user_score.last_upper_cost =
            self.scoring_list.cost[self.user_estimate.upper_estimate as usize];

        self.user_score.options += add_option;
        self.user_score.cost += add_cost;
        self.user_score.last_slot = last_poll_slot;

        Ok(())
    }

    pub fn transfer_points_to_user(&mut self) -> Result<()> {
        if let Some(result) = self.poll.result {
            let duration = self.poll.end_slot.unwrap() - self.poll.start_slot;
            if result {
                let score = (self.user_score.options as f32 - self.user_score.cost
                    + self.user_score.ln_a)
                    / duration as f32;
                self.user.score += score;
                self.user.score = self.user.score.max(1.0);
                if score > 0.0 {
                    self.user.correct_answers_count += 1;
                }
            } else {
                let score = (self.user_score.ln_b - self.user_score.cost) / duration as f32;
                self.user.score += score;
                self.user.score = self.user.score.max(1.0);
                if score > 0.0 {
                    self.user.correct_answers_count += 1;
                }
            }
        }

        // Store this info in user_estimate so user_score account can be closed
        self.user_estimate.options = Some(self.user_score.options);
        self.user_estimate.cost = Some(self.user_score.cost);
        self.user_estimate.ln_a = Some(self.user_score.ln_a);
        self.user_estimate.ln_b = Some(self.user_score.ln_b);

        msg!("Collected points");
        Ok(())
    }
}
