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