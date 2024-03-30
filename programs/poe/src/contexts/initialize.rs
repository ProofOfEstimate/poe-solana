use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

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
    #[account(
        init,
        seeds = ["poeken_mint".as_bytes()],
        bump,
        payer = payer,
        mint::decimals = 9,
        mint::authority = mint,
    )]
    pub mint: Account<'info, Mint>,
    pub token_program: Program<'info, Token>,
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
