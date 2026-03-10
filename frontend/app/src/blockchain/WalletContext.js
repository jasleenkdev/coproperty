/* global BigInt */

import { BrowserProvider, Contract } from "ethers";
import { createContext, useContext, useEffect, useState } from "react";
import PropertyTokenABI from "./abis/PropertyToken.json";
import { NETWORK_CONFIG, PROPERTY_TOKEN_ADDRESS } from "./config";
import WalletAuthModal from "../components/WalletAuthModal";

const WalletContext = createContext();

export function WalletProvider({ children }) {

  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [propertyToken, setPropertyToken] = useState(null);
  const [, setChainId] = useState(null);
  const [username, setUsername] = useState(null);
  const [authMode, setAuthMode] = useState(null);
  const [authUsername, setAuthUsername] = useState("");
  const [authResolver, setAuthResolver] = useState(null);


  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setPropertyToken(null);
  };


  const openAuthModal = (mode, username = "") => {
    return new Promise((resolve) => {
      setAuthMode(mode);
      setAuthUsername(username);
      setAuthResolver(() => resolve);
    });
  };


  const closeAuthModal = () => {
    setAuthMode(null);
    setAuthResolver(null);
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

      const wallet = accounts[0];


      /* -------------------------------
         CHECK USER IN BACKEND
      --------------------------------*/

      const res = await fetch("http://localhost:8000/wallet/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          wallet_address: wallet
        })
      });

      const data = await res.json();



      /* -------------------------------
         NEW USER → REGISTER
      --------------------------------*/

      if (data.exists === false) {

        const authData = await openAuthModal("register");

        await fetch("http://localhost:8000/wallet/register/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            wallet_address: wallet,
            username: authData.username,
            password: authData.password
          })
        });
         setUsername(authData.username);
      }



      /* -------------------------------
         EXISTING USER → PASSWORD LOGIN
      --------------------------------*/

      else if (data.require_password) {

        const authData = await openAuthModal("login", data.username);

        const loginRes = await fetch("http://localhost:8000/wallet/login/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            wallet_address: wallet,
            password: authData.password
          })
        });

        const loginData = await loginRes.json();

        if (!loginData.success) {
          alert("Incorrect password");
          return;
        }
        setUsername(data.username);

      }



      /* -------------------------------
         ORIGINAL WALLET CONNECTION
      --------------------------------*/

      setAccount(wallet);
      setProvider(browserProvider);
      setChainId(network.chainId);



      /* -------------------------------
         ORIGINAL NETWORK VALIDATION
      --------------------------------*/

      if (network.chainId !== BigInt(parseInt(NETWORK_CONFIG.chainId, 16))) {

        try {

          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: NETWORK_CONFIG.chainId }]
          });

        } catch (switchError) {

          if (switchError.code === 4902) {

            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [NETWORK_CONFIG]
            });

          }

        }

      }



      /* -------------------------------
         ORIGINAL CONTRACT INITIALIZATION
      --------------------------------*/

      if (PROPERTY_TOKEN_ADDRESS) {

        const signer = await browserProvider.getSigner();

        const contract = new Contract(
          PROPERTY_TOKEN_ADDRESS,
          PropertyTokenABI,
          signer
        );

        setPropertyToken(contract);

      }

    } catch (error) {

      console.error("Failed to connect wallet:", error);

    }

  };



  /* -------------------------------
     HANDLE MODAL SUBMIT
  --------------------------------*/

  const handleAuthSubmit = (data) => {

    if (authResolver) {
      authResolver(data);
    }

    closeAuthModal();
  };



  /* -------------------------------
     ORIGINAL EVENT LISTENERS
  --------------------------------*/

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
    <>
      <WalletContext.Provider
        value={{
          account,
           username,
          provider,
          propertyToken,
          connectWallet,
          disconnectWallet,
          isConnected: !!account
        }}
      >
        {children}
      </WalletContext.Provider>

      {authMode && (
        <WalletAuthModal
          mode={authMode}
          username={authUsername}
          onSubmit={handleAuthSubmit}
          onClose={closeAuthModal}
        />
      )}
    </>
  );
}


export function useWallet() {
  return useContext(WalletContext);
}