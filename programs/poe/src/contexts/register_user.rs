use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

use crate::states::*;

#[derive(Accounts)]
pub struct RegisterUser<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init,
        payer = payer,
        seeds=[User::SEED_PREFIX.as_bytes(), payer.key().as_ref()],
        space=User::LEN,
        bump
    )]
    pub user: Account<'info, User>,
    #[account(
        seeds = ["poeken_mint".as_bytes()],
        bump,
        mut
    )]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer
    )]
    pub token_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> RegisterUser<'info> {
    pub fn register_user(&mut self, bumps: &RegisterUserBumps) -> Result<()> {
        self.user.set_inner(User::new(bumps.user));
        msg!("User registered");
        Ok(())
    }

    pub fn mint_tokens(&mut self, bumps: &RegisterUserBumps) -> Result<()> {
        mint_to(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                MintTo {
                    authority: self.mint.to_account_info(),
                    to: self.token_account.to_account_info(),
                    mint: self.mint.to_account_info(),
                },
                &[&["poeken_mint".as_bytes(), &[bumps.mint]]],
            ),
            1000 * 10u64.pow(9),
        )?;

        msg!("Minted tokens");

        Ok(())
    }
}
