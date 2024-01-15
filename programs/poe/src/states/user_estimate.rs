use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct UserEstimate {
    pub forecaster: Pubkey,
    pub poll: Pubkey,
    pub lower_estimate: u16,
    pub upper_estimate: u16,
    pub weight: f32,
    pub num_forecasters: u64,
    pub num_estimate_updates: u64,
    pub options: Option<f32>,
    pub cost: Option<f32>,
    pub ln_a: Option<f32>,
    pub ln_b: Option<f32>,
    pub bump: u8,
}

impl UserEstimate {
    pub const SEED_PREFIX: &'static str = "user_estimate";

    pub const LEN: usize =
        8 + 2 * PUBKEY_L + U16_L + U16_L + F32_L + 2 * U64_L + 4 * OPTION_L + 4 * F32_L + U8_L;

    pub fn new(
        forecaster: Pubkey,
        poll: Pubkey,
        lower_estimate: u16,
        upper_estimate: u16,
        weight: f32,
        num_forecasters: u64,
        bump: u8,
    ) -> Self {
        Self {
            forecaster,
            poll,
            lower_estimate,
            upper_estimate,
            weight,
            num_forecasters,
            num_estimate_updates: 1,
            options: None,
            cost: None,
            ln_a: None,
            ln_b: None,
            bump,
        }
    }

    pub fn get_estimate(&self) -> u16 {
        (self.lower_estimate + self.upper_estimate) / 2
    }
}
