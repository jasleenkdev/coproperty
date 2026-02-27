import { ethers } from "ethers";


export async function getTokenBalance(contractAddress, abi, walletAddress) {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, abi, provider);

    const rawBalance = await contract.balanceOf(walletAddress);
    return ethers.formatUnits(rawBalance, 18);
}
export async function signNonce(signer, nonce) {
    return await signer.signMessage(nonce);
}

export async function connectWallet() {
    if (!window.ethereum) {
        alert("MetaMask not installed");
        return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();

    return { provider, signer, address };
}