use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct UserEstimate {
    pub forecaster: Pubkey,
    pub poll: Pubkey,
    pub lower_estimate: u16,
    pub upper_estimate: u16,
    pub score_weight: f32,
    pub recency_weight: f32,
    pub num_forecasters: u64,
    pub num_estimate_updates: u64,
    pub reputation_score: Option<f32>,
    pub payout_score: Option<f32>,
    pub bump: u8,
}

impl UserEstimate {
    pub const SEED_PREFIX: &'static str = "user_estimate";

    pub const LEN: usize =
        8 + 2 * PUBKEY_L + 2 * U16_L + 2 * F32_L + 2 * U64_L + 2 * OPTION_L + 2 * F32_L + U8_L;

    pub fn new(
        forecaster: Pubkey,
        poll: Pubkey,
        lower_estimate: u16,
        upper_estimate: u16,
        score_weight: f32,
        recency_weight: f32,
        num_forecasters: u64,
        bump: u8,
    ) -> Self {
        Self {
            forecaster,
            poll,
            lower_estimate,
            upper_estimate,
            score_weight,
            recency_weight,
            num_forecasters,
            num_estimate_updates: 1,
            reputation_score: None,
            payout_score: None,
            bump,
        }
    }

    pub fn get_estimate(&self) -> u16 {
        (self.lower_estimate + self.upper_estimate) / 2
    }
}
