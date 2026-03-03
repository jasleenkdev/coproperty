import { useWallet } from "../blockchain/WalletContext";

export default function ConnectWallet() {
  const { account, connectWallet, isConnected } = useWallet();

  if (isConnected) {
    return (
      <div style={{ 
        padding: "8px 16px", 
        background: "#4CAF50", 
        color: "white", 
        borderRadius: "4px",
        fontWeight: "bold",
        fontSize: "14px"
      }}>
        🟢 {account.slice(0, 6)}...{account.slice(-4)}
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      style={{
        padding: "8px 16px",
        background: "#2196F3",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px"
      }}
    >
      Connect Wallet
    </button>
  );
}
