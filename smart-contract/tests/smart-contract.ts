import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token"; // Correct import for the token program ID
import { SystemProgram } from "@solana/web3.js"; // Import necessary libraries
import { assert } from "chai"; // For assertions

describe("smart-contract", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.SmartContract as Program<SmartContract>;

  // Keypair for the prediction market
  let market: anchor.web3.Keypair;

  it("Initializes the prediction market!", async () => {
    // Generate a Keypair for the market account
    market = anchor.web3.Keypair.generate();

    const event_name = "Will it rain today?";
    const location = "New York";
    const end_time = Math.floor(Date.now() / 1000); // Current Unix timestamp

    // Get the provider and bettor's wallet
    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const bettor = provider.wallet.publicKey;

    // Call the initialize method on the program
    const tx = await program.methods
      .initialize(event_name, location, new anchor.BN(end_time)) // Use BigNumber for i64
      .accounts({
        market: market.publicKey,
        user: bettor,
        systemProgram: SystemProgram.programId,
      })
      .signers([market])
      .rpc();

    console.log("Your transaction signature", tx);

    // Fetch the initialized market account
    const marketAccount = await program.account.predictionMarket.fetch(
      market.publicKey
    );

    // Assert the market was initialized correctly
    assert.equal(marketAccount.eventName, event_name);
    assert.equal(marketAccount.location, location);
    assert.equal(marketAccount.yesBets.toNumber(), 0);
    assert.equal(marketAccount.noBets.toNumber(), 0);
    assert.equal(marketAccount.resolved, false);
  });

  it("Allows users to place bets", async () => {
    const bet_amount_yes = new anchor.BN(1000); // Betting 1000 units for "yes"
    const bet_amount_no = new anchor.BN(2000); // Betting 2000 units for "no"

    // Assume that the bettor's wallet is the same as the provider's wallet
    const provider = anchor.getProvider() as anchor.AnchorProvider;
    const bettor = provider.wallet.publicKey;

    // Place a "yes" bet
    await program.methods
      .placeBet(true, bet_amount_yes) // "true" for yes
      .accounts({
        market: market.publicKey,
        bettor: bettor,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([])
      .rpc();

    // Place a "no" bet
    await program.methods
      .placeBet(false, bet_amount_no) // "false" for no
      .accounts({
        market: market.publicKey,
        bettor: bettor,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([])
      .rpc();

    // Fetch the market account after placing bets
    const marketAccount = await program.account.predictionMarket.fetch(
      market.publicKey
    );

    // Assert that the bets were placed correctly
    assert.equal(marketAccount.yesBets.toNumber(), bet_amount_yes.toNumber());
    assert.equal(marketAccount.noBets.toNumber(), bet_amount_no.toNumber());
  });

  it("Resolves the market and verifies payouts", async () => {
    const outcome = true; // Let's assume "yes" wins

    // Call the resolve_market method
    await program.methods
      .resolveMarket(outcome)
      .accounts({
        market: market.publicKey,
        admin: anchor.getProvider().wallet.publicKey, // Assuming admin resolves the market
      })
      .signers([])
      .rpc();

    // Fetch the market account to check if it has been resolved
    const marketAccount = await program.account.predictionMarket.fetch(
      market.publicKey
    );

    // Assert the market has been resolved correctly
    assert.equal(marketAccount.resolved, true);
    assert.equal(
      marketAccount.yesPayout.toNumber(),
      marketAccount.noBets.toNumber()
    ); // Yes payout is equal to the total "no" bets
    assert.equal(marketAccount.noPayout, undefined); // No payout since "no" lost
  });
});
