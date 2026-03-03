const API_BASE = "http://127.0.0.1:8000";

// ---------- PROPERTIES ----------
export const getProperties = async () => {
  const response = await fetch(`${API_BASE}/properties/`);
  return response.json();
};

export const getPropertyById = async (id) => {
  const response = await fetch(`${API_BASE}/properties/${id}/`);
  return response.json();
};

// ---------- OWNERSHIP ----------
export const getPropertyOwnership = async (id) => {
  const response = await fetch(`${API_BASE}/properties/${id}/ownership/`);
  return response.json();
};

// ---------- PAYOUTS ----------
export const getPropertyPayouts = async (id) => {
  const response = await fetch(`${API_BASE}/properties/${id}/payouts/`);
  return response.json();
};

export const getUserPayouts = async (userId) => {
  const response = await fetch(`${API_BASE}/users/${userId}/payouts/`);
  return response.json();
};

// ---------- TOKEN PURCHASE ----------
export const buyTokens = async (propertyId, amount, walletAddress) => {
  try {
    const response = await fetch(`${API_BASE}/properties/${propertyId}/buy/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        wallet_address: walletAddress,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Transaction failed" };
    }
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ---------- GOVERNANCE ----------
export const getPropertyProposals = async (id) => {
  const response = await fetch(`${API_BASE}/properties/${id}/proposals/`);
  return response.json();
};

export const getAllProposals = async () => {
  const response = await fetch(`${API_BASE}/proposals/`);
  if (!response.ok) {
    // Fallback: get proposals from all properties
    const properties = await getProperties();
    const allProposals = [];
    for (const prop of properties) {
      const proposals = await getPropertyProposals(prop.id);
      proposals.forEach((p) => {
        allProposals.push({
          ...p,
          property_id: prop.id,
          property_name: prop.name,
        });
      });
    }
    return allProposals;
  }
  return response.json();
};

export const createProposal = async (
  propertyId,
  title,
  description,
  proposalType,
) => {
  try {
    const response = await fetch(
      `${API_BASE}/properties/${propertyId}/proposals/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          proposal_type: proposalType,
        }),
      },
    );
    const data = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to create proposal",
      };
    }
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const voteOnProposal = async (
  proposalId,
  vote,
  walletAddress = null,
) => {
  try {
    const response = await fetch(`${API_BASE}/proposals/${proposalId}/vote/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ vote, wallet_address: walletAddress }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.error || "Vote failed" };
    }
    return { success: true, ...data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ---------- DASHBOARD ----------
export const getUserDashboard = async (walletAddress) => {
  try {
    const response = await fetch(
      `${API_BASE}/users/dashboard/?wallet=${walletAddress}`,
    );
    if (!response.ok) {
      // Construct dashboard from available data
      return null;
    }
    return response.json();
  } catch (error) {
    return null;
  }
};
