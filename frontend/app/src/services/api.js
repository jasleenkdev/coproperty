export async function getNonce(address) {
    const res = await fetch(`/api/auth/nonce?wallet=${address}`);
    return await res.json();
}
export async function walletLogin(address, signature) {
    const res = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            wallet_address: address,
            signature: signature
        })
    });

    const data = await res.json();
    localStorage.setItem("access_token", data.access);
    return data;
}

const API_BASE_URL = "http://localhost:8000";

export async function getProperties() {
    const res = await fetch(`${API_BASE_URL}/properties/`);
    return await res.json();
}

export async function getPropertyOwnership(id) {
    const res = await fetch(`${API_BASE_URL}/properties/${id}/ownership/`);
    return await res.json();
}

export async function getPropertyPayouts(id) {
    const res = await fetch(`${API_BASE_URL}/properties/${id}/payouts/`);
    return await res.json();
}