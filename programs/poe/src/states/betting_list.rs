use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct BettingList {
    pub peer_score: Vec<f32>,
    pub last_slot: u64,
    pub bump: u8,
}

impl BettingList {
    pub const SEED_PREFIX: &'static str = "betting_list";

    pub const LEN: usize = 8 + 4 + 101 * F32_L + 4 + 101 * F32_L + U64_L + U8_L;

    pub fn new(last_slot: u64, bump: u8) -> Self {
        Self {
            peer_score: vec![0.0; 101],
            last_slot,
            bump,
        }
    }

    pub fn update(&mut self, ln_gm: f32, current_slot: u64) {
        let last_slot = self.last_slot;

        for (estimate, score) in self.peer_score.iter_mut().enumerate() {
            *score += ((estimate as f32 / 100.0 + EPSILON).ln() - ln_gm)
                * (current_slot - last_slot) as f32;
        }

        self.last_slot = current_slot;
    }
}
