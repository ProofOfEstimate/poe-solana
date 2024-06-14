use std::f32::consts::LN_2;

use crate::constants::EPSILON;
use crate::constants::LOGS;
use crate::errors::*;
use crate::states::*;
use crate::utils::*;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token;
use anchor_spl::token::Mint;
use anchor_spl::token::Token;
use anchor_spl::token::TokenAccount;

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
    )]
    pub user_estimate: Box<Account<'info, UserEstimate>>,
    #[account(
        mut,
        seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
        bump
    )]
    pub scoring_list: AccountLoader<'info, ScoringList>,
    #[account(
        mut,
        seeds=[UserScore::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
        bump=user_score.bump,
        close = payer
      )]
    pub user_score: Box<Account<'info, UserScore>>,
    #[account(seeds = [b"auth"], bump)]
    /// CHECK:
    pub auth: UncheckedAccount<'info>,
    #[account(
        seeds = ["poeken_mint".as_bytes()],
        bump,
        mut
    )]
    pub mint: Box<Account<'info, Mint>>,
    #[account(
        mut,
        seeds=[b"escrow"],
        bump,
        token::mint = mint,
        token::authority = auth
    )]
    pub escrow_account: Box<Account<'info, TokenAccount>>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = forecaster
    )]
    pub forecaster_token_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> CollectPoints<'info> {
    pub fn collect_points(&mut self) -> Result<()> {
        if self.poll.result.is_none() {
            return err!(CustomErrorCode::PollNotResolved);
        }
        let scoring_list = self.scoring_list.load()?;
        assert!(self.poll.num_forecasters > 0);
        assert!(self.poll.num_estimate_updates > 0);
        assert!(self.poll.accumulated_weights > 0.0);

        let user_estimate = self.user_estimate.get_estimate();
        let uncertainty =
            (self.user_estimate.upper_estimate - self.user_estimate.lower_estimate) as f32 / 100.0;
        let ue_f = convert_to_float(10u32.pow(ESTIMATE_PRECISION as u32) * user_estimate as u32);

        // Update user score
        let last_poll_slot = self.poll.end_slot.unwrap();
        let last_user_score_slot = self.user_score.last_slot.max(self.poll.start_slot);

        // Idea to improve score_weight (still need to think about it):
        // Use ratio of num_forecaster when user made estimation and current num_forecasters
        // instead of just num_forecasters when user made estimation
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

        let add_option = (scoring_list.options[self.user_estimate.upper_estimate as usize]
            - self.user_score.last_upper_option
            + scoring_list.options[self.user_estimate.lower_estimate as usize]
            - self.user_score.last_lower_option)
            / 2.0;

        let add_cost = (scoring_list.cost[self.user_estimate.upper_estimate as usize]
            - self.user_score.last_upper_cost
            + scoring_list.cost[self.user_estimate.lower_estimate as usize]
            - self.user_score.last_lower_cost)
            / 2.0;

        let add_peer_score_a =
            scoring_list.peer_score_a[user_estimate as usize] - self.user_score.last_peer_score_a;
        let add_peer_score_b =
            scoring_list.peer_score_b[user_estimate as usize] - self.user_score.last_peer_score_b;

        self.user_score.last_lower_option =
            scoring_list.options[self.user_estimate.lower_estimate as usize];
        self.user_score.last_upper_option =
            scoring_list.options[self.user_estimate.upper_estimate as usize];
        self.user_score.last_lower_cost =
            scoring_list.cost[self.user_estimate.lower_estimate as usize];
        self.user_score.last_upper_cost =
            scoring_list.cost[self.user_estimate.upper_estimate as usize];
        self.user_score.last_peer_score_a = scoring_list.peer_score_a[user_estimate as usize];
        self.user_score.last_peer_score_b = scoring_list.peer_score_b[user_estimate as usize];

        self.user_score.options += add_option;
        self.user_score.cost += add_cost;
        self.user_score.peer_score_a += add_peer_score_a;
        self.user_score.peer_score_b += add_peer_score_b;
        self.user_score.last_slot = last_poll_slot;

        Ok(())
    }

    pub fn transfer_points_to_user(&mut self, bumps: &CollectPointsBumps) -> Result<()> {
        if let Some(result) = self.poll.result {
            let scaled_peer_score;
            let duration = self.poll.end_slot.unwrap() - self.poll.start_slot;
            // Adding 216000 slots (~1 day) to decrease points of short polls
            // let longer_duration = duration + 216000u64;
            if result {
                let score = 2.0
                    * (self.user_score.options as f32 - self.user_score.cost
                        + self.user_score.ln_a)
                    / duration as f32;
                self.user.score += score;
                self.user.score = self.user.score.max(0.0001);
                if score > 0.0 {
                    self.user.correct_answers_count += 1;
                }
                scaled_peer_score =
                    ((self.user_score.peer_score_a / (-1.0 * LOGS[0] * duration as f32) + 1.0)
                        * 1000000.0) as u64;

                // Store this info in user_estimate so user_score account can be closed
                self.user_estimate.reputation_score = Some(score);
                self.user_estimate.payout_score = Some(scaled_peer_score as f32 / 1000000.0);
            } else {
                let score = 2.0 * (self.user_score.ln_b - self.user_score.cost) / duration as f32;
                self.user.score += score;
                self.user.score = self.user.score.max(0.0001);
                if score > 0.0 {
                    self.user.correct_answers_count += 1;
                }
                scaled_peer_score =
                    ((self.user_score.peer_score_b / (-1.0 * LOGS[0] * duration as f32) + 1.0)
                        * 1000000.0) as u64;

                // Store this info in user_estimate so user_score account can be closed
                self.user_estimate.reputation_score = Some(score);
                self.user_estimate.payout_score = Some(scaled_peer_score as f32 / 1000000.0);
            }

            let cpi_accounts = token::Transfer {
                from: self.escrow_account.to_account_info(),
                to: self.forecaster_token_account.to_account_info(),
                authority: self.auth.to_account_info(),
            };

            token::transfer(
                CpiContext::new_with_signer(
                    self.token_program.to_account_info(),
                    cpi_accounts,
                    &[&["auth".as_bytes(), &[bumps.auth]]],
                ),
                self.poll.betting_amount / 1000000 * scaled_peer_score,
            )?;
        }

        msg!("Collected points");
        Ok(())
    }
}
