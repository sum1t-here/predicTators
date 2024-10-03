import React from "react";
import BetForm from "./BetForm";

const MarketCard = ({ market }) => {
  return (
    <div className="border p-4 rounded-md shadow-md">
      <h3 className="text-xl font-semibold">{market.event_name}</h3>
      <p>Location: {market.location}</p>
      <p>End Time: {new Date(market.end_time * 1000).toLocaleString()}</p>
      <p>Yes Bets: {market.yes_bets}</p>
      <p>No Bets: {market.no_bets}</p>

      {/* Include BetForm component to allow betting */}
      <BetForm marketPublicKey={market.publicKey} />
    </div>
  );
};

export default MarketCard;
