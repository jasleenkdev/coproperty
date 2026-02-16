const API_BASE = "http://127.0.0.1:8000";

// ---------- PROPERTIES ----------
export const getProperties = async () => {
  const response = await fetch(`${API_BASE}/properties/`);
  return response.json();
};

// ---------- OWNERSHIP ----------
export const getPropertyOwnership = async (id) => {
  const response = await fetch(
    `${API_BASE}/properties/${id}/ownership/`
  );
  return response.json();
};

// ---------- PAYOUTS ----------
export const getPropertyPayouts = async (id) => {
  const response = await fetch(
    `${API_BASE}/properties/${id}/payouts/`
  );
  return response.json();
};

// ---------- GOVERNANCE ----------
export const getPropertyProposals = async (id) => {
  const response = await fetch(
    `${API_BASE}/properties/${id}/proposals/`
  );
  return response.json();
};

export const voteOnProposal = async (proposalId, vote) => {
  await fetch(
    `${API_BASE}/proposals/${proposalId}/vote/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vote }),
    }
  );
};
