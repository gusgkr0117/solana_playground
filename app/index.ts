import * as anchor from "@coral-xyz/anchor";
import { Playground } from "../target/types/playground";
import { Program } from "@coral-xyz/anchor";

async function main() {
    const provider = anchor.AnchorProvider.env();
    anchor.setProvider(provider);
    const program = anchor.workspace.Playground as Program<Playground>;
    const result = await program.methods.initialize().accounts({}).signers([]).rpc();
    console.log(result);
}

main().then(() => console.log("DONE"));