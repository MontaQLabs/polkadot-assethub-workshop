import React from "react";
import { Link, useLocation } from "react-router-dom";
import ApiStatusIndicator from "./ApiStatusIndicator.jsx";

function TabNavigation() {
  const location = useLocation();

  const tabs = [
    { path: "/", label: "Simple Connection", icon: "🔗" },
    { path: "/wallet", label: "Wallet Selection", icon: "👛" },
    { path: "/asset-conversion", label: "Asset Conversion", icon: "🔄" },
    { path: "/contracts", label: "Smart Contracts", icon: "📝" },
  ];

  return (
    <nav className="tab-navigation">
      <div className="nav-header">
        <h1 className="app-title">🚀 Asset Hub Workshop</h1>
        <ApiStatusIndicator />
      </div>
      
      <div className="tab-list">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`tab ${location.pathname === tab.path ? "active" : ""}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default TabNavigation; 