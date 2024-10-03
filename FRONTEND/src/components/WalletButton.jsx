import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import React from "react";

const WalletButton = () => {
  const { wallet, publicKey } = useWallet();

  return (
    <div>
      {publicKey ? (
        <p>Connected: {publicKey.toBase58()}</p>
      ) : (
        <WalletMultiButton />
      )}
    </div>
  );
};

export default WalletButton;
