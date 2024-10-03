import { PublicKey, SystemProgram } from "@solana/web3.js";
import { AnchorProvider, Program, web3 } from "@project-serum/anchor";
import idl from "../../../smart-contract/target/idl/smart_contract.json"; // Import your IDL file here

const network = "https://api.devnet.solana.com";
const connection = new web3.Connection(network);
const programID = new PublicKey("4DmLyB448d8BMxVDbPEoJhyD9BpPE12BS5wTMTTq3zYB"); // Your program ID

export const fetchMarkets = async (wallet) => {
  // Check if the wallet is connected
  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet is not connected");
  }

  // Create a provider using the connection and the wallet
  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  const program = new Program(idl, programID, provider);

  try {
    // Fetch all accounts of type `PredictionMarket`
    const markets = await program.account.predictionMarket.all();

    // Format and return the markets data
    return markets.map((market) => ({
      publicKey: market.publicKey.toString(),
      event_name: market.account.eventName,
      location: market.account.location,
      end_time: market.account.endTime,
      yes_bets: market.account.yesBets.toNumber(),
      no_bets: market.account.noBets.toNumber(),
      resolved: market.account.resolved,
      yes_payout: market.account.yesPayout.toNumber(),
      no_payout: market.account.noPayout.toNumber(),
    }));
  } catch (err) {
    console.error("Error fetching markets: ", err);
    throw err; // Rethrow the error to be handled upstream
  }
};

export const placeBetOnMarket = async (
  wallet,
  marketPubkey,
  prediction,
  amount
) => {
  // Check if the wallet is connected
  if (!wallet || !wallet.publicKey) {
    throw new Error("Wallet is not connected");
  }

  // Create a provider using the connection and the wallet
  const provider = new AnchorProvider(
    connection,
    wallet,
    AnchorProvider.defaultOptions()
  );
  const program = new Program(idl, programID, provider);
  const user = provider.wallet.publicKey;

  try {
    const tx = await program.methods
      .placeBet(prediction, new web3.BN(amount))
      .accounts({
        market: marketPubkey,
        bettor: user,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Transaction successful with signature:", tx);
  } catch (err) {
    console.error("Error placing bet:", err);
    throw err; // Rethrow the error to be handled upstream
  }
};
