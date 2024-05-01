use anchor_lang::prelude::*;

use crate::states::*;

#[derive(Accounts)]
#[instruction(question: String, description: String)]
pub struct CreatePoll<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    /// CHECK: This is not dangerous because we don't read or write from this account
    pub resolver: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds=[PoeState::SEED_PREFIX.as_bytes()],
        bump = state.bump
    )]
    pub state: Box<Account<'info, PoeState>>,
    #[account(
        init,
        payer = creator,
        seeds=[Poll::SEED_PREFIX.as_bytes(), &state.num_polls.to_le_bytes()],
        space=Poll::len(&question, &description),
        bump
    )]
    pub poll: Box<Account<'info, Poll>>,
    #[account(
        init,
        payer = creator,
        seeds=[ScoringList::SEED_PREFIX.as_bytes(), poll.key().as_ref()],
        space=ScoringList::LEN,
        bump
    )]
    pub scoring_list: AccountLoader<'info, ScoringList>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreatePoll<'info> {
    pub fn create_poll(
        &mut self,
        bumps: &CreatePollBumps,
        question: String,
        description: String,
        category: u16,
        decay: f32,
    ) -> Result<()> {
        let current_slot = Clock::get().unwrap().slot;
        self.poll.set_inner(Poll::new(
            *self.creator.key,
            *self.resolver.key,
            self.state.num_polls,
            category,
            question,
            description,
            current_slot,
            decay,
            bumps.poll,
        ));

        self.state.num_polls += 1;
        msg!("Created poll");
        Ok(())
    }
}
