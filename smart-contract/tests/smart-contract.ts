import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { SmartContract } from "../target/types/smart_contract";

describe("smart-contract", () => {
  // Setup provider and program
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SmartContract as Program<SmartContract>;

  let market: anchor.web3.Keypair;

  // Test 1: Initializing the prediction market
  it("Initializes a prediction market", async () => {
    market = anchor.web3.Keypair.generate();

    const event_name = "Will it rain tomorrow?";
    const location = "New York";
    const end_time = Math.floor(Date.now() / 1000) + 10; // Event ends in 10 sec

    const tx = await program.methods
      .initialize(event_name, location, new anchor.BN(end_time))
      .accounts({
        market: market.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([market])
      .rpc();

    console.log("Transaction signature:", tx);

    // Fetch the market account to verify initialization
    const marketAccount = await program.account.predictionMarket.fetch(
      market.publicKey
    );

    assert.equal(marketAccount.eventName, event_name);
    assert.equal(marketAccount.location, location);
    assert.equal(marketAccount.yesBets.toNumber(), 0);
    assert.equal(marketAccount.noBets.toNumber(), 0);
    assert.equal(marketAccount.resolved, false);
  });

  // Test 2: Placing a "yes" bet
  it("Places a bet on 'yes'", async () => {
    const betAmount = new anchor.BN(5); // Bet 5 SOL
    const prediction = true; // Betting on "yes"

    const tx = await program.methods
      .placeBet(prediction, betAmount)
      .accounts({
        market: market.publicKey,
        bettor: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Bet on 'yes' transaction signature:", tx);

    // Fetch the market account to verify yes bets
    const marketAccount = await program.account.predictionMarket.fetch(
      market.publicKey
    );

    assert.equal(marketAccount.yesBets.toNumber(), betAmount.toNumber());
  });

  // Test 3: Placing a "no" bet
  it("Places a bet on 'no'", async () => {
    const betAmount = new anchor.BN(3); // Bet 3 SOL
    const prediction = false; // Betting on "no"

    const tx = await program.methods
      .placeBet(prediction, betAmount)
      .accounts({
        market: market.publicKey,
        bettor: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    console.log("Bet on 'no' transaction signature:", tx);

    // Fetch the market account to verify no bets
    const marketAccount = await program.account.predictionMarket.fetch(
      market.publicKey
    );

    assert.equal(marketAccount.noBets.toNumber(), betAmount.toNumber());
  });

  // Test 4: Resolve the market
  it("Resolves the market", async () => {
    // Simulate waiting for the event to end
    await new Promise((resolve) => setTimeout(resolve, 10000)); // wait for 10 sec

    const outcome = true; // The event outcome is "yes"

    const tx = await program.methods
      .resolveMarket(outcome)
      .accounts({
        market: market.publicKey,
        admin: provider.wallet.publicKey,
      })
      .rpc();

    console.log("Market resolution transaction signature:", tx);

    // Fetch the market account to verify resolution
    const marketAccount = await program.account.predictionMarket.fetch(
      market.publicKey
    );

    assert.equal(marketAccount.resolved, true);
    assert.equal(
      marketAccount.yesPayout.toNumber(),
      marketAccount.noBets.toNumber()
    );
  });
});
