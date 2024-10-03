import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom"; // Example wallet adapter
import "@solana/wallet-adapter-react-ui/styles.css"; // Import wallet UI styles
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

// Define the wallets you want to use
const wallets = [
  new PhantomWalletAdapter(), // Add any other wallets you wish to support
];

createRoot(document.getElementById("root")).render(
  <ConnectionProvider
    endpoint={
      "https://solana-devnet.g.alchemy.com/v2/mInLm6vtkwDnwFfaJr49wR0SVwLVyG1c"
    }
  >
    <WalletProvider wallets={wallets} autoConnect>
      {" "}
      {/* Pass wallets array here */}
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);
