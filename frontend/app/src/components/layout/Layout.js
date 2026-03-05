// Main Layout component with Navbar
import { Link, useLocation } from "react-router-dom";
import { useWallet } from "../../blockchain/WalletContext";

const navigation = [
  { name: "Properties", href: "/" },
  { name: "Dashboard", href: "/dashboard" },
  { name: "Governance", href: "/governance" },
];

export function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

function Navbar() {
  const location = useLocation();
 const { account, connectWallet, disconnectWallet, isConnected } = useWallet();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">CoProperty</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }
                  `}
                >
                  {item.name}
                </Link>
              );
            })}
          </div>

          {/* Wallet Button */}
          <div className="flex items-center gap-4">
            {/* Network Badge - Hardhat Local */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-gray-600">
                Hardhat Local
              </span>
            </div>

            {isConnected ? (
  <div className="flex items-center gap-2 px-4 py-2 bg-success-50 border border-success-200 rounded-xl">
    <span className="w-2 h-2 bg-success-500 rounded-full" />

    <span className="text-sm font-medium text-success-700">
      {account.slice(0, 6)}...{account.slice(-4)}
    </span>

    <button
      onClick={disconnectWallet}
      className="ml-2 text-xs bg-white border border-gray-200 px-2 py-1 rounded hover:bg-gray-100"
    >
      Logout
    </button>
  </div>
) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium text-sm transition-colors"
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
                    d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                  />
                </svg>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-100 px-4 py-2 flex gap-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`
                flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  isActive
                    ? "bg-primary-50 text-primary-700"
                    : "text-gray-600 hover:bg-gray-100"
                }
              `}
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {title}
          </h1>
          {description && <p className="mt-2 text-gray-600">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
