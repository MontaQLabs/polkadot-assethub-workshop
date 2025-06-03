import React, { useState } from "react";
import { simpleConnection, endpoint } from "../simple-connection.js";
import { callRetrieve, storeValue } from "../simple-contract-calls.js";
import WalletSelection from "../wallet-selection.jsx";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { ethersProvider } from "../ethersProvider.js";
import { RECIPIENT, WND_DECIMALS, WND_SYMBOL, ASSET_HUB_WS, ASSET_HUB_RPC, PASSET_HUB_WS, PASSEO_SYMBOL, PASSEO_DECIMALS } from "../constants.js";

function App() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [error, setError] = useState(null);

  // Wallet selection state
  const [selectedAccount, setSelectedAccount] = useState(null);

  // Demo functionality state
  const [demoAction, setDemoAction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  // Contract call state
  const [contractAddress, setContractAddress] = useState("");
  const [contractResult, setContractResult] = useState(null);
  const [contractError, setContractError] = useState(null);
  const [isCallingContract, setIsCallingContract] = useState(false);

  // New tab state for contract operations
  const [activeTab, setActiveTab] = useState("retrieve");
  
  // Store operation state
  const [valueToStore, setValueToStore] = useState("");
  const [storeResult, setStoreResult] = useState(null);
  const [storeError, setStoreError] = useState(null);
  const [isStoringValue, setIsStoringValue] = useState(false);

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
          endpoint: ASSET_HUB_RPC,
          timestamp: new Date().toLocaleString(),
        });
      } else {
        setConnectionInfo({
          message: capturedOutput || "Connected successfully",
          endpoint: ASSET_HUB_RPC,
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

  const transferTransaction = async () => {
    if (!selectedAccount) {
      setDemoAction("❌ Please select an account first!");
      return;
    }

    setIsProcessing(true);
    setDemoAction("🔄 Executing transaction...");

    try {
      const api = await ApiPromise.create({
        provider: new WsProvider(PASSET_HUB_WS),
      });
      
      // Wait for the API to be ready
      await api.isReady;
      
      // Use balances.transferKeepAlive instead of balances.transfer for Asset Hub
      const transactionExtrinsic = api.tx.balances.transferKeepAlive(
        RECIPIENT,
        1 * PASSEO_DECIMALS
      );

      await transactionExtrinsic.signAndSend(selectedAccount.account.address, { signer: selectedAccount.injector.signer });
      
      setDemoAction("✅ Transaction submitted successfully!");
    } catch (error) {
      console.error("Transaction error:", error);
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
        provider: new WsProvider(PASSET_HUB_WS),
      });

      // Wait for the API to be ready
      await api.isReady;

      const { data: balance } = await api.query.system.account(
        selectedAccount.account.address
      );
      setDemoAction(`💰 Account balance: ${balance.free / PASSEO_DECIMALS} ${PASSEO_SYMBOL}`);
    } catch (error) {
      console.error("Balance check error:", error);
      setDemoAction(`❌ Balance check failed: ${error.message}`); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContractCall = async () => {
    if (!contractAddress.trim()) {
      setContractError("Please enter a contract address");
      return;
    }

    // Basic address validation
    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setContractError("Please enter a valid Ethereum address (0x followed by 40 hex characters)");
      return;
    }

    setIsCallingContract(true);
    setContractError(null);
    setContractResult(null);

    try {
      const result = await callRetrieve(contractAddress);
      setContractResult(result);
    } catch (error) {
      console.error("Contract call error:", error);
      setContractError(error.message);
    } finally {
      setIsCallingContract(false);
    }
  };

  const handleStoreValue = async () => {
    if (!contractAddress.trim()) {
      setStoreError("Please enter a contract address");
      return;
    }

    if (!valueToStore.trim()) {
      setStoreError("Please enter a value to store");
      return;
    }

    // Basic address validation
    if (!contractAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setStoreError("Please enter a valid Ethereum address (0x followed by 40 hex characters)");
      return;
    }

    // Validate numeric input
    const numericValue = parseInt(valueToStore);
    if (isNaN(numericValue) || numericValue < 0) {
      setStoreError("Please enter a valid positive number");
      return;
    }

    setIsStoringValue(true);
    setStoreError(null);
    setStoreResult(null);

    try {
      // Create an ethers signer from the selected account
      const provider = ethersProvider;

      const ethersSigner = await provider.getSigner();
      const result = await storeValue(contractAddress, numericValue, ethersSigner);
      setStoreResult(result);
      
    } catch (error) {
      console.error("Store operation error:", error);
      setStoreError(error.message);
    } finally {
      setIsStoringValue(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Clear previous results when switching tabs
    setContractResult(null);
    setContractError(null);
    setStoreResult(null);
    setStoreError(null);
  };

  return (
    <div className="app">
      {/* Blockchain Connection Section */}
      <div className="card">
        <h1 className="title">Polkadot Simple Connection</h1>
        <p className="subtitle">
          Connect to the Westend Asset Hub and retrieve chain information
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
              onClick={transferTransaction}
              disabled={isProcessing}
            >
              {isProcessing && <div className="loading"></div>}
              📝 Simple Transfer
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

      {/* Smart Contract Call Section */}
      <div className="card">
        <h2 className="wallet-title">📋 Smart Contract Calls</h2>
        <p className="subtitle">
          Call smart contracts on Asset Hub using ethers.js
        </p>

        {/* Tab Navigation */}
        <div className="contract-tabs">
          <button
            className={`tab-button ${activeTab === "retrieve" ? "active" : ""}`}
            onClick={() => handleTabChange("retrieve")}
          >
            📖 Retrieve Value
          </button>
          <button
            className={`tab-button ${activeTab === "store" ? "active" : ""}`}
            onClick={() => handleTabChange("store")}
          >
            💾 Store Value
          </button>
        </div>

        {/* Contract Address Input - Common for both tabs */}
        <div className="contract-input-section">
          <label htmlFor="contractAddress" className="input-label">
            Contract Address:
          </label>
          <input
            id="contractAddress"
            type="text"
            className="contract-input"
            placeholder="0x1234567890123456789012345678901234567890"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            disabled={isCallingContract || isStoringValue}
          />
        </div>

        {/* Retrieve Tab Content */}
        {activeTab === "retrieve" && (
          <div className="tab-content">
            <button
              className="demo-action-button contract-demo"
              onClick={handleContractCall}
              disabled={isCallingContract || !contractAddress.trim()}
            >
              {isCallingContract && <div className="loading"></div>}
              📞 Call retrieve() Function
            </button>

            {contractError && (
              <div className="error">
                <strong>Contract Error:</strong> {contractError}
              </div>
            )}

            {contractResult && (
              <div className="success">
                <strong>✅ Contract Call Successful!</strong>
                <div className="connection-info">
                  <div className="info-item">
                    <span className="info-label">Contract Address:</span>
                    <span className="info-value">{contractResult.contractAddress}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Stored Value:</span>
                    <span className="info-value">{contractResult.storedValue}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Contract Type:</span>
                    <span className="info-value">{contractResult.contractType}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Function Called:</span>
                    <span className="info-value">{contractResult.functionCalled}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Network:</span>
                    <span className="info-value">{contractResult.networkInfo.chainName}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">RPC Endpoint:</span>
                    <span className="info-value">{contractResult.networkInfo.rpcUrl}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Store Tab Content */}
        {activeTab === "store" && (
          <div className="tab-content">
            <div className="contract-input-section">
              <label htmlFor="valueToStore" className="input-label">
                Value to Store:
              </label>
              <input
                id="valueToStore"
                type="number"
                className="contract-input"
                placeholder="Enter a number (e.g., 42)"
                value={valueToStore}
                onChange={(e) => setValueToStore(e.target.value)}
                disabled={isStoringValue}
                min="0"
              />
            </div>

            <button
              className="demo-action-button contract-demo store-demo"
              onClick={handleStoreValue}
              disabled={
                isStoringValue || 
                !contractAddress.trim() || 
                !valueToStore.trim()
              }
            >
              {isStoringValue && <div className="loading"></div>}
              💾 Call store() Function
            </button>

            {storeError && (
              <div className="error">
                <strong>Store Error:</strong> {storeError}
              </div>
            )}

            {storeResult && (
              <div className="success">
                <strong>✅ Value Stored Successfully!</strong>
                <div className="connection-info">
                  <div className="info-item">
                    <span className="info-label">Transaction Hash:</span>
                    <span className="info-value">{storeResult.transactionHash}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Block Number:</span>
                    <span className="info-value">{storeResult.blockNumber}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Gas Used:</span>
                    <span className="info-value">{storeResult.gasUsed}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Stored Value:</span>
                    <span className="info-value">{storeResult.storedValue}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Contract Address:</span>
                    <span className="info-value">{storeResult.contractAddress}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="contract-help">
          <h3>💡 How to use:</h3>
          {activeTab === "retrieve" ? (
            <ul>
              <li>Enter a valid Storage contract address (0x format)</li>
              <li>Click "Call retrieve() Function" to get the stored value</li>
              <li>This is a read-only operation that doesn't require gas</li>
              <li>The contract must be deployed on Asset Hub (Westend)</li>
            </ul>
          ) : (
            <ul>
              <li>Enter a valid Storage contract address (0x format)</li>
              <li>Enter a positive number to store in the contract</li>
              <li>Select an account with signing capability</li>
              <li>Click "Call store() Function" to store the value</li>
              <li>This operation requires gas fees and transaction signing</li>
              <li>The contract must be deployed on Asset Hub (Westend)</li>
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}

export default App;
