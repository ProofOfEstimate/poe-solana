use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct User {
    pub user_address: Pubkey,
    pub score: f32,
    pub participation_count: u32,
    pub correct_answers_count: u32,
    pub bump: u8,
}

impl User {
    pub const SEED_PREFIX: &'static str = "user";

    pub const LEN: usize = 8 + PUBKEY_L + F32_L + 2 * U32_L + U8_L;

    pub fn new(user_address: Pubkey, bump: u8) -> Self {
        Self {
            user_address,
            score: 100.0,
            participation_count: 0,
            correct_answers_count: 0,
            bump,
        }
    }
}
