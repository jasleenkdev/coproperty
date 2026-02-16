import { useEffect, useState } from "react";
import { getProperties } from "../api/api";
import PropertyDetail from "./PropertyDetail";

export default function Properties() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);

  useEffect(() => {
    getProperties().then(setProperties);
  }, []);

  if (selectedProperty) {
    return (
      <PropertyDetail
        property={selectedProperty}
        onBack={() => setSelectedProperty(null)}
      />
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Community Properties</h1>

      {properties.map((p) => (
        <div
          key={p.id}
          onClick={() => setSelectedProperty(p)}
          style={{
            border: "1px solid #ddd",
            padding: "12px",
            marginBottom: "10px",
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
