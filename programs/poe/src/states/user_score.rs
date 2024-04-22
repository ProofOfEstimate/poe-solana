use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct UserScore {
    pub forecaster: Pubkey,
    pub poll: Pubkey,
    pub options: f32,
    pub last_lower_option: f32,
    pub last_upper_option: f32,
    pub cost: f32,
    pub last_lower_cost: f32,
    pub last_upper_cost: f32,
    pub last_peer_score: f32,
    pub ln_a: f32,
    pub ln_b: f32,
    pub peer_score_a: f32,
    pub peer_score_b: f32,
    pub last_slot: u64,
    pub bump: u8,
}

impl UserScore {
    pub const SEED_PREFIX: &'static str = "user_score";

    pub const LEN: usize = 8 + 2 * PUBKEY_L + 11 * F32_L + U64_L + U8_L;

    pub fn new(
        forecaster: Pubkey,
        poll: Pubkey,
        last_lower_option: f32,
        last_upper_option: f32,
        last_lower_cost: f32,
        last_upper_cost: f32,
        last_peer_score: f32,
        bump: u8,
    ) -> Self {
        Self {
            forecaster,
            poll,
            options: 0.0,
            last_lower_option,
            last_upper_option,
            cost: 0.0,
            last_lower_cost,
            last_upper_cost,
            last_peer_score,
            ln_a: 0.0,
            ln_b: 0.0,
            peer_score_a: 0.0,
            peer_score_b: 0.0,
            last_slot: Clock::get().unwrap().slot,
            bump,
        }
    }
}
