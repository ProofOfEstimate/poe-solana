use anchor_lang::prelude::*;

use crate::states::*;

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        seeds=[PoeState::SEED_PREFIX.as_bytes()],
        space=PoeState::LEN,
        bump
    )]
    pub state: Account<'info, PoeState>,
    pub system_program: Program<'info, System>,
}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self, bumps: &InitializeBumps) -> Result<()> {
        self.state
            .set_inner(PoeState::new(*self.payer.key, bumps.state));
        msg!("Initialized POE.");
        Ok(())
    }
}
