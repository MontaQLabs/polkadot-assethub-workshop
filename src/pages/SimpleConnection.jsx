import React, { useState } from "react";
import { usePolkadotApi } from "../contexts/PolkadotApiContext.jsx";

function SimpleConnection() {
  const { api, isConnecting, isConnected, error, chainInfo, connectApi } = usePolkadotApi();
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [localError, setLocalError] = useState(null);

  const handleConnect = async () => {
    setLocalError(null);
    setConnectionInfo(null);

    try {
      // Use the context API or trigger a fresh connection
      const apiInstance = await connectApi();
      
      if (chainInfo) {
        setConnectionInfo({
          ...chainInfo,
          timestamp: new Date().toLocaleString(),
        });
      }
    } catch (err) {
      console.error("Connection failed:", err);
      setLocalError(err.message || "Failed to connect to the blockchain");
    }
  };

  // If already connected, show the chain info
  const handleShowInfo = () => {
    if (chainInfo) {
      setConnectionInfo({
        ...chainInfo,
        timestamp: new Date().toLocaleString(),
      });
    }
  };

  return (
    <div className="page">
      <div className="card">
        <h1 className="wallet-title">🔗 Simple Connection</h1>
        <p className="subtitle">
          Connect to the Polkadot Asset Hub and retrieve basic chain
          information
        </p>

        <div className="connection-status">
          <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          {isConnected && chainInfo && (
            <div className="chain-info-summary">
              <strong>{chainInfo.chain}</strong> - {chainInfo.nodeName}
            </div>
          )}
        </div>

        <div className="button-group">
          <button
            className="connect-button"
            onClick={isConnected ? handleShowInfo : handleConnect}
            disabled={isConnecting}
          >
            {isConnecting && <div className="loading"></div>}
            {isConnecting 
              ? 'Connecting...' 
              : isConnected 
                ? '📊 Show Chain Info' 
                : '🔗 Connect to Asset Hub'
            }
          </button>
        </div>

        {(error || localError) && (
          <div className="error">
            <strong>❌ Error:</strong> {error || localError}
          </div>
        )}

        {connectionInfo && (
          <div className="results">
            <h3>📊 Chain Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Chain:</strong> {connectionInfo.chain}
              </div>
              <div className="info-item">
                <strong>Node:</strong> {connectionInfo.nodeName}
              </div>
              <div className="info-item">
                <strong>Version:</strong> {connectionInfo.nodeVersion}
              </div>
              <div className="info-item">
                <strong>Endpoint:</strong> {connectionInfo.endpoint}
              </div>
              <div className="info-item">
                <strong>Connected at:</strong> {connectionInfo.timestamp}
              </div>
            </div>
          </div>
        )}

        <div className="demo-section">
          <h3>ℹ️ What this demonstrates:</h3>
          <ul>
            <li>🔗 WebSocket connection to Polkadot Asset Hub</li>
            <li>📡 Retrieving basic chain metadata</li>
            <li>🔄 Connection state management</li>
            <li>⚡ Shared API instance across the application</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default SimpleConnection; 