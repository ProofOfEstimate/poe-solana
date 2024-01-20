use std::ops::{Div, Mul};

pub const ESTIMATE_PRECISION: usize = 4;

pub fn convert_to_float(value: u32) -> f32 {
    (value as f32).div(f32::powf(10.0, ESTIMATE_PRECISION as f32))
}

pub fn convert_from_float(value: f32) -> u32 {
    value.mul(f32::powf(10.0, ESTIMATE_PRECISION as f32)) as u32
}

pub fn recency_weight(decay: f32, current_slot: f32, start_slot: f32) -> f32 {
    (decay * (current_slot - start_slot) / 100_000.0)
        .exp()
        .min(1_000_000.0)
}
