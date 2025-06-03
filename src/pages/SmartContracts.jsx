import React, { useState } from "react";
import { callRetrieve, storeValue } from "../../simple-contract-calls.js";
import { ethersProvider } from "../../ethersProvider.js";

function SmartContracts() {
  // Contract call state
  const [contractAddress, setContractAddress] = useState("");
  const [contractResult, setContractResult] = useState(null);
  const [contractError, setContractError] = useState(null);
  const [isCallingContract, setIsCallingContract] = useState(false);

  // Tab state for contract operations
  const [activeTab, setActiveTab] = useState("retrieve");
  
  // Store operation state
  const [valueToStore, setValueToStore] = useState("");
  const [storeResult, setStoreResult] = useState(null);
  const [storeError, setStoreError] = useState(null);
  const [isStoringValue, setIsStoringValue] = useState(false);

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
    <div className="page-content">
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

export default SmartContracts; 