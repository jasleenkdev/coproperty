// Stat Card component for dashboard
import { Card } from "./Card";

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  className = "",
}) {
  return (
    <Card className={className} hover>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
          {trend !== undefined && (
            <div className="mt-2 flex items-center gap-1">
              <span
                className={`text-sm font-medium ${
                  trend >= 0 ? "text-success-500" : "text-danger-500"
                }`}
              >
                {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
              </span>
              {trendLabel && (
                <span className="text-sm text-gray-400">{trendLabel}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
