import { useState } from "react";
import { usePolkadotApi } from "../../contexts/PolkadotApiContext.jsx";

export default function SetMetadata({ selectedAccount }) {
  const { api, isConnected, ensureApi } = usePolkadotApi();
  
  // Form state
  const [assetId, setAssetId] = useState("");
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [decimals, setDecimals] = useState("10");
  
  // Operation state
  const [isSettingMetadata, setIsSettingMetadata] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const setMetadata = async () => {
    // Reset previous results
    setResult("");
    setError("");
    
    // Validation
    if (!selectedAccount) {
      setError("❌ Please connect a wallet and select an account first!");
      return;
    }
    
    if (!isConnected || !api) {
      setError("❌ API not connected. Please wait for connection...");
      return;
    }
    
    if (!assetId.trim()) {
      setError("❌ Please enter an asset ID");
      return;
    }
    
    if (!name.trim()) {
      setError("❌ Please enter an asset name");
      return;
    }
    
    if (!symbol.trim()) {
      setError("❌ Please enter an asset symbol");
      return;
    }
    
    const parsedAssetId = parseInt(assetId.trim());
    if (isNaN(parsedAssetId) || parsedAssetId < 0) {
      setError("❌ Please enter a valid positive asset ID");
      return;
    }
    
    const parsedDecimals = parseInt(decimals);
    if (isNaN(parsedDecimals) || parsedDecimals < 0 || parsedDecimals > 255) {
      setError("❌ Decimals must be between 0 and 255");
      return;
    }

    setIsSettingMetadata(true);
    setResult("🔄 Setting asset metadata...");

    try {
      // Ensure API is ready
      const apiInstance = await ensureApi();
      
      // Create the metadata setting transaction
      // Parameters: (id, name, symbol, decimals, is_frozen)
      const transactionExtrinsic = apiInstance.tx.assets.setMetadata(
        parsedAssetId,
        name.trim(),
        symbol.trim(),
        parsedDecimals,
      );

      // Sign and send the transaction
      const txHash = await transactionExtrinsic.signAndSend(
        selectedAccount.account.address, 
        { signer: selectedAccount.signer }
      );
      
      setResult(`✅ Asset metadata transaction submitted! Transaction hash: ${txHash}`);
      
      // Reset form after success
      setAssetId("");
      setName("");
      setSymbol("");
      setDecimals("10");
      
    } catch (error) {
      console.error("Set metadata error:", error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      if (error.message.includes("BadOrigin")) {
        errorMessage = "Account does not have permission to force set metadata (requires ForceOrigin)";
      } else if (error.message.includes("Unknown")) {
        errorMessage = "Asset ID does not exist";
      } else if (error.message.includes("NoPermission")) {
        errorMessage = "Insufficient permissions to set metadata";
      } else if (error.message.includes("BalanceLow")) {
        errorMessage = "Insufficient balance to pay transaction fees";
      } else if (error.message.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user";
      } else if (error.message.includes("StringLimit")) {
        errorMessage = "Asset name or symbol exceeds maximum length limit";
      }
      
      setError(`❌ Setting metadata failed: ${errorMessage}`);
    } finally {
      setIsSettingMetadata(false);
    }
  };

  return (
    <div className="set-metadata-container">
      <h3 className="feature-title">📝 Set Asset Metadata</h3>
      <p className="feature-description">
        Set metadata for an asset you own.
      </p>
      
      {/* Connection Status */}
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 API Connected' : '🔴 API Disconnected'}
        </div>
        {!isConnected && (
          <div className="warning">
            ⚠️ Please wait for API connection to enable metadata setting...
          </div>
        )}
      </div>

      {/* Form */}
      <div className="asset-form">
        <div className="form-group">
          <label htmlFor="assetId">Asset ID:</label>
          <input
            id="assetId"
            type="number"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="Enter asset ID to update (e.g., 2000)"
            className="form-input"
            disabled={isSettingMetadata || !isConnected}
            min="0"
          />
          <small className="form-help">
            The identifier of the asset to update metadata for
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="name">Asset Name:</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter asset name (e.g., My Token)"
            className="form-input"
            disabled={isSettingMetadata || !isConnected}
            maxLength="50"
          />
          <small className="form-help">
            The user-friendly name of this asset (limited by StringLimit)
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="symbol">Asset Symbol:</label>
          <input
            id="symbol"
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="Enter symbol (e.g., MTK)"
            className="form-input"
            disabled={isSettingMetadata || !isConnected}
            maxLength="12"
          />
          <small className="form-help">
            The exchange symbol for this asset (limited by StringLimit)
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="decimals">Decimals:</label>
          <input
            id="decimals"
            type="number"
            value={decimals}
            onChange={(e) => setDecimals(e.target.value)}
            placeholder="Number of decimals (default: 10)"
            className="form-input"
            disabled={isSettingMetadata || !isConnected}
            min="0"
            max="255"
          />
          <small className="form-help">
            The number of decimals this asset uses to represent one unit (0-255)
          </small>
        </div>

        <div className="form-group">
          <label>Origin Account:</label>
          <div className="account-info">
            {selectedAccount ? (
              <div className="selected-account">
                <strong>{selectedAccount.account.meta.name}</strong>
                <br />
                <small>{selectedAccount.account.address}</small>
              </div>
            ) : (
              <div className="no-account">
                No account selected. Please connect a wallet first.
              </div>
            )}
          </div>
        </div>

        <button
          onClick={setMetadata}
          disabled={isSettingMetadata || !isConnected || !selectedAccount}
          className="create-button"
        >
          {isSettingMetadata ? "🔄 Setting Metadata..." : "📝 Set Metadata"}
        </button>
      </div>

      {/* Results */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {result && (
        <div className="success-message">
          {result}
        </div>
      )}
    </div>
  );
}
