import idl from "../target/idl/playground.json";
import { Program } from '@coral-xyz/anchor'; 
import { Playground } from '../target/types/playground';
import { PublicKey } from "@solana/web3.js";

export const MY_PROGRAM_ID = "5WfZSgzTsDGQzBsfH7EyKZWNtKC5xuWTfLK8RNnw2nMP";
export const LOTTO_NUMBER_LIMIT = 30;

export async function GetProgramConfig() {
    let program = new Program<Playground>(idl);
    let [programConfigAddress, _] = await PublicKey.findProgramAddressSync(
        [Buffer.from('config')],
        program.programId
    )
    let configAccount = await program.account.programConfig.fetch(programConfigAddress);
    return configAccount;
}