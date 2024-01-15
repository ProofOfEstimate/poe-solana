use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct PollEstimateUpdate {
    pub poll: Pubkey,
    pub slot: u64,
    pub timestamp: i64,
    pub estimate: Option<u32>,
    pub variance: Option<f32>,
    pub bump: u8,
}

impl PollEstimateUpdate {
    pub const SEED_PREFIX: &'static str = "poll_estimate_update";

    pub const LEN: usize = 8 + PUBKEY_L + U64_L + I64_L + 2 * OPTION_L + U32_L + F32_L + U8_L;

    pub fn new(
        poll_address: Pubkey,
        estimate: Option<u32>,
        variance: Option<f32>,
        bump: u8,
    ) -> Self {
        Self {
            poll: poll_address,
            slot: Clock::get().unwrap().slot,
            timestamp: Clock::get().unwrap().unix_timestamp,
            estimate,
            variance,
            bump,
        }
    }
}
