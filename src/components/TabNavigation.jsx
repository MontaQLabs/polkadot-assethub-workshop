import React from "react";
import { NavLink } from "react-router-dom";
import { Cable, Wallet, Code } from "lucide-react";

function TabNavigation() {
  return (
    <nav className="tab-navigation">
      <div className="nav-container">
        <div className="nav-tabs">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              `nav-tab ${isActive ? 'active' : ''}`
            }
            end
          >
            <Cable className="nav-icon" /><div>Simple Connection</div>
          </NavLink>
          <NavLink 
            to="/wallet" 
            className={({ isActive }) => 
              `nav-tab ${isActive ? 'active' : ''}`
            }
          >
            <Wallet className="nav-icon" /><div>Wallet Selection</div>
          </NavLink>
          <NavLink 
            to="/contracts" 
            className={({ isActive }) => 
              `nav-tab ${isActive ? 'active' : ''}`
            }
          >
            <Code className="nav-icon" /><div>Smart Contracts</div>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export default TabNavigation; 