use std::f32::consts::LN_2;

use anchor_lang::prelude::*;

use crate::constants::*;

#[account(zero_copy)]
pub struct ScoringList {
    pub options: [f32; 128],
    pub cost: [f32; 128],
    pub peer_score_a: [f32; 128],
    pub peer_score_b: [f32; 128],
    pub last_slot: u64,
}

impl ScoringList {
    pub const SEED_PREFIX: &'static str = "scoring_list";

    pub const LEN: usize = 8 + 128 * F32_L + 128 * F32_L + 128 * F32_L + 128 * F32_L + U64_L;

    pub fn new(&mut self, last_slot: u64) {
        self.options = [0.0; 128];
        self.cost = [0.0; 128];
        self.peer_score_a = [0.0; 128];
        self.peer_score_b = [0.0; 128];
        self.last_slot = last_slot;
    }

    pub fn update(
        &mut self,
        collective_estimate: f32,
        variance: f32,
        current_slot: u64,
        num_forecasters: f32,
        ln_gm_a: f32,
        ln_gm_b: f32,
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
            .take(101)
            .skip(1 + ((collective_estimate * 100.0).round() / 100.0).floor() as usize)
        {
            *num += weight_factor * (current_slot - last_slot) as f32;
        }

        for cost in self
            .cost
            .iter_mut()
            .take(101)
            .skip(1 + ((collective_estimate * 100.0).round() / 100.0).floor() as usize)
        {
            *cost +=
                weight_factor * (current_slot - last_slot) as f32 * collective_estimate / 100.0;
        }

        for (estimate, score) in self.peer_score_a.iter_mut().enumerate().take(101) {
            *score += (LOGS[estimate as usize] - ln_gm_a) * (current_slot - last_slot) as f32;
        }

        for (estimate, score) in self.peer_score_b.iter_mut().enumerate().take(101) {
            *score += (LOGS[100 - estimate as usize] - ln_gm_b) * (current_slot - last_slot) as f32;
        }

        self.last_slot = current_slot;
    }
}
