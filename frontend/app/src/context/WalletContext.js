import { createContext, useState } from "react";
import { connectWallet, signNonce } from "../services/web3";
import { getNonce, walletLogin } from "../services/api";

export const WalletContext = createContext();

export function WalletProvider({ children }) {
    const [address, setAddress] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const loginWithWallet = async () => {
        try {
            // 1. Connect wallet
            const { signer, address } = await connectWallet();

            // 2. Request nonce from backend
            const nonceData = await getNonce(address);

            // 3. Sign nonce
            const signature = await signNonce(signer, nonceData.nonce);

            // 4. Send signature to Django
            await walletLogin(address, signature);

            // 5. Save wallet state
            setAddress(address);
            setIsAuthenticated(true);

        } catch (error) {
            console.error("Wallet login failed:", error);
        }
    };

    return (
        <WalletContext.Provider
            value={{
                address,
                isAuthenticated,
                loginWithWallet
            }}
        >
            {children}
        </WalletContext.Provider>
    );
}