use crate::errors::*;
use crate::states::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(question: String, description: String)]
pub struct StartPoll<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
      mut,
      seeds=[Poll::SEED_PREFIX.as_bytes(), &poll.id.to_le_bytes()],
      has_one=creator,
      bump=poll.bump
    )]
    pub poll: Box<Account<'info, Poll>>,
    pub system_program: Program<'info, System>,
}

impl<'info> StartPoll<'info> {
    pub fn start_poll(&mut self) -> Result<()> {
        if self.poll.has_started {
            return err!(CustomErrorCode::PollAlreadyStarted);
        }
        let current_slot = Clock::get().unwrap().slot;
        self.poll.start_slot = current_slot;
        self.poll.has_started = true;

        msg!("Started poll");
        Ok(())
    }
}
