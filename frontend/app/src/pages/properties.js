import { useEffect, useState, useContext } from "react";
import { WalletContext } from "../context/WalletContext";
import { getTokenBalance } from "../services/web3";
import abi from "../contracts/PropertyTokenABI.json";

export default function PropertyDetail({ property, onBack }) {
  const { address } = useContext(WalletContext);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    async function fetchBalance() {
      if (!address) return;

      const tokenBalance = await getTokenBalance(
        property.contract_address,
        abi,
        address
      );

      setBalance(tokenBalance);
    }

    fetchBalance();
  }, [address, property]);

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={onBack}>⬅ Back</button>

      <h2>{property.name}</h2>
      <p>📍 {property.location}</p>

      {address ? (
        <p>🪙 Your Tokens: {balance ?? "Loading..."}</p>
      ) : (
        <p>Connect wallet to see ownership</p>
      )}
    </div>
  );
}