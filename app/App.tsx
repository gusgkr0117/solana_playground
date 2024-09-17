import * as anchor from "@coral-xyz/anchor";
import { Playground } from "../target/types/playground";
import { Program } from "@coral-xyz/anchor";
import * as web3 from "@solana/web3.js";
import { MPL_CORE_PROGRAM_ID } from "@metaplex-foundation/mpl-core";
import { Keypair } from "@solana/web3.js";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { WalletModalProvider, WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"
import React, { useMemo, FC } from "react";
import ReactDOM from "react-dom";

import '@solana/wallet-adapter-react-ui/styles.css';
import { AccountState } from "./components/AccountState";
import MintNFT from "./components/MintNFT";

export const App: FC = () => {
  const network = WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(() => web3.clusterApiUrl(network), [network]);
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
    ],
    [network],
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <div className="h-screen">
          <div className="h-auto min-h-full bg-gray-800">
            <div className="p-4 flex flex-row bg-blue-900 justify-between border-slate-700 border-b">
              <div className="text-white font-bold font-sans text-2xl content-center">🍀 LOTTERY</div>
              <WalletMultiButton/>
            </div>
            <div className="m-4 space-y-4 text-sky-400">
              <AccountState />
              <MintNFT/>
            </div>
          </div>
          <div className="text-center text-sky-400 h-16 -translate-y-full p-4 content-center items-center relative bg-blue-900">
            Copyright ©hyeon
          </div>
          </div>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};