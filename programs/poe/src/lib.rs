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
}
