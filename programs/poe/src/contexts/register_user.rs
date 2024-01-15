use anchor_lang::prelude::*;

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
    pub system_program: Program<'info, System>,
}

impl<'info> RegisterUser<'info> {
    pub fn register_user(&mut self, bumps: &RegisterUserBumps) -> Result<()> {
        self.user.set_inner(User::new(bumps.user));
        msg!("User registered");
        Ok(())
    }
}
