/* global BigInt */
import { BrowserProvider, Contract } from "ethers";
import { createContext, useContext, useEffect, useState } from "react";
import PropertyTokenABI from "./abis/PropertyToken.json";
import { NETWORK_CONFIG, PROPERTY_TOKEN_ADDRESS } from "./config";

const WalletContext = createContext();

export function WalletProvider({ children }) {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [propertyToken, setPropertyToken] = useState(null);
  const [, setChainId] = useState(null);
  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setPropertyToken(null);
  };
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      const accounts = await browserProvider.send("eth_requestAccounts", []);
      const network = await browserProvider.getNetwork();

      setAccount(accounts[0]);
      setProvider(browserProvider);
      setChainId(network.chainId);

      // Check network
      if (network.chainId !== BigInt(parseInt(NETWORK_CONFIG.chainId, 16))) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: NETWORK_CONFIG.chainId }],
          });
        } catch (switchError) {
          // This error code indicates that the chain has not been added to MetaMask.
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [NETWORK_CONFIG],
            });
          }
        }
      }

      if (PROPERTY_TOKEN_ADDRESS) {
        const signer = await browserProvider.getSigner();
        const contract = new Contract(
          PROPERTY_TOKEN_ADDRESS,
          PropertyTokenABI,
          signer,
        );
        setPropertyToken(contract);
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        setAccount(accounts[0] || null);
        window.location.reload();
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        provider,
        propertyToken,
        connectWallet,
        disconnectWallet,
        isConnected: !!account,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  return useContext(WalletContext);
}
