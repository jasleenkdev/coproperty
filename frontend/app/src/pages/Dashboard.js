// Ownership Dashboard Page
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProperties,
  getPropertyOwnership,
  getPropertyPayouts,
} from "../api/api";
import { useWallet } from "../blockchain/WalletContext";
import OwnershipChart from "../components/charts/OwnershipChart";
import { PageHeader } from "../components/layout/Layout";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  PageLoader,
  StatCard,
} from "../components/ui";

export default function Dashboard() {
  const { account, isConnected } = useWallet();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [historicalRent, setHistoricalRent] = useState(0);
  const [allOwnerships, setAllOwnerships] = useState([]);

  const fetchDashboardData = useCallback(async () => {
    if (!isConnected || !account) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const properties = await getProperties();
      const portfolioData = [];
      let tokens = 0;
      let value = 0;
      let rent = 0;
      let historical = 0;
      const allOwnershipData = [];

      for (const property of properties) {
        const [ownerships, payouts] = await Promise.all([
          getPropertyOwnership(property.id),
          getPropertyPayouts(property.id),
        ]);

        // Collect all ownerships for the pie chart
        ownerships.forEach((o) => {
          allOwnershipData.push({
            ...o,
            property_name: property.name,
            property_id: property.id,
          });
        });

        // Find user's ownership
        const userOwnership = ownerships.find(
          (o) =>
            o.wallet_address?.toLowerCase() === account?.toLowerCase() ||
            o.user === 1, // Fallback for demo
        );

        if (userOwnership) {
          const ownershipPercent = userOwnership.ownership_percentage || 0;
          const netMonthlyRent =
            (property.monthly_rent - property.maintenance_cost) *
            (ownershipPercent / 100);
          const tokenValue =
            (property.purchase_price / (property.total_token_supply || 1000)) *
            userOwnership.tokens_owned;

          portfolioData.push({
            property,
            ownership: userOwnership,
            monthlyRent: netMonthlyRent,
            tokenValue,
          });

          tokens += userOwnership.tokens_owned;
          value += tokenValue;
          rent += netMonthlyRent;

          // Calculate historical payouts
        // Calculate historical payouts
          // Calculate historical payouts
          const userPayouts = payouts.filter(
            (p) =>
              // 1. Check if the nested user object's username matches (the wallet)
              p.user_username?.toLowerCase() === account?.toLowerCase() ||
              // 2. Check the investor_name field we added to the serializer
              p.investor_name?.toLowerCase() === account?.toLowerCase() ||
              // 3. Fallback check for raw user ID if needed
              p.user === userOwnership.user
          );

          historical += userPayouts.reduce(
            (sum, p) => sum + parseFloat(p.amount || 0),
            0,
          );
        }
      }

      setPortfolio(portfolioData);
      setTotalTokens(tokens);
      setTotalValue(value);
      setMonthlyRent(rent);
      setHistoricalRent(historical);
      setAllOwnerships(allOwnershipData);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [account, isConnected]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!isConnected) {
    return (
      <div>
        <PageHeader title="Investment Dashboard" />
        <Card className="text-center py-16">
          <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-primary-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Connect Your Wallet
          </h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Connect your wallet to view your investment portfolio, token
            holdings, and rental income.
          </p>
          <Button onClick={() => navigate("/")}>Browse Properties</Button>
        </Card>
      </div>
    );
  }

  if (loading) return <PageLoader />;

  return (
    <div>
      <PageHeader
        title="Investment Dashboard"
        description={`Wallet: ${account.slice(0, 8)}...${account.slice(-6)}`}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Tokens"
          value={totalTokens.toLocaleString()}
          subtitle={`Across ${portfolio.length} properties`}
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
        <StatCard
          title="Portfolio Value"
          value={formatCurrency(totalValue)}
          subtitle="Token valuation"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"
              />
            </svg>
          }
        />
        <StatCard
          title="Est. Monthly Income"
          value={formatCurrency(monthlyRent)}
          subtitle="Based on current rent"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
        />
        <StatCard
          title="Total Rent Earned"
          value={formatCurrency(historicalRent)}
          subtitle="Historical payouts"
          icon={
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Holdings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Property Holdings</CardTitle>
            </CardHeader>
            {portfolio.length > 0 ? (
              <div className="space-y-4">
                {portfolio.map(
                  ({ property, ownership, monthlyRent, tokenValue }) => (
                    <div
                      key={property.id}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => navigate(`/property/${property.id}`)}
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-8 h-8 text-primary-400"
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
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 truncate">
                            {property.name}
                          </h4>
                          <Badge variant="success" size="sm">
                            {property.roi?.toFixed(1)}% ROI
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {property.location}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-gray-900">
                          {ownership.tokens_owned} tokens
                        </p>
                        <p className="text-sm text-gray-500">
                          {ownership.ownership_percentage?.toFixed(2)}%
                          ownership
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <p className="font-medium text-success-600">
                          {formatCurrency(monthlyRent)}/mo
                        </p>
                        <p className="text-xs text-gray-400">Est. income</p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-gray-400"
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Investments Yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Start building your portfolio by investing in properties
                </p>
                <Button onClick={() => navigate("/")}>Browse Properties</Button>
              </div>
            )}
          </Card>

          {/* Investor Distribution */}
          {allOwnerships.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Token Distribution Overview</CardTitle>
              </CardHeader>
              <div className="flex justify-center">
                <OwnershipChart ownerships={allOwnerships.slice(0, 8)} />
              </div>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                {allOwnerships.slice(0, 8).map((o, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-gray-600 truncate">
                      {o.wallet_address
                        ? `${o.wallet_address.slice(0, 4)}...${o.wallet_address.slice(-3)}`
                        : `User #${o.user}`}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => navigate("/")}
              >
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Invest in Properties
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/governance")}
              >
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                View Proposals
              </Button>
            </div>
          </Card>

          {/* Network Info */}
          <Card>
            <CardHeader>
              <CardTitle>Network Status</CardTitle>
            </CardHeader>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Network</span>
                <Badge variant="success" dot>
                  Hardhat Local
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Chain ID</span>
                <span className="font-medium text-gray-900">31337</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-sm">Status</span>
                <Badge variant="success" dot>
                  Connected
                </Badge>
              </div>
            </div>
          </Card>

          {/* Recent Activity (Static for demo) */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            {historicalRent > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-success-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      Rent Payout Received
                    </p>
                    <p className="text-gray-500 text-xs">
  {portfolio[0]?.ownership ? new Date(portfolio[0].ownership.month || Date.now()).toLocaleDateString("en-IN", { month: 'long', year: 'numeric' }) : "This month"}
</p>
                  </div>
                  <span className="font-medium text-success-600">
                    +{formatCurrency(monthlyRent)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                No recent activity
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
