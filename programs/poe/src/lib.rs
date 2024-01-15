use anchor_lang::prelude::*;

pub mod constants;
pub mod contexts;
pub mod errors;
pub mod states;
mod utils;

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

    pub fn make_estimate(
        ctx: Context<MakeEstimate>,
        lower_estimate: u16,
        upper_estimate: u16,
    ) -> Result<()> {
        let estimate = (lower_estimate + upper_estimate) / 2;
        let uncertainty = (upper_estimate - lower_estimate) as f32 / 100.0;
        ctx.accounts.init_estimate_account(
            &ctx.bumps,
            lower_estimate,
            upper_estimate,
            ctx.accounts.user.score,
        )?;
        ctx.accounts
            .update_collective_estimate(&ctx.bumps, estimate, uncertainty)
    }
}
