use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct User {
    pub score: f32,
    pub participation_count: u32,
    pub correct_answers_count: u32,
    pub bump: u8,
}

impl User {
    pub const SEED_PREFIX: &'static str = "user";

    pub const LEN: usize = 8 + F32_L + 2 * U32_L + U8_L;

    pub fn new(bump: u8) -> Self {
        Self {
            score: 1.0,
            participation_count: 0,
            correct_answers_count: 0,
            bump,
        }
    }
}
