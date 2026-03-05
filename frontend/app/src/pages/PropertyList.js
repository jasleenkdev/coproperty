// Property List Page
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProperties } from "../api/api";
import { PageHeader } from "../components/layout/Layout";
import { Badge, Button, Card, PageLoader } from "../components/ui";

const API_BASE_URL = "http://127.0.0.1:8000";

export default function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getProperties()
      .then(setProperties)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Investment Properties"
        description="Browse tokenized real estate opportunities and invest in fractional property ownership"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onSelect={() => navigate(`/property/${property.id}`)}
          />
        ))}
      </div>

      {properties.length === 0 && (
        <Card className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Properties Available
          </h3>
          <p className="text-gray-500">
            Check back later for new investment opportunities.
          </p>
        </Card>
      )}
    </div>
  );
}

function PropertyCard({ property, onSelect }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card hover className="cursor-pointer group" onClick={onSelect}>
      {/* PROPERTY IMAGE */}
      <div className="h-40 rounded-lg mb-4 overflow-hidden">
        {property.image ? (
          <img
            src={`http://127.0.0.1:8000${property.image}`}
            alt={property.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="h-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
            <svg
              className="w-16 h-16 text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"
              />
            </svg>
          </div>
        )}
      </div>

      {/* PROPERTY INFO */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
            {property.name}
          </h3>
          <Badge variant="success">{property.roi?.toFixed(1)}% ROI</Badge>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {property.location}
        </div>

        <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Price
            </p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(property.purchase_price)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              Monthly Rent
            </p>
            <p className="font-semibold text-gray-900">
              {formatCurrency(property.monthly_rent)}
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          className="w-full mt-2"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          View Details
        </Button>
      </div>
    </Card>
  );
}