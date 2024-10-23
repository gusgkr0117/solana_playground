import React, { useState } from "react";
import {
    Orao,
    networkStateAccountAddress,
    randomnessAccountAddress,
    getNetworkState,
    FulfillBuilder,
    InitBuilder,
} from "@orao-network/solana-vrf";
import { Program, Idl, AnchorProvider, setProvider, BN } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import idl from "../../target/idl/playground.json";
import { Playground } from '../../target/types/playground';
import * as buffer from "buffer";
import * as web3 from "@solana/web3.js";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { LOTTO_NUMBER_LIMIT, MY_PROGRAM_ID } from "../config";

window.Buffer = buffer.Buffer;

// const PROGRAM_ID = new web3.PublicKey(MY_PROGRAM_ID);
let vrf = undefined;
let force = web3.Keypair.generate().publicKey;

function GetRandom() {

    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const { pubkey, sendTransaction } = useWallet();

    const provider = new AnchorProvider(connection, wallet, {});
    setProvider(provider);
    const program = new Program<Playground>(idl);
    const [programConfig, _] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId,
    );

    let [ randomValue, SetRandomValue ] = useState("");
    let [ round, SetRound ]= useState(-1);

    program.account.programConfig.fetch(programConfig).then((programConfigAccount) => {
        SetRound(programConfigAccount.round);
        SetRandomValue(programConfigAccount.numbers.slice(0, 6).map((x) => (x % LOTTO_NUMBER_LIMIT).toString()).join('-'));
    }).catch((e) => {
        console.log("there is no config account. initialize first.");
    });

    async function Initialize() {
        let tx = await program.methods
            .initialize()
            .accounts({
                payer : provider.wallet.publicKey,
                programConfig: programConfig,
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();
        return tx;
    }

    // This helper will play a single round of russian-roulette.
    async function GetRandomNumber(prevForce: Buffer) {
        force = web3.Keypair.generate().publicKey;
        const random = randomnessAccountAddress(force.toBuffer());
        const fulfillmentAuthority = web3.Keypair.generate();

        vrf = new Orao(provider);

        const networkState = await vrf.getNetworkState();
        const treasury = networkState.config.treasury;

        // Initialize test VRF
        const fee = 2 * LAMPORTS_PER_SOL;
        const fulfillmentAuthorities = [fulfillmentAuthority.publicKey];
        const configAuthority = web3.Keypair.generate();

        console.log(`treasury : ${treasury}`);

        // let tx1 = await new InitBuilder(
        //     vrf,
        //     configAuthority.publicKey,
        //     treasury.publicKey,
        //     fulfillmentAuthorities,
        //     new BN(fee)
        // ).rpc();

        // console.log(tx1);

        let tx2 = await program.methods
            .getRandomNumber([...force.toBuffer()])
            .accounts({
                player: provider.wallet.publicKey,
                random,
                treasury: treasury,
                programConfig, 
                config: networkStateAccountAddress(),
                vrf: vrf.programId,
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        // SetRandomValue((await vrf.waitFulfilled(force.toBuffer())).randomness.toString());
        // console.log(randomValue);

        let tx3 = await program.methods
            .settleRandom([...force.toBuffer()])
            .accounts({
                payer: provider.wallet.publicKey,
                programConfig,
                random,

            })
            .rpc();

        let programConfigAccount = await program.account.programConfig.fetch(programConfig);
        SetRound(programConfigAccount.round);
        SetRandomValue(programConfigAccount.numbers.slice(0, 6).map((x) => (x % LOTTO_NUMBER_LIMIT).toString()).join('-'));
        return tx3;
    }

    async function Settle() {
        let programConfigAccount;
        try {
            programConfigAccount = await program.account.programConfig.fetch(programConfig);
        } catch (e) {
            console.log("initialize first.");
        }
        let force = new Int8Array(programConfigAccount.prevForce);
        const random = randomnessAccountAddress(Buffer.from(force));
        let tx = await program.methods
            .settleRandom([...Buffer.from(force)])
            .accounts({
                payer: provider.wallet.publicKey,
                programConfig,
                random,

            })
            .rpc();
        return tx;
    }

    function OnClick() {
        GetRandomNumber(Buffer.alloc(32)).then((result) => {
            console.log(result);
        });
        // .catch((e) => console.log(e));
    }

    function OnClickInit() {
        Initialize().then((result) => console.log(result));
    }

    function OnClickSettle() {
        Settle().then((result) => console.log(result));
    }

    return (
        <div className="flex flex-col space-y-4">
            <div className="flex flex-row space-x-4">
                <button onClick={OnClickInit}>
                    Initialize
                </button>
                <button onClick={OnClick}>
                    Pick Numbers!
                </button>
                <button onClick={OnClickSettle}>
                    Settle
                </button>
                
            </div>
            {/* <p>Seed : {force.toString()}</p> */}
            {/* <p>Numbers : {randomValue}</p>
            <p>Round number : {round!=-1?round:""}</p> */}
        </div>
    );
}
export default GetRandom;