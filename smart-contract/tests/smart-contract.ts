import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SystemProgram } from "@solana/web3.js";
import { assert } from "chai";
import { SmartContract } from "../target/types/smart_contract";

describe("smart-contract", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.SmartContract as Program<SmartContract>;

  let market: anchor.web3.Keypair;

  it("Initializes a prediction market", async () => {
    market = anchor.web3.Keypair.generate();

    const event_name = "Will it rain today?";
    const location = "New York";
    const end_time = Math.floor(Date.now() / 1000); // Unix timestamp

    const tx = await program.methods
      .initialize(event_name, location, new anchor.BN(end_time))
      .accountsStrict({
        market: market.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([market])
      .rpc();

    console.log("Transaction signature:", tx);

    // Fetch the market account to verify
    const marketAccount = await program.account.predictionMarket.fetch(
      market.publicKey
    );
    assert.equal(marketAccount.eventName, event_name);
    assert.equal(marketAccount.location, location);
    assert.equal(marketAccount.yesBets.toNumber(), 0);
    assert.equal(marketAccount.noBets.toNumber(), 0);
    assert.equal(marketAccount.resolved, false);
  });
});
