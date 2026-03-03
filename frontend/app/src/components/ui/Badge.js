// Badge component for status indicators
const variants = {
  default: "bg-gray-100 text-gray-700",
  primary: "bg-primary-100 text-primary-700",
  success: "bg-success-100 text-success-600",
  warning: "bg-warning-100 text-warning-600",
  danger: "bg-danger-100 text-danger-600",
};

const sizes = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
  lg: "px-3 py-1 text-sm",
};

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
  dot = false,
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            variant === "success"
              ? "bg-success-500"
              : variant === "danger"
                ? "bg-danger-500"
                : variant === "warning"
                  ? "bg-warning-500"
                  : variant === "primary"
                    ? "bg-primary-500"
                    : "bg-gray-500"
          }`}
        />
      )}
      {children}
    </span>
  );
}
