// Ownership Chart using recharts
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

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

const TOTAL_SUPPLY = 1000;

export default function OwnershipChart({ ownerships }) {
  const totalSupply = TOTAL_SUPPLY;

  const investedTokens = ownerships.reduce(
    (sum, o) => sum + o.tokens_owned,
    0
  );

  const uninvestedTokens = totalSupply - investedTokens;

  const data = [
    ...ownerships.map((o) => ({
      name: o.wallet_address
        ? `${o.wallet_address.slice(0, 6)}...${o.wallet_address.slice(-4)}`
        : `User #${o.user}`,
      tokens: o.tokens_owned,
    })),
    {
      name: "Uninvested",
      tokens: uninvestedTokens,
    },
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;

      return (
        <div className="bg-white shadow-lg rounded-lg p-3 border border-gray-100">
          <p className="font-medium text-gray-900">{d.name}</p>
          <p className="text-sm text-gray-600">{d.tokens} tokens</p>
          <p className="text-sm text-primary-600 font-medium">
            {((d.tokens / totalSupply) * 100).toFixed(1)}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;

    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight={600}
      >
        {(percent * 100).toFixed(1)}%
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={100}
          paddingAngle={2}
          dataKey="tokens"
          labelLine={false}
          label={renderCustomizedLabel}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke="white"
              strokeWidth={2}
            />
          ))}
        </Pie>

        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
}