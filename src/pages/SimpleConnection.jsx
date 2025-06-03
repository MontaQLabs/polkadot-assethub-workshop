import React, { useState } from "react";
import { simpleConnection, endpoint } from "../../simple-connection.js";

function SimpleConnection() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [error, setError] = useState(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    setConnectionInfo(null);

    try {
      // Capture console.log output from simpleConnection
      const originalLog = console.log;
      let capturedOutput = "";

      console.log = (...args) => {
        capturedOutput = args.join(" ");
        originalLog(...args);
      };

      const { chain, nodeName, noeVersion } = await simpleConnection();

      // Restore original console.log
      console.log = originalLog;

      // Parse the captured output to extract information
      if (chain && nodeName && noeVersion) {
        setConnectionInfo({
          chain,
          nodeName,
          noeVersion,
          endpoint: endpoint,
          timestamp: new Date().toLocaleString(),
        });
      } else {
        setConnectionInfo({
          message: capturedOutput,
          endpoint: endpoint,
          timestamp: new Date().toLocaleString(),
        });
      }
    } catch (err) {
      console.error("Connection failed:", err);
      setError(err.message || "Failed to connect to the blockchain");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="page-content">
      <div className="card">
        <h1 className="title">Simple Connection</h1>
        <p className="subtitle">
          Connect to the Passeo Asset Hub and retrieve chain information
        </p>

        <button
          className="connect-button"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting && <div className="loading"></div>}
          {isConnecting ? "Connecting..." : "Connect to Passeo Asset Hub"}
        </button>

        {error && (
          <div className="error">
            <strong>Connection Error:</strong> {error}
          </div>
        )}

        {connectionInfo && (
          <div className="success">
            <strong>✅ Connection Successful!</strong>
            <div className="connection-info">
              <div className="info-item">
                <span className="info-label">Endpoint:</span>
                <span className="info-value">{connectionInfo.endpoint}</span>
              </div>
              {connectionInfo.chain && (
                <div className="info-item">
                  <span className="info-label">Chain:</span>
                  <span className="info-value">{connectionInfo.chain}</span>
                </div>
              )}
              {connectionInfo.nodeName && (
                <div className="info-item">
                  <span className="info-label">Node:</span>
                  <span className="info-value">{connectionInfo.nodeName}</span>
                </div>
              )}
              {connectionInfo.nodeVersion && (
                <div className="info-item">
                  <span className="info-label">Version:</span>
                  <span className="info-value">
                    {connectionInfo.nodeVersion}
                  </span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Connected at:</span>
                <span className="info-value">{connectionInfo.timestamp}</span>
              </div>
              {connectionInfo.message && !connectionInfo.chain && (
                <div className="info-item">
                  <span className="info-label">Message:</span>
                  <span className="info-value">{connectionInfo.message}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SimpleConnection; 