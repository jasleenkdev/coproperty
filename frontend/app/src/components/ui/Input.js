// Input components
export function Input({ label, error, className = "", id, ...props }) {
  const inputId = id || props.name;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-2.5 rounded-lg border transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          ${
            error
              ? "border-danger-500 bg-danger-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-danger-500">{error}</p>}
    </div>
  );
}

export function TextArea({
  label,
  error,
  className = "",
  id,
  rows = 4,
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`
          w-full px-4 py-2.5 rounded-lg border transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          resize-none
          ${
            error
              ? "border-danger-500 bg-danger-50"
              : "border-gray-200 bg-white hover:border-gray-300"
          }
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-danger-500">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  options = [],
  className = "",
  id,
  placeholder = "Select an option",
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1.5"
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`
          w-full px-4 py-2.5 rounded-lg border transition-colors duration-200
          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
          bg-white
          ${
            error
              ? "border-danger-500 bg-danger-50"
              : "border-gray-200 hover:border-gray-300"
          }
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-danger-500">{error}</p>}
    </div>
  );
}
