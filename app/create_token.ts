import * as anchor from "@coral-xyz/anchor";
import { Playground } from "../target/types/playground";
import { Program } from "@coral-xyz/anchor";
import { createMint, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import * as web3 from "@solana/web3.js";

async function main() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Playground as Program<Playground>;
    const result = await program.methods.initialize().accounts({}).signers([]).rpc();
    console.log(result);

    const keypair = web3.Keypair.generate();
    const mintAuth = web3.Keypair.generate();

    const createMintTx = await createMint(provider.connection, keypair, mintAuth.publicKey, mintAuth.publicKey, 10);
}

main().then(() => console.log("DONE"));