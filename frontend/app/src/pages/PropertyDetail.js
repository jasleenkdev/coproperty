import { useEffect, useState } from "react";
import {
  getPropertyOwnership,
  getPropertyPayouts,
  getPropertyProposals,
  voteOnProposal,
} from "../api/api";

const API_BASE_URL = "http://localhost:8000";

export default function PropertyDetail({ property, onBack }) {
  const [ownerships, setOwnerships] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [proposals, setProposals] = useState([]);

  const [tokenAmount, setTokenAmount] = useState("");
  const [userWallet, setUserWallet] = useState("");
  const [txHash, setTxHash] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= FETCH DATA ================= */

  const fetchOwnership = async () => {
    const data = await getPropertyOwnership(property.id);
    setOwnerships(data);
  };

  const fetchPayouts = async () => {
    const data = await getPropertyPayouts(property.id);
    setPayouts(data);
  };

  const fetchProposals = async () => {
    const data = await getPropertyProposals(property.id);
    setProposals(data);
  };

  useEffect(() => {
    fetchOwnership();
    fetchPayouts();
    fetchProposals();
  }, [property.id]);

  /* ================= BUY TOKENS ================= */

  const buyTokens = async () => {
    if (!userWallet || !tokenAmount) {
      alert("Please enter wallet address and token amount");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/properties/${property.id}/buy/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            wallet_address: userWallet,
            amount: tokenAmount,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transaction failed");
      }

      setTxHash(data.tx_hash);
      setTokenAmount("");
      fetchOwnership();
    } catch (error) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  /* ================= VOTING ================= */

  const handleVote = async (proposalId, voteChoice) => {
    try {
      await voteOnProposal(proposalId, voteChoice);
      fetchProposals();
    } catch (error) {
      console.error(error);
      alert("Vote failed");
    }
  };

  /* ================= RENDER ================= */

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={onBack}>← Back</button>

      <h2>{property.name}</h2>
      <p>📍 {property.location}</p>
      <p>📈 ROI: {property.roi.toFixed(2)}%</p>

      {/* ================= BUY TOKENS ================= */}

      <section style={{ marginBottom: "30px" }}>
        <h3>Buy Tokens</h3>

        <input
          type="text"
          placeholder="Wallet Address"
          value={userWallet}
          onChange={(e) => setUserWallet(e.target.value)}
          style={{ marginRight: "10px", width: "280px" }}
        />

        <input
          type="number"
          placeholder="Token Amount"
          value={tokenAmount}
          onChange={(e) => setTokenAmount(e.target.value)}
          style={{ marginRight: "10px", width: "120px" }}
        />

        <button onClick={buyTokens} disabled={loading}>
          {loading ? "Processing..." : "Buy"}
        </button>

        {txHash && (
          <div style={{ marginTop: "15px" }}>
            <p style={{ color: "green", fontWeight: "bold" }}>
              ✅ Transaction Successful
            </p>
          </div>
        )}
      </section>

      {/* ================= OWNERSHIP ================= */}

      <section style={{ marginBottom: "30px" }}>
        <h3>Ownership Distribution</h3>

        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>User</th>
              <th>Tokens</th>
              <th>Ownership %</th>
            </tr>
          </thead>
          <tbody>
            {ownerships.map((o, index) => (
            <tr key={index}>
  <td>
    {o.investor_name && o.investor_name !== "Anonymous" && o.investor_name !== "Investor"
      ? o.investor_name
      : o.wallet_address
        ? `${o.wallet_address.slice(0, 6)}...${o.wallet_address.slice(-4)}`
        : `User #${o.user}`}
  </td>
  <td>{o.tokens_owned}</td>
  <td>{o.ownership_percentage.toFixed(2)}%</td>
</tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ================= PAYOUTS ================= */}

      <section style={{ marginBottom: "30px" }}>
        <h3>Rent Payout History</h3>

        {payouts.length === 0 ? (
          <p>No payouts yet.</p>
        ) : (
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>User</th>
                <th>Amount</th>
                <th>Month</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p, index) => (
               <tr key={index}>
  <td>
    {p.investor_name && p.investor_name !== "Anonymous" && p.investor_name !== "Investor"
      ? p.investor_name
      : `User #${p.user}`}
  </td>
  <td>₹{p.amount}</td>
  <td>
    {p.month 
      ? new Date(p.month).toLocaleDateString("en-IN", {
          month: "short",
          year: "numeric",
        })
      : "Recent"}
  </td>
</tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ================= GOVERNANCE ================= */}

      <section>
        <h3>Governance Proposals</h3>

        {proposals.length === 0 ? (
          <p>No proposals yet.</p>
        ) : (
          proposals.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #ccc",
                padding: "12px",
                marginBottom: "12px",
                borderRadius: "6px",
              }}
            >
              <h4>{p.title}</h4>
              <p>{p.description}</p>

              <p>👍 For: {p.votes_for}</p>
              <p>👎 Against: {p.votes_against}</p>

              <button onClick={() => handleVote(p.id, true)}>
                Vote For
              </button>

              <button
                style={{ marginLeft: "10px" }}
                onClick={() => handleVote(p.id, false)}
              >
                Vote Against
              </button>

              {p.approved && (
                <p style={{ color: "green", marginTop: "6px" }}>
                  ✅ Approved
                </p>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
}