import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { PolkadotApiProvider } from "./contexts/PolkadotApiContext.jsx";
import TabNavigation from "./components/TabNavigation.jsx";
import SimpleConnection from "./pages/SimpleConnection.jsx";
import WalletSelectionPage from "./pages/WalletSelection.jsx";
import SmartContracts from "./pages/SmartContracts.jsx";
import AssetConversion from "./pages/AssetConversion.jsx";

function App() {
  return (
    <PolkadotApiProvider>
      <Router>
        <div className="app">
          <TabNavigation />
          <div className="app-content">
            <Routes>
              <Route path="/" element={<SimpleConnection />} />
              <Route path="/wallet" element={<WalletSelectionPage />} />
              <Route path="/asset-conversion" element={<AssetConversion />} />
              <Route path="/contracts" element={<SmartContracts />} />
            </Routes>
          </div>
        </div>
      </Router>
    </PolkadotApiProvider>
  );
}

export default App;
