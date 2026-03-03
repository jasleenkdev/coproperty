// Reusable Card component with variants
export function Card({
  children,
  className = "",
  hover = false,
  padding = "p-6",
}) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 ${padding} ${
        hover ? "hover:shadow-md transition-shadow duration-200" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = "" }) {
  return (
    <div className={`border-b border-gray-100 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = "" }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-900 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = "" }) {
  return (
    <p className={`text-sm text-gray-500 mt-1 ${className}`}>{children}</p>
  );
}

export function CardContent({ children, className = "" }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return (
    <div className={`border-t border-gray-100 pt-4 mt-4 ${className}`}>
      {children}
    </div>
  );
}
