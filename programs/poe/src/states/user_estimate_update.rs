use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct UserEstimateUpdate {
    pub poll: Pubkey,
    pub user: Pubkey,
    pub slot: u64,
    pub timestamp: i64,
    pub lower_estimate: u16,
    pub upper_estimate: u16,
}

impl UserEstimateUpdate {
    pub const SEED_PREFIX: &'static str = "user_estimate_update";

    pub const LEN: usize = 8 + 2 * PUBKEY_L + U64_L + I64_L + 2 * U16_L;

    pub fn new(
        poll_address: Pubkey,
        user_address: Pubkey,
        lower_estimate: u16,
        upper_estimate: u16,
    ) -> Self {
        Self {
            poll: poll_address,
            user: user_address,
            slot: Clock::get().unwrap().slot,
            timestamp: Clock::get().unwrap().unix_timestamp,
            lower_estimate,
            upper_estimate,
        }
    }
}
