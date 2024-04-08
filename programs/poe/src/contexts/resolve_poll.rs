use anchor_lang::prelude::*;

use crate::{errors::*, states::*, utils::convert_to_float};

#[derive(Accounts)]
pub struct ResolvePoll<'info> {
    #[account(mut)]
    pub resolver: Signer<'info>,
    #[account(
        mut,
        has_one = resolver,
        seeds=[Poll::SEED_PREFIX.as_bytes(), &poll.id.to_le_bytes()],
        bump=poll.bump
    )]
    pub poll: Box<Account<'info, Poll>>,
    #[account(
        mut,
        seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
        bump
    )]
    pub scoring_list: AccountLoader<'info, ScoringList>,
    pub system_program: Program<'info, System>,
}

impl<'info> ResolvePoll<'info> {
    pub fn resolve_poll(&mut self, result: bool) -> Result<()> {
        if self.poll.result.is_some() {
            return err!(CustomErrorCode::PollAlreadyResolved);
        }
        let mut scoring_list = self.scoring_list.load_mut()?;
        let current_slot = Clock::get().unwrap().slot;

        if let Some(collective_estimate) = self.poll.collective_estimate {
            let ce_f = convert_to_float(collective_estimate);
            let variance = self.poll.variance.unwrap() / 10000.0;

            // Update score list
            scoring_list.update(
                ce_f,
                variance,
                current_slot,
                self.poll.num_forecasters as f32,
                self.poll.ln_gm.unwrap(),
            )
        }

        self.poll.result = Some(result);
        self.poll.end_slot = Some(current_slot);
        msg!("Resolved poll");
        Ok(())
    }
}
