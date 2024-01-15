use anchor_lang::prelude::*;

declare_id!("CTrJepGaLrejcRmoRAhC3vdyF2JvJPjT8vebCWutMDYE");

#[program]
pub mod poe {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
