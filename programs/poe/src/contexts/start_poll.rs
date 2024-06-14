use crate::errors::*;
use crate::states::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
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
    #[account(
      mut,
      seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
      bump
  )]
    pub scoring_list: AccountLoader<'info, ScoringList>,
    pub system_program: Program<'info, System>,
}

impl<'info> StartPoll<'info> {
    pub fn start_poll(&mut self) -> Result<()> {
        if self.poll.has_started {
            return err!(CustomErrorCode::PollAlreadyStarted);
        }
        let mut scoring_list = self.scoring_list.load_mut()?;
        let current_slot = Clock::get().unwrap().slot;
        self.poll.start_slot = current_slot;
        self.poll.has_started = true;

        scoring_list.new(current_slot);

        msg!("Started poll");
        Ok(())
    }
}
