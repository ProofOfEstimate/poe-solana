use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct PoeState {
    pub authority: Pubkey,
    pub num_polls: u64,
    pub score: f32,
    pub recalibration_factor: f32,
    pub bump: u8,
}

impl PoeState {
    pub const SEED_PREFIX: &'static str = "poe_state";

    pub const LEN: usize = 8 + PUBKEY_L + U64_L + 2 * F32_L + U8_L;

    pub fn new(authority: Pubkey, bump: u8) -> Self {
        Self {
            authority,
            num_polls: 0,
            score: 0.0,
            recalibration_factor: 2.0,
            bump,
        }
    }
}
