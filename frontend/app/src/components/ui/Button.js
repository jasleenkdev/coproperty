// Reusable Button component with variants
const variants = {
  primary: "bg-primary-600 hover:bg-primary-700 text-white shadow-sm",
  secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900",
  success: "bg-success-500 hover:bg-success-600 text-white shadow-sm",
  danger: "bg-danger-500 hover:bg-danger-600 text-white shadow-sm",
  warning: "bg-warning-500 hover:bg-warning-600 text-white shadow-sm",
  outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50",
  ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  onClick,
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-lg
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}

export function Spinner({ size = "md", className = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <svg
      className={`animate-spin ${sizeClasses[size]} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function IconButton({ children, className = "", ...props }) {
  return (
    <button
      className={`
        p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}
