use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};
use mpl_token_metadata::instructions::{
    CreateMetadataAccountV3Cpi, CreateMetadataAccountV3CpiAccounts,
    CreateMetadataAccountV3InstructionArgs,
};
use mpl_token_metadata::types::DataV2;

#[derive(Accounts)]
pub struct AddMetadata<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    #[account(seeds = [b"auth"], bump)]
    /// CHECK:
    pub auth: UncheckedAccount<'info>,
    #[account(
        init,
        seeds = ["poeken_mint".as_bytes()],
        bump,
        payer = payer,
        mint::decimals = 9,
        mint::authority = auth,
    )]
    pub mint: Box<Account<'info, Mint>>,
    pub token_program: Program<'info, Token>,
    /// CHECK:
    #[account(mut)]
    pub metadata: AccountInfo<'info>,
    /// CHECK:
    pub token_metadata_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> AddMetadata<'info> {
    pub fn add_metadata(
        &mut self,
        bumps: &AddMetadataBumps,
        uri: String,
        name: String,
        symbol: String,
    ) -> Result<()> {
        let seeds = &["auth".as_bytes(), &[bumps.auth]];
        let pda_signer = &[&seeds[..]];
        CreateMetadataAccountV3Cpi::new(
            &self.token_metadata_program.to_account_info(),
            CreateMetadataAccountV3CpiAccounts {
                metadata: &self.metadata.to_account_info(),
                mint: &self.mint.to_account_info(),
                mint_authority: &self.auth.to_account_info(),
                payer: &self.payer.to_account_info(),
                update_authority: (&self.payer.to_account_info(), false),
                system_program: &self.system_program.to_account_info(),
                rent: None,
            },
            CreateMetadataAccountV3InstructionArgs {
                is_mutable: true,
                collection_details: None,
                data: DataV2 {
                    name,
                    symbol,
                    uri,
                    seller_fee_basis_points: 0,
                    collection: None,
                    creators: None,
                    uses: None,
                },
            },
        )
        .invoke_signed(pda_signer)?;

        msg!("Added metadata");
        Ok(())
    }
}
