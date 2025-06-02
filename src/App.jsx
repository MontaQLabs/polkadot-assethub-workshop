import React, { useState } from "react";
import { simpleConnection, endpoint } from "../simple-connection.js";
import WalletSelection from "../wallet-selection.jsx";
import { ApiPromise, WsProvider } from "@polkadot/api";

function App() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [error, setError] = useState(null);

  // Wallet selection state
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Demo functionality state
  const [demoAction, setDemoAction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

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

      await simpleConnection();

      // Restore original console.log
      console.log = originalLog;

      // Parse the captured output to extract information
      const match = capturedOutput.match(
        /You are connected to chain (.+) using (.+) v(.+)/
      );
      if (match) {
        setConnectionInfo({
          chain: match[1],
          nodeName: match[2],
          nodeVersion: match[3],
          endpoint: endpoint,
          timestamp: new Date().toLocaleString(),
        });
      } else {
        setConnectionInfo({
          message: capturedOutput || "Connected successfully",
          endpoint: "wss://paseo.rpc.amforc.com:443",
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

  const handleAccountSelect = (accountData) => {
    setSelectedAccount(accountData);
    setDemoAction("");
    console.log("Selected account for dApp:", accountData);
  };

  const simulateTransaction = async () => {
    if (!selectedAccount) {
      setDemoAction("❌ Please select an account first!");
      return;
    }

    setIsProcessing(true);
    setDemoAction("🔄 Preparing transaction...");

    try {
      // Simulate transaction preparation
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setDemoAction(
        `✅ Ready to sign with ${
          selectedAccount.account.meta.name || "selected account"
        }! In a real dApp, this would create and sign a transaction.`
      );

      // In a real dApp, you would use the selectedAccount.signer here:
      // const tx = await api.tx.balances.transfer(recipient, amount);
      // await tx.signAndSend(selectedAccount.account.address, { signer: selectedAccount.signer });
    } catch (error) {
      setDemoAction(`❌ Demo failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const checkBalance = async () => {
    if (!selectedAccount) {
      setDemoAction("❌ Please select an account first!");
      return;
    }

    setIsProcessing(true);
    setDemoAction("🔍 Checking account balance...");

    try {
      const api = await ApiPromise.create({
        provider: new WsProvider(endpoint),
      });

      const { data: balance } = await api.query.system.account(
        selectedAccount.account.address
      );
      setDemoAction(`💰 Account balance: ${balance.free / 10 ** 12} WND`);
    } catch (error) {
      setDemoAction(`❌ Balance check failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app">
      {/* Blockchain Connection Section */}
      <div className="card">
        <h1 className="title">Polkadot Simple Connection</h1>
        <p className="subtitle">
          Connect to the Westend testnet and retrieve chain information
        </p>

        <button
          className="connect-button"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting && <div className="loading"></div>}
          {isConnecting ? "Connecting..." : "Connect to Westend Asset Hub"}
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

      {/* Wallet Selection Component */}
      <WalletSelection
        onAccountSelect={handleAccountSelect}
        selectedAccount={selectedAccount}
      />

      {/* Demo Actions Section */}
      {selectedAccount && (
        <div className="card">
          <h2 className="wallet-title">🎯 dApp Demo Actions</h2>
          <p className="subtitle">
            Test dApp functionality with your selected account
          </p>

          <div className="demo-actions-grid">
            <button
              className="demo-action-button transaction-demo"
              onClick={simulateTransaction}
              disabled={isProcessing}
            >
              {isProcessing && <div className="loading"></div>}
              📝 Simulate Transaction
            </button>

            <button
              className="demo-action-button balance-demo"
              onClick={checkBalance}
              disabled={isProcessing}
            >
              {isProcessing && <div className="loading"></div>}
              💰 Check Balance
            </button>
          </div>

          {demoAction && (
            <div className="demo-result">
              <strong>Demo Result:</strong>
              <p>{demoAction}</p>
            </div>
          )}

          {/* Active Account Summary */}
          <div className="active-account-summary">
            <h3>🔗 Active Account</h3>
            <div className="account-summary-grid">
              <div className="summary-item">
                <span className="summary-label">Name:</span>
                <span className="summary-value">
                  {selectedAccount.account.meta.name || "Unnamed Account"}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Wallet:</span>
                <span className="summary-value">
                  {selectedAccount.account.meta.source}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Address:</span>
                <span className="summary-value address-short">
                  {`${selectedAccount.account.address.slice(
                    0,
                    12
                  )}...${selectedAccount.account.address.slice(-12)}`}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Ready to Sign:</span>
                <span className="summary-value">
                  {selectedAccount.signer ? "✅ Yes" : "❌ No"}
                </span>
              </div>
            </div>
          </div>

          {/* Integration Status */}
          <div className="integration-status">
            <div className="status-grid">
              <div className="status-item">
                <span className="status-icon">🌐</span>
                <span className="status-text">
                  Chain: {connectionInfo ? "✅ Connected" : "❌ Not Connected"}
                </span>
              </div>
              <div className="status-item">
                <span className="status-icon">👛</span>
                <span className="status-text">
                  Wallet: {selectedAccount ? "✅ Selected" : "❌ Not Selected"}
                </span>
              </div>
              <div className="status-item">
                <span className="status-icon">🔐</span>
                <span className="status-text">
                  Signer:{" "}
                  {selectedAccount?.signer ? "✅ Ready" : "❌ Not Ready"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
