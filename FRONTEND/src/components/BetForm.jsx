import React, { useState } from "react";
import { placeBetOnMarket } from "../utils/solana"; // Import the place bet function

const BetForm = ({ marketPublicKey }) => {
  const [prediction, setPrediction] = useState(true); // true = Yes, false = No
  const [amount, setAmount] = useState(0); // Amount in lamports

  const handleBetSubmit = async (e) => {
    e.preventDefault();

    try {
      await placeBetOnMarket(marketPublicKey, prediction, amount);
      alert("Bet placed successfully!");
    } catch (error) {
      console.error("Error placing bet:", error);
      alert("Failed to place bet.");
    }
  };

  return (
    <form onSubmit={handleBetSubmit} className="my-4">
      <div className="mb-4">
        <label className="block text-gray-700">Bet Amount (in SOL):</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-2 border rounded-md"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Prediction:</label>
        <select
          value={prediction}
          onChange={(e) => setPrediction(e.target.value === "true")}
          className="w-full px-4 py-2 border rounded-md"
        >
          <option value={true}>Yes</option>
          <option value={false}>No</option>
        </select>
      </div>

      <button
        type="submit"
        className="bg-blue-500 text-white py-2 px-4 rounded-md"
      >
        Place Bet
      </button>
    </form>
  );
};

export default BetForm;
