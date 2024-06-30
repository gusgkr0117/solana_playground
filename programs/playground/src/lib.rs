use anchor_lang::prelude::*;

declare_id!("GyZhiCQ6RVaUdK5cdehQYRstHBiX2Tf2YsjAiPLBbk6V");

#[program]
pub mod playground {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
