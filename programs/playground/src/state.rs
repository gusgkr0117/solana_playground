use anchor_lang::prelude::*;

#[account]
pub struct ProgramConfig {
    pub numbers : [u32; 8],
    pub round : u32,
}

impl ProgramConfig {
    pub const SIZE: usize = std::mem::size_of::<Self>();

    /// Creates a new state for the `player`.
    pub fn new() -> Self {
        Self {
            numbers : [0u32; 8],
            round : 0u32,
        }
    }
}