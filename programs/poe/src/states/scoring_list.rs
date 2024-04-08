use std::f32::consts::LN_2;

use anchor_lang::prelude::*;

use crate::constants::*;

#[account]
pub struct ScoringList {
    pub options: [f32; 101],
    pub cost: [f32; 101],
    pub peer_score: [f32; 101],
    pub last_slot: u64,
    pub bump: u8,
}

impl ScoringList {
    pub const SEED_PREFIX: &'static str = "scoring_list";

    pub const LEN: usize = 8 + 101 * F32_L + 101 * F32_L + 101 * F32_L + U64_L + U8_L;

    pub fn new(last_slot: u64, bump: u8) -> Self {
        Self {
            options: [0.0; 101],
            cost: [0.0; 101],
            peer_score: [0.0; 101],
            last_slot,
            bump,
        }
    }

    pub fn update(
        &mut self,
        collective_estimate: f32,
        variance: f32,
        current_slot: u64,
        num_forecasters: f32,
        ln_gm: f32,
    ) {
        let last_slot = self.last_slot;

        let weight_factor = (1.0 - (-LN_2 * num_forecasters / 42.0).exp()
            + num_forecasters / (1000.0 + num_forecasters))
            * 0.51
            * (1.0 - variance.sqrt().min(1.0));

        for num in self
            .options
            .iter_mut()
            .take(((collective_estimate * 100.0).round() / 100.0).ceil() as usize)
        {
            *num -= weight_factor * (current_slot - last_slot) as f32;
        }

        for cost in self
            .cost
            .iter_mut()
            .take(((collective_estimate * 100.0).round() / 100.0).ceil() as usize)
        {
            *cost -=
                weight_factor * (current_slot - last_slot) as f32 * collective_estimate / 100.0;
        }

        for num in self
            .options
            .iter_mut()
            .skip(1 + ((collective_estimate * 100.0).round() / 100.0).floor() as usize)
        {
            *num += weight_factor * (current_slot - last_slot) as f32;
        }

        for cost in self
            .cost
            .iter_mut()
            .skip(1 + ((collective_estimate * 100.0).round() / 100.0).floor() as usize)
        {
            *cost +=
                weight_factor * (current_slot - last_slot) as f32 * collective_estimate / 100.0;
        }

        for (estimate, score) in self.peer_score.iter_mut().enumerate() {
            *score += (LOGS[estimate as usize] - ln_gm) * (current_slot - last_slot) as f32;
        }

        self.last_slot = current_slot;
    }
}
