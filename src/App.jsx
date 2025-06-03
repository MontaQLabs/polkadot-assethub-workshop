import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TabNavigation from "./components/TabNavigation.jsx";
import SimpleConnection from "./pages/SimpleConnection.jsx";
import WalletSelectionPage from "./pages/WalletSelection.jsx";
import SmartContracts from "./pages/SmartContracts.jsx";

function App() {
  return (
    <Router>
      <div className="app">
        <TabNavigation />
        <div className="app-content">
          <Routes>
            <Route path="/" element={<SimpleConnection />} />
            <Route path="/wallet" element={<WalletSelectionPage />} />
            <Route path="/contracts" element={<SmartContracts />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
