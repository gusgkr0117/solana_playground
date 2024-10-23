import React, { useContext, useState } from 'react';
import * as web3 from "@solana/web3.js";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { Keypair } from "@solana/web3.js";

import { AnchorProvider, setProvider, Program } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import idl from "../../target/idl/playground.json";
import { Playground } from '../../target/types/playground';
import * as buffer from "buffer";
import { LOTTO_NUMBER_LIMIT, MY_PROGRAM_ID } from '../config';
import { UserContext } from './AccountState';

import { Pen, TrashBin } from "flowbite-react-icons/outline";

window.Buffer = buffer.Buffer;

const PROGRAM_ID = new web3.PublicKey(MY_PROGRAM_ID);
const RowNum = 5;
const MaxNumSize = 6;

function MintNFT() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const { pubkey, sendTransaction } = useWallet();
    let [selected, SetSelected] = useState<number[]>([]);
    const { UpdateAccountState } = useContext(UserContext);
    const provider = new AnchorProvider(connection, wallet, {});
    setProvider(provider);
    const program = new Program<Playground>(idl);
    const [programConfig, _] = web3.PublicKey.findProgramAddressSync(
        [Buffer.from("config")],
        program.programId,
    );

    async function create_core_nft(asset: any) {
        let createAssetArgs = {
            name: 'My Asset',
            uri: "https://5vfxc4tr6xoy23qefqbj4qx2adzkzapneebanhcalf7myvn5gzja.arweave.net/7UtxcnH13Y1uBCwCnkL6APKsge0hAgacQFl-zFW9NlI",
            numbers : selected,
        };

        console.log(selected);
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
            console.log(`created : ${result}`);
            UpdateAccountState();
        }).catch((e) => console.log(e));
    }

    function SelectNumber(num : number) {
        let newSelected = [...selected];
        let pos = newSelected.findIndex((v) => v==num);
        if(pos == -1) {
            if(newSelected.length == MaxNumSize) return;
            newSelected.push(num);
        } else {
            newSelected = selected.filter((v) => v!=num);
        }
        newSelected = newSelected.sort((x,y) => x-y);
        SetSelected(newSelected);
    }

    function SelectRandomNumbers() {
        let newSelected = [];
        for(var i = 0; i < MaxNumSize; i++) {
            while(true) {
                let a = Math.floor(Math.random() * LOTTO_NUMBER_LIMIT + 1);
                if (newSelected.includes(a)) continue;
                else {
                    newSelected.push(a);
                    break;
                }
            }
        }
        SetSelected(newSelected);
    }

    function ResetNumbers() {
        SetSelected([]);
    }

    return (
        <div className="flex flex-col space-y-2 items-center">
            <div className="flex flex-row space-x-2">
                <button className="hover:bg-blue-900" onClick={SelectRandomNumbers}>
                    <Pen/>
                </button>
                <button className="hover:bg-blue-900" onClick={ResetNumbers}>
                    <TrashBin/>
                </button>
            </div>
            <div className="flex flex-col w-fit p-2 bg-blue-800 border-2 border-solid border-blue-400 rounded-lg space-y-2">
                {
                    selected && [...Array(Math.floor(LOTTO_NUMBER_LIMIT/RowNum))].map((_, row) => 
                        <div className="flex flex-row space-x-2">
                        {
                            [...Array(RowNum)].map((_, x) => 
                                <div className="relative group" onClick={() => SelectNumber(row * RowNum + x + 1)}>
                                    <div className={`rounded-full ${selected.includes(row * RowNum + x + 1) ? "bg-yellow-500":"bg-blue-900"} h-10 w-10 text-xs text-center group-hover:bg-yellow-600 group-active:bg-violet-700`}/>
                                    <label className={`absolute select-none ${selected.includes(row * RowNum + x + 1) ? "text-blue-900" : "text-sky-400"} transform -translate-x-1/2 translate-y-1/2 bottom-1/2 left-1/2`}>
                                        {(row * RowNum + x + 1).toString()}
                                    </label>
                                </div>
                            )
                        }
                        </div>
                    )
                }
            </div>
            {
                selected.length == MaxNumSize?
                <div className="flex flex-row space-x-2">
                    <div className="flex flex-row space-x-2">
                    {
                        selected.sort((a,b) => a-b).map((x) => 
                            <div className="relative">
                                <div className={`rounded-full bg-yellow-500 h-10 w-10 text-xs text-center`}/>
                                <label className="absolute text-blue-900 select-none transform -translate-x-1/2 translate-y-1/2 bottom-1/2 left-1/2">
                                    {(x).toString()}
                                </label>
                            </div>
                        )
                    }
                    </div>
                    <button className="hover:bg-blue-900" onClick={MintTicket}>BUY TICKET</button>
                </div>
                    : <></>
            }
        </div>
    );
}

export default MintNFT;