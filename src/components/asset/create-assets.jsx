import { useState } from "react";
import { usePolkadotApi } from "../../contexts/PolkadotApiContext.jsx";

export default function CreateAssets({ selectedAccount }) {
  const { api, isConnected, ensureApi } = usePolkadotApi();
  
  // Form state
  const [assetId, setAssetId] = useState("");
  const [minBalance, setMinBalance] = useState("1");
  
  // Operation state
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const createAsset = async () => {
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
    
    const parsedAssetId = parseInt(assetId.trim());
    if (isNaN(parsedAssetId) || parsedAssetId < 0) {
      setError("❌ Please enter a valid positive asset ID");
      return;
    }
    
    const parsedMinBalance = parseInt(minBalance);
    if (isNaN(parsedMinBalance) || parsedMinBalance < 1) {
      setError("❌ Minimum balance must be at least 1");
      return;
    }

    setIsCreating(true);
    setResult("🔄 Creating asset...");

    try {
      // Ensure API is ready
      const apiInstance = await ensureApi();
      
      // Create the asset creation transaction
      // Parameters: (assetId, admin, minBalance)
      const transactionExtrinsic = apiInstance.tx.assets.create(
        parsedAssetId,
        selectedAccount.account.address, // Admin account
        parsedMinBalance
      );

      // Sign and send the transaction
      const txHash = await transactionExtrinsic.signAndSend(
        selectedAccount.account.address, 
        { signer: selectedAccount.signer }
      );
      
      setResult(`✅ Asset creation transaction submitted! Transaction hash: ${txHash}`);
      
      // Reset form after success
      setAssetId("");
      setMinBalance("1");
      
    } catch (error) {
      console.error("Asset creation error:", error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      if (error.message.includes("BadOrigin")) {
        errorMessage = "Account does not have permission to create assets";
      } else if (error.message.includes("InUse")) {
        errorMessage = "Asset ID is already in use";
      } else if (error.message.includes("TooManyReserves")) {
        errorMessage = "Account has too many asset reserves";
      } else if (error.message.includes("NoPermission")) {
        errorMessage = "Insufficient permissions to create asset";
      } else if (error.message.includes("BalanceLow")) {
        errorMessage = "Insufficient balance to create asset";
      } else if (error.message.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user";
      }
      
      setError(`❌ Asset creation failed: ${errorMessage}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="create-assets-container">
      <h3 className="feature-title">🎯 Create New Asset</h3>
      <p className="feature-description">
        Create a new asset on the Asset Hub network with custom properties
      </p>
      
      {/* Connection Status */}
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 API Connected' : '🔴 API Disconnected'}
        </div>
        {!isConnected && (
          <div className="warning">
            ⚠️ Please wait for API connection to enable asset creation...
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
            placeholder="Enter unique asset ID (e.g., 2000)"
            className="form-input"
            disabled={isCreating || !isConnected}
            min="0"
          />
          <small className="form-help">
            Choose a unique numeric ID for your asset
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="minBalance">Minimum Balance:</label>
          <input
            id="minBalance"
            type="number"
            value={minBalance}
            onChange={(e) => setMinBalance(e.target.value)}
            placeholder="Minimum balance (default: 1)"
            className="form-input"
            disabled={isCreating || !isConnected}
            min="1"
          />
          <small className="form-help">
            Minimum balance accounts must hold for this asset
          </small>
        </div>

        <div className="form-group">
          <label>Admin Account:</label>
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
          <small className="form-help">
            This account will be the admin/owner of the asset
          </small>
        </div>

        <button
          onClick={createAsset}
          disabled={isCreating || !isConnected || !selectedAccount}
          className="create-button"
        >
          {isCreating ? "🔄 Creating Asset..." : "🎯 Create Asset"}
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

      {/* Help Information */}
      <div className="help-section">
        <h4>💡 How Asset Creation Works:</h4>
        <ul>
          <li>Choose a unique asset ID that hasn't been used before</li>
          <li>Set a minimum balance requirement for accounts holding this asset</li>
          <li>Your account will become the admin/owner of the asset</li>
          <li>After creation, you can mint tokens and set metadata</li>
          <li>Asset creation requires network fees to be paid</li>
        </ul>
      </div>
    </div>
  );
}