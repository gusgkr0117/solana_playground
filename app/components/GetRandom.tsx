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

window.Buffer = buffer.Buffer;

const PROGRAM_ID = new web3.PublicKey("DyPR6RSYC1DNUGFEk3johQ3i5tsRQfYuMbeubxoiK6xX");
let vrf = undefined;
let force = web3.Keypair.generate().publicKey;

function GetRandom() {

    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const { pubkey, sendTransaction } = useWallet();

    const provider = new AnchorProvider(connection, wallet, {});
    setProvider(provider);
    const program = new Program<Playground>(idl);

    let [ randomValue, SetRandomValue ] = useState("");

    // This helper will play a single round of russian-roulette.
    async function GetRandomNumber(prevForce: Buffer) {
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
                random: random,
                treasury: treasury,
                config: networkStateAccountAddress(),
                vrf: vrf.programId,
                systemProgram: web3.SystemProgram.programId,
            })
            .rpc();

        SetRandomValue((await vrf.waitFulfilled(force.toBuffer())).randomness.toString());
        console.log(randomValue);
        return tx2;
    }

    async function GetSameRandom() {
        console.log(`vrf : ${vrf.programId.toString()}`);
        if(vrf == undefined) return;
        console.log(`force : ${force.toString()}`);
        SetRandomValue((await vrf.waitFulfilled(force.toBuffer())).randomness.toString());
    }

    function OnClick2() {
        GetSameRandom().then((result) => console.log(result));
    }

    function OnClick() {
        GetRandomNumber(Buffer.alloc(32)).then((result) => {
            console.log(result);
        });
        // .catch((e) => console.log(e));
    }

    return (
        <div>
            <button onClick={OnClick}>
                GetRandom
            </button>
            <button onClick={OnClick2}>
                SameRandom
            </button>
            <p>Seed : {force.toString()}</p>
            <p>{randomValue}</p>
        </div>
    );
}
export default GetRandom;