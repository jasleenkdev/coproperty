import { formatEther } from "ethers";
import { useCallback, useEffect, useState } from "react";
import { useWallet } from "./WalletContext";

export function usePropertyToken(propertyId) {
  const { propertyToken, account } = useWallet();
  const [balance, setBalance] = useState(0);
  const [claimableRent, setClaimableRent] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!propertyToken || !account || !propertyId) return;

    try {
      const bal = await propertyToken.balanceOf(account, propertyId);
      setBalance(Number(bal)); // Safe for ~1000 tokens

      const rent = await propertyToken.claimableRent(account, propertyId);
      setClaimableRent(formatEther(rent));
    } catch (err) {
      console.error("Error fetching token data:", err);
    }
  }, [propertyToken, account, propertyId]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s poll
    return () => clearInterval(interval);
  }, [fetchData]);

  const claimRent = async () => {
    if (!propertyToken) return;
    setLoading(true);
    try {
      const tx = await propertyToken.claimRent(propertyId);
      await tx.wait();
      await fetchData();
      alert("Rent claimed successfully!");
    } catch (err) {
      console.error("Claim failed:", err);
      alert("Failed to claim rent.");
    } finally {
      setLoading(false);
    }
  };

  return {
    balance,
    claimableRent,
    claimRent,
    loading,
    refresh: fetchData
  };
}
