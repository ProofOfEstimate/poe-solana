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
    pub poll: Account<'info, Poll>,
    #[account(
        mut,
        seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
        bump=scoring_list.bump
    )]
    pub scoring_list: Box<Account<'info, ScoringList>>,
    pub system_program: Program<'info, System>,
}

impl<'info> ResolvePoll<'info> {
    pub fn resolve_poll(&mut self, result: bool) -> Result<()> {
        if !self.poll.open {
            return err!(CustomErrorCode::PollClosed);
        }
        let current_slot = Clock::get().unwrap().slot;

        if let Some(collective_estimate) = self.poll.collective_estimate {
            let ce_f = convert_to_float(collective_estimate);
            let variance = self.poll.variance.unwrap() / 10000.0;

            // Update score list
            self.scoring_list.update(
                ce_f,
                variance,
                current_slot,
                self.poll.num_forecasters as f32,
            )
        }

        self.poll.open = false;
        self.poll.result = Some(result);
        self.poll.end_slot = Some(current_slot);
        self.poll.end_time = Some(Clock::get().unwrap().unix_timestamp);
        msg!("Resolved poll");
        Ok(())
    }
}
