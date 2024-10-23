import React, { createContext, useEffect, useState } from "react";
import { WalletContext, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { FC } from "react";
import { AssetV1, burnV1, fetchAssetsByOwner } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey as umiPubKey } from "@metaplex-foundation/umi";
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import NFTState from "./NFTState";
import idl from "../../target/idl/playground.json";
import { Program } from "@coral-xyz/anchor";
import { Playground } from '../../target/types/playground';
import { MY_PROGRAM_ID } from "../config";
import * as web3 from "@solana/web3.js";
import MintNFT from "./BuyTicket";

export const UserContext = createContext(null);

export const AccountState :FC = () => {
    const walletContext = React.useContext(WalletContext);
    const { connection } = useConnection();
    const publicKey = walletContext.publicKey;
    const address = publicKey?.toString();
    let [balance, setBalance] = useState(-1);
    let [fetchedAsset, setAsset] = useState(null);
    const umi = createUmi("https://api.devnet.solana.com");
    const wallet = useWallet();

    let DeleteTicket = (ticketAddress) => {
        if(!ticketAddress) return;
        umi.use(walletAdapterIdentity(wallet));

        burnV1(umi, {
            asset: ticketAddress,
        }).sendAndConfirm(umi).then((res) => {
            console.log(res)
            UpdateAccountState();
        });
    }

    function UpdateAccountState() {
        if (publicKey) {
            connection.getAccountInfo(publicKey).then((info) => {
                setBalance(info.lamports);
            });
            const program = new Program<Playground>(idl);
            const [creator, _] = web3.PublicKey.findProgramAddressSync(
                [Buffer.from("creator")],
                program.programId,
            );

            fetchAssetsByOwner(umi, umiPubKey(publicKey.toString())).then((asset) => {
                asset = asset.filter((item, _) => {
                    let check1 = (item.attributes.attributeList.length == 2);
                    let check2 = (item.updateAuthority.address.toString() == creator.toString());
                    let check3 = (item.attributes.attributeList[0].key == "numbers");
                    let check4 = (item.attributes.attributeList[0].value.split(',').length == 6);
                    let check5 = (item.attributes.attributeList[1]?.key == "round");
                    return check1 && check2 && check3 && check4 && check5;
                })

                setAsset(asset.map((item, index) => 
                    {
                        console.log(item);
                        return {
                            uri: item.uri,
                            numbers: item.attributes.attributeList[0].value.split(',').map(v => Number(v)).sort((x,y) => x-y),
                            round: Number(item.attributes.attributeList[1].value),
                            address: item.publicKey,
                        };
                    }
                ));
            });
        } else {
            setBalance(-1);
            setAsset(null);
        }
    }

    useEffect(() => {
        UpdateAccountState();
    }, [publicKey]);
    
    return (
        <div className="flex flex-col p-4 rounded items-center">
            <div className="items-center">
                {balance == -1? <h1>Connect an account</h1> : <></>}
            </div>
            {/* {balance != -1? <p>balance : {balance.toString()} Lamports</p> : <></>}
            <p>{address}</p> */}
            <UserContext.Provider value={{DeleteTicket, UpdateAccountState}}>
            <div className="flex flex-row">
            {
                fetchedAsset?.map((item, index) => {
                        return (
                            <NFTState item={item}/>
                        );
                    }
                )
            }
            </div>
            <MintNFT/>
            </UserContext.Provider>
        </div>
    );
};