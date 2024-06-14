use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

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
    pub state: Box<Account<'info, PoeState>>,
    #[account(seeds = [b"auth"], bump)]
    /// CHECK:
    pub auth: UncheckedAccount<'info>,
    #[account(
        init,
        seeds = ["poeken_mint".as_bytes()],
        bump,
        payer = payer,
        mint::decimals = 9,
        mint::authority = auth,
    )]
    pub mint: Box<Account<'info, Mint>>,
    #[account(
        init,
        payer=payer,
        seeds=[b"escrow"],
        bump,
        token::mint = mint,
        token::authority = auth
    )]
    pub escrow_account: Box<Account<'info, TokenAccount>>,
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
