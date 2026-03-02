import { useEffect, useState } from "react";

export default function Properties({ onSelect }) {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/properties/")
      .then((res) => res.json())
      .then((data) => setProperties(data));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Available Properties</h2>

      {properties.map((p) => (
        <div
          key={p.id}
          onClick={() => onSelect(p)}
          style={{
            border: "1px solid #ccc",
            padding: "12px",
            marginBottom: "12px",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          <h3>{p.name}</h3>
          <p>📍 {p.location}</p>
          <p>📈 ROI: {p.roi.toFixed(2)}%</p>
        </div>
      ))}
    </div>
  );
}