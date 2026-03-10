import { Route, BrowserRouter as Router, Routes, Navigate } from "react-router-dom";
import "./App.css";
import { WalletProvider } from "./blockchain/WalletContext";
import { Layout } from "./components/layout/Layout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Governance from "./pages/Governance";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import PropertyList from "./pages/PropertyList";

function App() {
  return (
    <WalletProvider>
      <Router>
        <Routes>

          {/* redirect root */}
          <Route path="/" element={<Navigate to="/properties" />} />

          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/properties" element={<PropertyList />} />
                  <Route path="/property/:id" element={<PropertyDetailPage />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/governance" element={<Governance />} />
                </Routes>
              </Layout>
            }
          />

        </Routes>
      </Router>
    </WalletProvider>
  );
}

export default App;