import { useEffect, useState } from "react";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function Properties({ onSelect }) {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/properties/`)
      .then((res) => res.json())
      .then((data) => {
        console.log("RAW API RESPONSE:", data);

        // Normalize to array
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.results)
          ? data.results
          : [];

        console.log("NORMALIZED LIST:", list);
        setProperties(list);
      })
      .catch((err) => console.error("Fetch error:", err));
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Available Properties</h2>

      {properties.length === 0 && <p>No properties found.</p>}

      {properties.map((p) => {
        console.log("PROPERTY:", p);

        const imageUrl = p.image
          ? p.image.startsWith("http")
            ? p.image
            : `${API_BASE_URL}${p.image.startsWith("/") ? "" : "/"}${p.image}`
          : null;

        console.log("IMAGE URL:", imageUrl);

        return (
          <div
            key={p.id}
            onClick={() => onSelect && onSelect(p)}
            style={{
              border: "1px solid #ccc",
              padding: "12px",
              marginBottom: "12px",
              borderRadius: "6px",
              cursor: "pointer",
              maxWidth: "420px",
            }}
          >
            {imageUrl && (
              <img
                src={imageUrl}
                alt={p.name}
                style={{
                  width: "100%",
                  height: "220px",
                  objectFit: "cover",
                  borderRadius: "6px",
                  marginBottom: "10px",
                }}
              />
            )}

            <h3>{p.name}</h3>
            <p>📍 {p.location}</p>
            {typeof p.roi === "number" && (
              <p>📈 ROI: {p.roi.toFixed(2)}%</p>
            )}
          </div>
        );
      })}
    </div>
  );
}