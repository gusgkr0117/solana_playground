import * as anchor from "@coral-xyz/anchor";
import { Playground } from "../target/types/playground";
import { Program, BN } from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";

const METADATA_SEED = "metadata";
const MINT_SEED = "mint";
const TOKEN_METADATA_PROGRAM_ID = new web3.PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

async function init_mint(program, mint, payer) {
    const [metadataAddress] = web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from(METADATA_SEED),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mint.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
    );

    const metadata = {
        name: "Just a Test Token",
        symbol: "TEST",
        // uri must be updated
        uri: "https://5vfxc4tr6xoy23qefqbj4qx2adzkzapneebanhcalf7myvn5gzja.arweave.net/7UtxcnH13Y1uBCwCnkL6APKsge0hAgacQFl-zFW9NlI",
        decimals: 9,
      };

    const context = {
        metadata: metadataAddress,
        mint,
        payer,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
      };

    const txHash = await program.methods.initToken(metadata).accounts(context).rpc();
    return txHash;
}

async function mint_token(program, mint, payer) {
    const destination = await anchor.utils.token.associatedAddress({
        mint: mint,
        owner: payer,
    });
      
    const context = {
        mint,
        destination,
        payer,
        rent: web3.SYSVAR_RENT_PUBKEY,
        systemProgram: web3.SystemProgram.programId,
        tokenProgram: anchor.utils.token.TOKEN_PROGRAM_ID,
        associatedTokenProgram: anchor.utils.token.ASSOCIATED_PROGRAM_ID,
    };

    const txHash = await program.methods.mintTokens(new BN(1 * 10 ** 3)).accounts(context).rpc();
    return txHash;
}

async function main() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Playground as Program<Playground>;

    const payer = provider.wallet.publicKey;

    const [mint] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from(MINT_SEED)],
        program.programId
    );

    const txHash1 = await init_mint(program, mint, payer);
    const txHash2 = await mint_token(program, mint, payer);
    console.log(txHash1);
    console.log(txHash2);
}

main().then(() => console.log("DONE"));