// Property Detail Page
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  buyTokens,
  getProperties,
  getPropertyOwnership,
  getPropertyPayouts,
} from "../api/api";
import { useWallet } from "../blockchain/WalletContext";
import OwnershipChart from "../components/charts/OwnershipChart";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Input,
  LoadingOverlay,
  PageLoader,
} from "../components/ui";
const API_BASE_URL = "http://localhost:8000";
export default function PropertyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { account, isConnected } = useWallet();

  const [property, setProperty] = useState(null);
  const [ownerships, setOwnerships] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buyAmount, setBuyAmount] = useState("");
  const [buyLoading, setBuyLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const properties = await getProperties();
      const prop = properties.find((p) => p.id === parseInt(id));
      if (prop) {
        setProperty(prop);
        const [ownershipData, payoutData] = await Promise.all([
          getPropertyOwnership(prop.id),
          getPropertyPayouts(prop.id),
        ]);
        setOwnerships(ownershipData);
        setPayouts(payoutData);
      }
    } catch (error) {
      console.error("Error fetching property:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBuyTokens = async () => {
    if (!buyAmount || parseInt(buyAmount) <= 0) {
      setAlert({ type: "error", message: "Please enter a valid token amount" });
      return;
    }

    if (!isConnected) {
      setAlert({
        type: "warning",
        message: "Please connect your wallet first",
      });
      return;
    }

    setBuyLoading(true);
    setAlert(null);

    try {
      const result = await buyTokens(property.id, parseInt(buyAmount), account);
      if (result.success) {
        setAlert({
          type: "success",
          message: `Successfully purchased ${buyAmount} tokens! Transaction: ${result.tx_hash?.slice(0, 10)}...`,
        });
        setBuyAmount("");
        fetchData(); // Refresh data
      } else {
        setAlert({
          type: "error",
          message: result.error || "Transaction failed",
        });
      }
    } catch (error) {
      setAlert({
        type: "error",
        message: error.message || "Failed to purchase tokens",
      });
    } finally {
      setBuyLoading(false);
    }
  };

  const handleDistributeRent = async () => {
    setBuyLoading(true); 
    setAlert(null);
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${property.id}/distribute-rent/`, {
        method: "POST",
      });
      const data = await response.json();
      
      if (response.ok) {
        setAlert({ type: "success", message: data.message });
        fetchData(); // This refreshes the tables automatically
      } else {
        setAlert({ type: "error", message: data.error || "Failed to distribute rent" });
      }
    } catch (error) {
      setAlert({ type: "error", message: "Server error occurred while distributing rent" });
    } finally {
      setBuyLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (loading) return <PageLoader />;
  if (!property) {
    return (
      <Card className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Property Not Found
        </h3>
        <Button onClick={() => navigate("/")}>Back to Properties</Button>
      </Card>
    );
  }

  const userOwnership = ownerships.find(
    (o) => o.wallet_address?.toLowerCase() === account?.toLowerCase(),
  );

  return (
    <div>
      {buyLoading && <LoadingOverlay message="Processing transaction..." />}

      {/* Back Button */}
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Properties
      </button>

      {/* Property Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Property Image */}
          <div className="lg:w-1/3 h-48 lg:h-64 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl flex items-center justify-center">
            <svg
              className="w-20 h-20 text-primary-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>

          {/* Property Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-start gap-3 mb-4">
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                {property.name}
              </h1>
              <Badge variant="success" size="lg">
                {property.roi?.toFixed(1)}% ROI
              </Badge>
            </div>

            <div className="flex items-center gap-2 text-gray-500 mb-6">
              <svg
                className="w-5 h-5"
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Purchase Price
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(property.purchase_price)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Monthly Rent
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(property.monthly_rent)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Maintenance
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(property.maintenance_cost)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                  Total Supply
                </p>
                <p className="text-lg font-bold text-gray-900">
                  {property.total_token_supply || 1000} Tokens
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Buy Tokens & Your Ownership */}
        <div className="space-y-6">
          {/* Buy Tokens Card */}
          <Card>
            <CardHeader>
              <CardTitle>Buy Tokens</CardTitle>
            </CardHeader>

            {alert && (
              <Alert
                variant={alert.type}
                className="mb-4"
                onDismiss={() => setAlert(null)}
              >
                {alert.message}
              </Alert>
            )}

            {!isConnected ? (
              <Alert variant="warning">
                Connect your wallet to purchase tokens
              </Alert>
            ) : (
              <div className="space-y-4">
                <Input
                  type="number"
                  label="Token Amount"
                  placeholder="Enter number of tokens"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(e.target.value)}
                  min="1"
                />
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleBuyTokens}
                  loading={buyLoading}
                  disabled={!buyAmount || buyLoading}
                >
                  {buyLoading ? "Processing..." : "Buy Tokens"}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Tokens will be minted to your wallet
                </p>
              </div>
            )}
          </Card>

          {/* Your Ownership Card */}
          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle>Your Ownership</CardTitle>
              </CardHeader>
              {userOwnership ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tokens Owned</span>
                    <span className="font-bold text-xl text-gray-900">
                      {userOwnership.tokens_owned}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ownership %</span>
                    <Badge variant="primary" size="lg">
                      {userOwnership.ownership_percentage?.toFixed(2)}%
                    </Badge>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500">
                      Est. Monthly Income:{" "}
                      {formatCurrency(
                        (property.monthly_rent - property.maintenance_cost) *
                          (userOwnership.ownership_percentage / 100),
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  You don't own any tokens yet
                </p>
              )}
            </Card>
          )}
        </div>

        {/* Middle Column - Ownership Distribution */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ownership Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Ownership Distribution</CardTitle>
            </CardHeader>
            {ownerships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex justify-center">
                  <OwnershipChart ownerships={ownerships} />
                </div>
                <div>
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wide">
                        <th className="pb-3">Investor</th>
                        <th className="pb-3 text-right">Tokens</th>
                        <th className="pb-3 text-right">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {ownerships.map((o, index) => (
                        <tr key={index} className="text-sm">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: getColor(index) }}
                              />
                              <span className="text-gray-700 font-medium">
                                {o.investor_name && o.investor_name !== "Anonymous" && o.investor_name !== "Investor"
                                  ? o.investor_name
                                  : o.wallet_address
                                    ? `${o.wallet_address.slice(0, 6)}...${o.wallet_address.slice(-4)}`
                                    : `User #${o.user || 'Unknown'}`}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-right font-medium text-gray-900">
                            {o.tokens_owned}
                          </td>
                          <td className="py-3 text-right">
                            <Badge variant="default">
                              {(o.ownership_percentage || 0).toFixed(1)}%
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No ownership data available yet. Be the first investor!
              </p>
            )}
          </Card>

          {/* Payout History */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Rent Payout History</CardTitle>
              <Button 
                onClick={handleDistributeRent} 
                variant="outline" 
                size="sm"
                disabled={buyLoading}
              >
                {buyLoading ? "Distributing..." : "Distribute Rent"}
              </Button>
            </CardHeader>
            {payouts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <th className="pb-3">Investor</th>
                      <th className="pb-3 text-right">Amount</th>
                      <th className="pb-3 text-right">Month</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {payouts.slice(0, 10).map((p, index) => (
                      <tr key={index} className="text-sm">
                       <td className="py-3 text-gray-700 font-medium">
                          {p.user_username && p.user_username !== "Anonymous" && p.user_username !== "Investor"
                            ? p.user_username
                            : typeof p.user === 'string'
                              ? `${p.user.slice(0, 6)}...${p.user.slice(-4)}`
                              : "Unknown"}
                        </td>
                        <td className="py-3 text-right font-medium text-success-600">
                        {formatCurrency(p.amount)}
                        </td>
                        <td className="py-3 text-right text-gray-500">
                          {p.month 
                            ? new Date(p.month).toLocaleDateString("en-IN", {
                                month: "short",
                                year: "numeric",
                              })
                            : "Recent"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No payouts distributed yet
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

const COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

function getColor(index) {
  return COLORS[index % COLORS.length];
}

