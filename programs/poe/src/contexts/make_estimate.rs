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
pub struct MakeEstimate<'info> {
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
      init,
      payer = forecaster,
      seeds=[UserEstimate::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
      space = UserEstimate::LEN,
      bump,
    )]
    pub user_estimate: Box<Account<'info, UserEstimate>>,
    #[account(
        init,
        payer = forecaster,
        seeds=[PollEstimateUpdate::SEED_PREFIX.as_bytes(), poll.key().as_ref(), &poll.num_estimate_updates.to_le_bytes()],
        space= PollEstimateUpdate::LEN,
        bump,
    )]
    pub poll_estimate_update: Box<Account<'info, PollEstimateUpdate>>,
    #[account(
        mut,
        seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
        bump
    )]
    pub scoring_list: AccountLoader<'info, ScoringList>,
    #[account(
        init,
        payer = forecaster,
        seeds=[UserScore::SEED_PREFIX.as_bytes(), poll.key().as_ref(), forecaster.key().as_ref()],
        space = UserScore::LEN,
        bump,
      )]
    pub user_score: Box<Account<'info, UserScore>>,
    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = forecaster
    )]
    pub forecaster_token_account: Box<Account<'info, TokenAccount>>,
    #[account(
        seeds = ["poeken_mint".as_bytes()],
        bump,
        mut
    )]
    pub mint: Box<Account<'info, Mint>>,
    #[account(seeds = [b"auth"], bump)]
    /// CHECK:
    pub auth: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds=[b"escrow"],
        bump,
        token::mint = mint,
        token::authority = auth
    )]
    pub escrow_account: Box<Account<'info, TokenAccount>>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> MakeEstimate<'info> {
    pub fn sanity_checks(
        &self,
        lower_estimate: u16,
        upper_estimate: u16,
        estimate: u16,
    ) -> Result<()> {
        assert!(lower_estimate <= 100);
        assert!(upper_estimate <= 100);
        assert!(lower_estimate <= upper_estimate);
        assert!(estimate <= 100);

        if self.poll.end_slot.is_some() {
            return err!(CustomErrorCode::PollClosed);
        }

        Ok(())
    }

    pub fn transfer_stake(&self) -> Result<()> {
        let cpi_accounts = token::Transfer {
            from: self.forecaster_token_account.to_account_info(),
            to: self.escrow_account.to_account_info(),
            authority: self.forecaster.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);

        token::transfer(cpi_ctx, self.poll.betting_amount)
    }

    pub fn init_estimate_account(
        &mut self,
        bumps: &MakeEstimateBumps,
        lower_estimate: u16,
        upper_estimate: u16,
    ) -> Result<()> {
        let current_slot = Clock::get().unwrap().slot;
        let recency_w: f32;
        if self.poll.has_started {
            recency_w = recency_weight(
                self.poll.decay_rate,
                current_slot as f32,
                self.poll.start_slot as f32,
            );
        } else {
            recency_w = 1.0
        }

        self.user_estimate.set_inner(UserEstimate::new(
            self.forecaster.key(),
            self.poll.key(),
            lower_estimate,
            upper_estimate,
            self.user.score,
            recency_w,
            self.poll.num_forecasters + 1,
            bumps.user_estimate,
        ));

        self.user.participation_count += 1;

        msg!("Created user estimate account");
        Ok(())
    }

    pub fn update_collective_estimate(
        &mut self,
        bumps: &MakeEstimateBumps,
        estimate: u16,
        uncertainty: f32,
    ) -> Result<()> {
        let mut scoring_list = self.scoring_list.load_mut()?;
        match self.poll.collective_estimate {
            Some(collective_estimate) => {
                assert!(self.poll.num_forecasters > 0);
                assert!(self.poll.num_estimate_updates > 0);
                self.poll.num_forecasters += 1;
                self.poll.num_estimate_updates += 1;

                let aw_old = self.poll.accumulated_weights;
                let aws_old = self.poll.accumulated_weights_squared;
                let weight = (1.0 - uncertainty)
                    * self.user_estimate.score_weight
                    * self.user_estimate.recency_weight;

                self.poll.accumulated_weights += weight;
                self.poll.accumulated_weights_squared += weight * weight;

                let ce_f = convert_to_float(collective_estimate);
                let ue_f = convert_to_float(10u32.pow(ESTIMATE_PRECISION as u32) * estimate as u32);
                let delta = ue_f - ce_f;

                // Calculate mean
                let new_ce_f = ce_f + weight * delta / self.poll.accumulated_weights;
                let new_collective_estimate = convert_from_float(new_ce_f);
                self.poll.collective_estimate = Some(new_collective_estimate);

                // Calculate variance
                let var_old = self.poll.variance.unwrap();
                let var_new = ((2.0 * aw_old - aws_old / aw_old) * var_old
                    + 2.0
                        * weight
                        * delta
                        * delta
                        * (1.0 - weight / self.poll.accumulated_weights)
                    + 0.5 * weight * uncertainty * 100.0 * uncertainty * 100.0)
                    / (2.0 * self.poll.accumulated_weights
                        - self.poll.accumulated_weights_squared / self.poll.accumulated_weights);

                self.poll.variance = Some(var_new);

                // Calculate log of geometric mean
                let ln_p_a = LOGS[estimate as usize];
                let old_ln_gm_a = self.poll.ln_gm_a.unwrap();
                let new_ln_gm_a =
                    old_ln_gm_a + (ln_p_a - old_ln_gm_a) / (self.poll.num_forecasters as f32);

                self.poll.ln_gm_a = Some(new_ln_gm_a);

                let ln_p_b = LOGS[100 - estimate as usize];
                let old_ln_gm_b = self.poll.ln_gm_b.unwrap();
                let new_ln_gm_b =
                    old_ln_gm_b + (ln_p_b - old_ln_gm_b) / (self.poll.num_forecasters as f32);

                self.poll.ln_gm_b = Some(new_ln_gm_b);

                let current_slot = Clock::get().unwrap().slot;

                scoring_list.update(
                    ce_f,
                    var_old / 10000.0,
                    current_slot,
                    self.poll.num_forecasters as f32 - 1.0,
                    old_ln_gm_a,
                    old_ln_gm_b,
                );

                msg!("Updated collective estimate");
            }
            None => {
                assert!(self.poll.num_forecasters == 0);
                self.poll.collective_estimate =
                    Some(10u32.pow(ESTIMATE_PRECISION as u32) * estimate as u32);
                self.poll.variance = Some(0.5 * uncertainty * uncertainty * 10000.0);
                self.poll.ln_gm_a = Some(LOGS[estimate as usize]);
                self.poll.ln_gm_b = Some(LOGS[100 - estimate as usize]);
                self.poll.num_forecasters = 1;
                self.poll.accumulated_weights = (1.0 - uncertainty)
                    * self.user_estimate.score_weight
                    * self.user_estimate.recency_weight;
                self.poll.accumulated_weights_squared = (1.0 - uncertainty)
                    * (1.0 - uncertainty)
                    * self.user_estimate.score_weight
                    * self.user_estimate.score_weight
                    * self.user_estimate.recency_weight
                    * self.user_estimate.recency_weight;
                self.poll.num_estimate_updates += 1;

                let current_slot = Clock::get().unwrap().slot;
                scoring_list.new(current_slot);
            }
        }

        let last_lower_option = scoring_list.options[self.user_estimate.lower_estimate as usize];
        let last_upper_option = scoring_list.options[self.user_estimate.upper_estimate as usize];
        let last_lower_cost = scoring_list.cost[self.user_estimate.lower_estimate as usize];
        let last_upper_cost = scoring_list.cost[self.user_estimate.upper_estimate as usize];

        let last_peer_score_a = scoring_list.peer_score_a[estimate as usize];
        let last_peer_score_b = scoring_list.peer_score_b[estimate as usize];

        self.user_score.set_inner(UserScore::new(
            self.forecaster.key(),
            self.poll.key(),
            last_lower_option,
            last_upper_option,
            last_lower_cost,
            last_upper_cost,
            last_peer_score_a,
            last_peer_score_b,
            bumps.user_score,
        ));

        self.poll_estimate_update.set_inner(PollEstimateUpdate::new(
            self.poll.key(),
            self.poll.collective_estimate,
            self.poll.variance,
            bumps.poll_estimate_update,
        ));

        Ok(())
    }
}
