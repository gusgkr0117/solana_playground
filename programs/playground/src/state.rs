use anchor_lang::prelude::*;

#[account]
pub struct ProgramConfig {
    pub numbers : [u8; 64],
    pub round : u32,
    pub state : RandomState,
    pub prev_force : [u8; 32],
}

impl ProgramConfig {
    pub const SIZE: usize = std::mem::size_of::<Self>();

    /// Creates a new state for the `player`.
    pub fn new() -> Self {
        Self {
            numbers : [0u8; 64],
            round : 0u32,
            state : RandomState::Wait,
            prev_force : [0u8; 32],
        }
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq)]
pub enum RandomState {
    Wait,
    Requested,
    Finished,
}