use anchor_lang::prelude::*;

pub mod constants;
pub mod contexts;
pub mod states;

use contexts::*;

declare_id!("CTrJepGaLrejcRmoRAhC3vdyF2JvJPjT8vebCWutMDYE");

#[program]
pub mod poe {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        ctx.accounts.initialize(&ctx.bumps)
    }

    pub fn register_user(ctx: Context<RegisterUser>) -> Result<()> {
        ctx.accounts.register_user(&ctx.bumps)
    }

    pub fn create_poll(
        ctx: Context<CreatePoll>,
        question: String,
        description: String,
        end_time: Option<i64>,
    ) -> Result<()> {
        ctx.accounts
            .create_poll(&ctx.bumps, question, description, end_time)
    }
}
