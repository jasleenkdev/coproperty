import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import { WalletProvider } from "./blockchain/WalletContext";
import { Layout } from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import Governance from "./pages/Governance";
import PropertyDetailPage from "./pages/PropertyDetailPage";
import PropertyList from "./pages/PropertyList";

function App() {
  return (
    <WalletProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<PropertyList />} />
            <Route path="/property/:id" element={<PropertyDetailPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/governance" element={<Governance />} />
          </Routes>
        </Layout>
      </Router>
    </WalletProvider>
  );
}

export default App;