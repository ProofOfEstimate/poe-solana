use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct Poll {
    pub creator: Pubkey,
    pub resolver: Pubkey,
    pub id: u64,
    pub start_slot: u64,
    pub end_slot: Option<u64>,
    pub decay_rate: f32,
    pub collective_estimate: Option<u32>,
    pub variance: Option<f32>,
    pub num_forecasters: u64,
    pub num_estimate_updates: u64,
    pub accumulated_weights: f32,
    pub accumulated_weights_squared: f32,
    pub result: Option<bool>,
    pub question: String,
    pub description: String,
    pub bump: u8,
}

impl Poll {
    pub const SEED_PREFIX: &'static str = "poll";

    pub fn len(question: &str, description: &str) -> usize {
        8 + PUBKEY_L
            + PUBKEY_L
            + 4 * OPTION_L
            + 5 * U64_L
            + U32_L
            + 4 * F32_L
            + BOOL_L
            + 2 * STRING_L
            + question.len()
            + description.len()
            + U8_L
    }

    pub fn new(
        creator: Pubkey,
        resolver: Pubkey,
        id: u64,
        question: String,
        description: String,
        start_slot: u64,
        decay_rate: f32,
        bump: u8,
    ) -> Self {
        Self {
            creator,
            resolver,
            id,
            question,
            description,
            start_slot,
            end_slot: None,
            decay_rate,
            collective_estimate: None,
            variance: None,
            num_forecasters: 0,
            num_estimate_updates: 0,
            accumulated_weights: 0.0,
            accumulated_weights_squared: 0.0,
            result: None,
            bump,
        }
    }
}
