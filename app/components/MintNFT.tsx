import React from 'react';
import * as web3 from "@solana/web3.js";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { Keypair } from "@solana/web3.js";

import { Program, Idl, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import idl from "../../target/idl/playground.json";
import { Playground } from '../../target/types/playground';
import * as buffer from "buffer";

window.Buffer = buffer.Buffer;

const PROGRAM_ID = new web3.PublicKey("DyPR6RSYC1DNUGFEk3johQ3i5tsRQfYuMbeubxoiK6xX");

function MintNFT() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const { pubkey, sendTransaction } = useWallet();

    async function create_core_nft(asset: any) {
        let createAssetArgs = {
            name: 'My Asset',
            uri: "https://5vfxc4tr6xoy23qefqbj4qx2adzkzapneebanhcalf7myvn5gzja.arweave.net/7UtxcnH13Y1uBCwCnkL6APKsge0hAgacQFl-zFW9NlI",
        };

        const provider = new AnchorProvider(connection, wallet, {});
        setProvider(provider);
        const program = new Program<Playground>(idl);

        console.log("wallet.pubkey :", wallet.publicKey);

        let creatorAddr = web3.PublicKey.findProgramAddressSync([Buffer.from("creator")], PROGRAM_ID);

        const context = {
            asset: asset.publicKey,
            collection: null,
            authority: null,
            payer: wallet.publicKey,
            creator: creatorAddr,
            owner: null,
            updateAuthority: null,
            systemProgram: web3.SystemProgram.programId,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
          };

        let tx = await program.methods
        .createCoreAsset(createAssetArgs)
        .accounts(context)
        .signers([asset])
        .rpc();

        return tx;
    }

    function MintTicket() {
        let asset = Keypair.generate();
        console.log(asset);
        create_core_nft(asset).then((result) => {
            console.log(result);
        }).catch((e) => console.log(e));
    }
    return (
        <button onClick={MintTicket}>
            Mint NFT
        </button>
    );
}

export default MintNFT;