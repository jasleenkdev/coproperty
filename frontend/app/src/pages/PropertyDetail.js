import { useEffect, useState } from "react";
import {
    getPropertyOwnership,
    getPropertyPayouts,
    getPropertyProposals,
    voteOnProposal,
} from "../api/api";
import OwnershipPie from "../components/OwnershipPie";

export default function PropertyDetail({ property, onBack }) {
  const [ownerships, setOwnerships] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [proposals, setProposals] = useState([]);

  useEffect(() => {
    getPropertyOwnership(property.id).then(setOwnerships);
    getPropertyPayouts(property.id).then(setPayouts);
    getPropertyProposals(property.id).then(setProposals);
  }, [property.id]);

  return (
    <div style={{ padding: "20px" }}>
      <button onClick={onBack}>← Back</button>

      <h2>{property.name}</h2>
      <p>📍 {property.location}</p>
      <p>📈 ROI: {property.roi.toFixed(2)}%</p>

      {/* ================= OWNERSHIP ================= */}
      <h3>Ownership Distribution</h3>
      <table border="1" cellPadding="8" style={{ marginBottom: "20px" }}>
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
              <td>User #{o.user}</td>
              <td>{o.tokens_owned}</td>
              <td>{o.ownership_percentage.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      {ownerships.length > 0 && <OwnershipPie ownerships={ownerships} />}

      {/* ================= PAYOUTS ================= */}
      <h3>Rent Payout History</h3>

      {payouts.length === 0 ? (
        <p>No payouts yet.</p>
      ) : (
        <table border="1" cellPadding="8" style={{ marginBottom: "30px" }}>
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
                <td>User #{p.user}</td>
                <td>₹{p.amount}</td>
                <td>{new Date(p.month).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ================= GOVERNANCE ================= */}
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

            <button
              onClick={async () => {
                await voteOnProposal(p.id, true);
                getPropertyProposals(property.id).then(setProposals);
              }}
            >
              Vote For
            </button>

            <button
              style={{ marginLeft: "10px" }}
              onClick={async () => {
                await voteOnProposal(p.id, false);
                getPropertyProposals(property.id).then(setProposals);
              }}
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
    </div>
  );
}
