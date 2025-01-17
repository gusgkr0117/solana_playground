pub mod state;

use anchor_lang::prelude::*;
use mpl_core::{
    ID as MPL_CORE_ID,
    accounts::BaseCollectionV1, 
    instructions::{AddPluginV1Builder, CreateV2CpiBuilder},
    types::{Plugin, ImmutableMetadata, PluginAuthority}, 
};
use orao_solana_vrf::{program::OraoVrf, state::{NetworkState, RandomnessV2, randomness_v2::Request}, CONFIG_ACCOUNT_SEED, RANDOMNESS_ACCOUNT_SEED};
use state::{ RandomState, ProgramConfig};

declare_id!("5WfZSgzTsDGQzBsfH7EyKZWNtKC5xuWTfLK8RNnw2nMP");

#[derive(AnchorDeserialize, AnchorSerialize)]
pub struct CreateAssetArgs {
    name: String,
    uri: String,
    numbers: [u8; 6],
}

#[program]
pub mod playground {
    use mpl_core::types::{Attribute, Attributes, PluginAuthorityPair, VerifiedCreators, VerifiedCreatorsSignature};
    use orao_solana_vrf::cpi::accounts::RequestV2;

    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        let program_config = &mut ctx.accounts.program_config;
        **program_config = ProgramConfig::new();

        Ok(())
    }

    pub fn create_core_asset(ctx: Context<CreateAsset>, args: CreateAssetArgs) -> Result<()> {
        let collection = match &ctx.accounts.collection {
            Some(collection) => Some(collection.to_account_info()),
            None => None,
        };
        
        let authority = match &ctx.accounts.authority {
            Some(authority) => Some(authority.to_account_info()),
            None => None,
        };
        
        let owner = match &ctx.accounts.owner {
            Some(owner) => Some(owner.to_account_info()),
            None => None,
        };
        
        let update_authority = match &ctx.accounts.update_authority {
            Some(update_authority) => Some(update_authority.to_account_info()),
            None => None,
        };

        let program_config = &ctx.accounts.program_config;
        if program_config.state != RandomState::Finished {
            return Err(Error::NotSettled.into());
        }
            
        CreateV2CpiBuilder::new(&ctx.accounts.mpl_core_program.to_account_info())
            .asset(&ctx.accounts.asset.to_account_info())
            .collection(collection.as_ref())
            .authority(authority.as_ref())
            .payer(&ctx.accounts.payer.to_account_info())
            .owner(Some(ctx.accounts.payer.as_ref()))
            .update_authority(Some(ctx.accounts.creator.as_ref()))
            .system_program(&ctx.accounts.system_program.to_account_info())
            .name(args.name)
            .uri(args.uri)
            .plugins(vec![
                PluginAuthorityPair {
                    plugin: Plugin::Attributes(Attributes {  
                        attribute_list: vec![
                            Attribute {
                                key: "numbers".to_string(),
                                value: args.numbers.map(|v| v.to_string()).join(","),
                            },
                            Attribute {
                                key: "round".to_string(),
                                value: program_config.round.to_string(),
                            }
                        ]
                    }),
                    authority: None,
                },
                // PluginAuthorityPair {
                //     plugin: Plugin::VerifiedCreators(
                //         VerifiedCreators {
                //             signatures: vec![
                //                 VerifiedCreatorsSignature {
                //                     address : ctx.accounts.creator.key.clone(),
                //                     verified : true,
                //                 }
                //             ]
                //         }
                //     ),
                //     authority: None,
                // }
            ])
            .invoke_signed(&[&[b"creator", &[ctx.bumps.creator]]])?;
        
        Ok(())
    }

    pub fn get_random_number(ctx: Context<GetRandomNumber>, force: [u8;32]) -> Result<()> {
        let program_config = &mut ctx.accounts.program_config;

        if program_config.state == RandomState::Requested {
            return Err(Error::DoubleRequest.into());
        }

        if program_config.prev_force == force {
            return Err(Error::SameSeedUsed.into());
        }
        // Zero seed is illegal in VRF
        if force == [0_u8; 32] {
            return Err(Error::YouMustSpinTheCylinder.into());
        }

        // Request randomness.
        let cpi_program = ctx.accounts.vrf.to_account_info();
        let cpi_accounts = RequestV2 {
            payer: ctx.accounts.player.to_account_info(),
            network_state: ctx.accounts.config.to_account_info(),
            treasury: ctx.accounts.treasury.to_account_info(),
            request: ctx.accounts.random.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        orao_solana_vrf::cpi::request_v2(cpi_ctx, force)?;

        program_config.state = RandomState::Requested;
        program_config.prev_force = force;
        
        Ok(())
    }

    pub fn settle_random(ctx:Context<SettleRandom>, force: [u8;32]) -> Result<()> {
        let randomness_account = &ctx.accounts.random;
        let program_config = &mut ctx.accounts.program_config;

        if program_config.state != RandomState::Requested {
            return Err(Error::NotRequestedYet.into());
        }

        if program_config.prev_force != force {
            return Err(Error::IncorrectSeedRequested.into());
        }

        match randomness_account.request.clone() {
            Request::Fulfilled(x) => {
                program_config.numbers = x.randomness;
                program_config.state = RandomState::Finished;
                program_config.round += 1;
            },
            Request::Pending(_) => {
                return Err(Error::PendingRandom.into());
            },
        }
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(
        init_if_needed,
        seeds = [b"config"],
        bump,     
        payer = payer,
        space = 8 + ProgramConfig::SIZE,
    )]
    pub program_config: Account<'info, ProgramConfig>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateAsset<'info> {
    #[account(mut)]
    pub asset: Signer<'info>,
    #[account(mut)]
    pub collection: Option<Account<'info, BaseCollectionV1>>,
    pub authority: Option<Signer<'info>>,
    #[account(mut)]
    pub payer: Signer<'info>,
    /// CHECK
    #[account(
        mut,
        seeds=[b"creator"],
        bump,
    )]
    pub creator: AccountInfo<'info>,
    #[account(
        seeds=[b"config"],
        bump,
    )]
    pub program_config: Account<'info, ProgramConfig>,
    /// CHECK: this account will be checked by the mpl_core program
    pub owner: Option<UncheckedAccount<'info>>,
    /// CHECK: this account will be checked by the mpl_core program
    pub update_authority: Option<UncheckedAccount<'info>>,
    pub system_program: Program<'info, System>,
    #[account(address = MPL_CORE_ID)]
    /// CHECK: this account is checked by the address constraint
    pub mpl_core_program: UncheckedAccount<'info>,
}

#[derive(Accounts)]
#[instruction(force: [u8; 32])]
pub struct GetRandomNumber<'info> {
    /// Player will be the `payer` account in the CPI call.
    #[account(mut)]
    pub player: Signer<'info>,
    /// This account is the current VRF request account, it'll be the `request` account in the CPI call.
    /// CHECK:
    #[account(
        mut,
        seeds = [RANDOMNESS_ACCOUNT_SEED, &force],
        bump,
        seeds::program = orao_solana_vrf::ID
    )]
    pub random: AccountInfo<'info>,
    /// CHECK:
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"config"],
        bump
    )]
    pub program_config: Account<'info, ProgramConfig>,
    #[account(
        mut,
        seeds = [CONFIG_ACCOUNT_SEED],
        bump,
        seeds::program = orao_solana_vrf::ID
    )]
    /// VRF on-chain state account, it'll be the `network_state` account in the CPI call.
    pub config: Account<'info, NetworkState>,

    /// VRF program address to invoke CPI
    pub vrf: Program<'info, OraoVrf>,

    /// System program address to create player_state and to be used in CPI call.
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(force: [u8; 32])]
pub struct SettleRandom<'info> {
    #[account(mut)]
    pub payer : Signer<'info>,
    #[account(
        mut,
        seeds = [b"config"],
        bump
    )]
    pub program_config: Account<'info, ProgramConfig>,
    /// This account is the current VRF request account, it'll be the `request` account in the CPI call.
    /// CHECK:
    #[account(
        mut,
        seeds = [RANDOMNESS_ACCOUNT_SEED, &force],
        bump,
        seeds::program = orao_solana_vrf::ID
    )]
    pub random: Account<'info, RandomnessV2>,
}

#[error_code]
pub enum Error {
    #[msg("previous round not finished")]
    NotSettled,
    #[msg("random value already requested")]
    DoubleRequest,
    #[msg("random value must be requested")]
    NotRequestedYet,
    #[msg("seed cannot be used repetitively")]
    SameSeedUsed,
    #[msg("seed not correct")]
    IncorrectSeedRequested,
    #[msg("Player must spin the cylinder")]
    YouMustSpinTheCylinder,
    #[msg("orao random account still pending")]
    PendingRandom,
}