import { useState } from "react";

export default function WalletAuthModal({ mode, username, onSubmit, onClose }) {
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = () => {
    if (mode === "register") {
      if (!user || !password) return alert("Username and password required");
      onSubmit({ username: user, password });
    } else {
      if (!password) return alert("Password required");
      onSubmit({ password });
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>

        <h2 style={{ marginBottom: "10px" }}>
          {mode === "register" ? "Create Account" : "Login"}
        </h2>

        {mode === "login" && (
          <p style={{ color: "#666", marginBottom: "15px" }}>
            Enter password for <b>{username}</b>
          </p>
        )}

        {mode === "register" && (
          <input
            placeholder="Username"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            style={inputStyle}
          />
        )}

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <div style={{ marginTop: "20px", display: "flex", gap: "10px" }}>
          <button style={primaryBtn} onClick={handleSubmit}>
            {mode === "register" ? "Create Account" : "Login"}
          </button>

          <button style={secondaryBtn} onClick={onClose}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle = {
  background: "white",
  padding: "30px",
  borderRadius: "10px",
  width: "320px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  textAlign: "center",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "6px",
  border: "1px solid #ccc",
  fontSize: "14px",
};

const primaryBtn = {
  flex: 1,
  padding: "10px",
  border: "none",
  borderRadius: "6px",
  background: "#2196F3",
  color: "white",
  cursor: "pointer",
  fontWeight: "bold",
};

const secondaryBtn = {
  flex: 1,
  padding: "10px",
  border: "none",
  borderRadius: "6px",
  background: "#eee",
  cursor: "pointer",
};