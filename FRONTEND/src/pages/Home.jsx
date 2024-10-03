import React, { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchMarkets, placeBetOnMarket } from "../utils/solana"; // Adjust the import path

const Home = () => {
  const { wallet, connected } = useWallet();
  const [markets, setMarkets] = useState([]);
  const [error, setError] = useState(null); // State for error handling

  useEffect(() => {
    const loadMarkets = async () => {
      if (connected && wallet) {
        try {
          const fetchedMarkets = await fetchMarkets(wallet); // Pass wallet directly
          setMarkets(fetchedMarkets);
        } catch (error) {
          console.error("Error fetching markets:", error);
          setError("Failed to fetch markets."); // Update error state
        }
      }
    };

    loadMarkets();
  }, [connected, wallet]);

  const handlePlaceBet = async (marketPubkey, prediction, amount) => {
    if (connected && wallet) {
      try {
        await placeBetOnMarket(wallet, marketPubkey, prediction, amount); // Pass wallet directly
        alert("Bet placed successfully!"); // Feedback for success
      } catch (error) {
        console.error("Error placing bet:", error);
        setError("Failed to place bet."); // Update error state
      }
    } else {
      setError("Wallet not connected.");
    }
  };

  return (
    <div>
      <h1>Prediction Markets</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}{" "}
      {/* Display error if it exists */}
      {markets.length > 0 ? (
        markets.map((market) => (
          <div key={market.publicKey}>
            <h2>{market.event_name}</h2>
            <p>Location: {market.location}</p>
            <p>End Time: {new Date(market.end_time * 1000).toLocaleString()}</p>
            <button onClick={() => handlePlaceBet(market.publicKey, true, 100)}>
              Place Bet
            </button>
          </div>
        ))
      ) : (
        <p>No markets available.</p>
      )}
    </div>
  );
};

export default Home;
