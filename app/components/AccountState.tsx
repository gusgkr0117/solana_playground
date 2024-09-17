import React, { useEffect, useState } from "react";
import { WalletContext, useConnection } from "@solana/wallet-adapter-react";
import { FC } from "react";
import { fetchAssetsByOwner } from "@metaplex-foundation/mpl-core";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey as umiPubKey } from "@metaplex-foundation/umi";
import NFTState from "./NFTState";

export const AccountState :FC = () => {
    const walletContext = React.useContext(WalletContext);
    const { connection } = useConnection();
    const publicKey = walletContext.publicKey;
    const address = publicKey?.toString();
    let [balance, setBalance] = useState(-1);
    let [fetchedAsset, setAsset] = useState(null);

    useEffect(() => {
        if (publicKey) {
            connection.getAccountInfo(publicKey).then((info) => {
                setBalance(info.lamports);
            });

            const umi = createUmi("https://api.devnet.solana.com");
            fetchAssetsByOwner(umi, umiPubKey(publicKey.toString())).then((asset) => {
                setAsset(asset.map((item, index) => item.uri));
                console.log(asset);
            });
        } else {
            setBalance(-1);
            setAsset(null);
        }
    }, [publicKey]);
    
    return (
        <div className="flex flex-col p-4 bg-blue-800 rounded">
            <div className="items-center">
                {balance == -1? <h1>Connect an account</h1> : <h1>This is account state</h1>}
            </div>
            {balance != -1? <p>balance : {balance.toString()} Lamports</p> : <></>}
            <p>{address}</p>
            <div className="flex flex-row">
            {
                fetchedAsset?.map((item, index) => {
                        return (
                            <NFTState url={item}/>
                        );
                    }
                )
            }
            </div>
        </div>
    );
};