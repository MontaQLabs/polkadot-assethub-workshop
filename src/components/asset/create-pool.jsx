import { useState } from "react";
import { usePolkadotApi } from "../../contexts/PolkadotApiContext.jsx";

export default function CreatePool({ selectedAccount }) {
  const { api, isConnected, ensureApi } = usePolkadotApi();
  
  // Form state
  const [asset1Type, setAsset1Type] = useState("native"); // "native" or "asset"
  const [asset1Id, setAsset1Id] = useState("");
  const [asset2Type, setAsset2Type] = useState("asset"); // "native" or "asset"
  const [asset2Id, setAsset2Id] = useState("");
  
  // Operation state
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [lpTokenId, setLpTokenId] = useState(null);

  // Helper function to create asset location object
  const createAssetLocation = (type, assetId) => {
    if (type === "native") {
      // Native token (WND) location for Westend Asset Hub
      // This matches the working format in asset-conversion.jsx
      return {
        parents: 1,
        interior: "Here"
      };
    } else {
      // Asset location for custom assets on Westend Asset Hub
      // This format matches the working USDT example (asset 1984)
      return {
        parents: 0,
        interior: {
          X2: [
            { PalletInstance: 50 }, // Assets pallet instance
            { GeneralIndex: parseInt(assetId) }
          ]
        }
      };
    }
  };

  const createPool = async () => {
    // Reset previous results
    setResult("");
    setError("");
    setLpTokenId(null);
    
    // Validation
    if (!selectedAccount) {
      setError("❌ Please connect a wallet and select an account first!");
      return;
    }
    
    if (!isConnected || !api) {
      setError("❌ API not connected. Please wait for connection...");
      return;
    }
    
    // Validate asset inputs
    if (asset1Type === "asset" && (!asset1Id.trim() || isNaN(parseInt(asset1Id)))) {
      setError("❌ Please enter a valid Asset 1 ID");
      return;
    }
    
    if (asset2Type === "asset" && (!asset2Id.trim() || isNaN(parseInt(asset2Id)))) {
      setError("❌ Please enter a valid Asset 2 ID");
      return;
    }

    // Prevent same asset pool creation
    if (asset1Type === asset2Type && asset1Type === "asset" && asset1Id === asset2Id) {
      setError("❌ Cannot create pool with the same asset twice");
      return;
    }

    // Additional validation for native-native pairs
    if (asset1Type === "native" && asset2Type === "native") {
      setError("❌ Cannot create pool with native token (WND) paired with itself");
      return;
    }

    setIsCreating(true);
    setResult("🔄 Creating liquidity pool...");

    try {
      // Ensure API is ready
      const apiInstance = await ensureApi();
      
      // Create asset location objects
      const asset1Location = createAssetLocation(asset1Type, asset1Id);
      const asset2Location = createAssetLocation(asset2Type, asset2Id);

      // Debug logging
      console.log("🔍 Asset 1 Location:", JSON.stringify(asset1Location, null, 2));
      console.log("🔍 Asset 2 Location:", JSON.stringify(asset2Location, null, 2));
      
      // Helpful message about what we're trying to create
      const asset1Desc = asset1Type === "native" ? "WND (Native)" : `Asset ${asset1Id}`;
      const asset2Desc = asset2Type === "native" ? "WND (Native)" : `Asset ${asset2Id}`;
      setResult(`🔄 Creating pool for ${asset1Desc} ↔ ${asset2Desc}...`);

      // Create the pool creation transaction
      const transactionExtrinsic = apiInstance.tx.assetConversion.createPool(
        asset1Location,
        asset2Location
      );

      // Sign and send the transaction with event handling
      const unsub = await transactionExtrinsic.signAndSend(
        selectedAccount.account.address,
        { signer: selectedAccount.signer },
        ({ status, events = [] }) => {
          if (status.isInBlock || status.isFinalized) {
            // Process events to find PoolCreated event
            events.forEach(({ event }) => {
              if (apiInstance.events.assetConversion.PoolCreated.is(event)) {
                const [poolId, lpToken] = event.data;
                console.log("Pool created event:", event.data.toString());
                
                // Extract LP token ID from the event
                let lpTokenIdValue = null;
                if (lpToken && lpToken.toJSON) {
                  const lpTokenData = lpToken.toJSON();
                  // Handle different possible structures of LP token data
                  if (lpTokenData.interior && lpTokenData.interior.x2) {
                    const generalIndex = lpTokenData.interior.x2.find(item => item.generalIndex !== undefined);
                    if (generalIndex) {
                      lpTokenIdValue = generalIndex.generalIndex;
                    }
                  } else if (typeof lpTokenData === 'number') {
                    lpTokenIdValue = lpTokenData;
                  }
                }
                
                setLpTokenId(lpTokenIdValue);
                setResult(`✅ Liquidity pool created successfully!
                  Pool ID: ${poolId.toString()}
                  LP Token ID: ${lpTokenIdValue || 'Unknown'}
                  Block: ${status.isInBlock ? 'In Block' : 'Finalized'}`);
              }
            });

            // Check for any errors in events
            const errorEvent = events.find(({ event }) => apiInstance.events.system.ExtrinsicFailed.is(event));
            if (errorEvent) {
              const [dispatchError] = errorEvent.event.data;
              let errorMessage = dispatchError.toString();
              
              if (dispatchError.isModule) {
                try {
                  const decoded = apiInstance.registry.findMetaError(dispatchError.asModule);
                  errorMessage = `${decoded.section}.${decoded.name}: ${decoded.docs}`;
                } catch (error) {
                  console.error("Error decoding:", error);
                }
              }
              
              setError(`❌ Pool creation failed: ${errorMessage}`);
            }

            unsub();
            setIsCreating(false);
          }
        }
      );
      
    } catch (error) {
      console.error("Pool creation error:", error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      if (error.message.includes("PoolExists")) {
        errorMessage = "Pool already exists for this asset pair";
      } else if (error.message.includes("BadOrigin")) {
        errorMessage = "Account does not have permission to create pools";
      } else if (error.message.includes("AssetNotFound")) {
        errorMessage = "One or both assets not found";
      } else if (error.message.includes("BalanceLow")) {
        errorMessage = "Insufficient balance to create pool";
      } else if (error.message.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user";
      }
      
      setError(`❌ Pool creation failed: ${errorMessage}`);
      setIsCreating(false);
    }
  };

  return (
    <div className="create-pool-container">
      <h3 className="feature-title">🌊 Create Liquidity Pool</h3>
      <p className="feature-description">
        Create a new liquidity pool between two assets and receive an LP token
      </p>
      
      {/* Helpful Suggestion */}
      <div className="suggestion-box">
        <h4>💡 Quick Test Suggestion</h4>
        <p>
          To test pool creation, try creating a <strong>WND ↔ Asset 1984 (USDT)</strong> pool, 
          as this is a known working combination on Westend Asset Hub.
        </p>
        <p>
          <strong>Tip:</strong> Use the "Check Assets" component above to verify custom assets exist before creating pools.
        </p>
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 API Connected' : '🔴 API Disconnected'}
        </div>
        {!isConnected && (
          <div className="warning">
            ⚠️ Please wait for API connection to enable pool creation...
          </div>
        )}
      </div>

      {/* Form */}
      <div className="pool-form">
        {/* Asset 1 Configuration */}
        <div className="form-group">
          <label htmlFor="asset1Type">Asset 1 Type:</label>
          <select
            id="asset1Type"
            value={asset1Type}
            onChange={(e) => setAsset1Type(e.target.value)}
            className="form-input"
            disabled={isCreating || !isConnected}
          >
            <option value="native">Native Token (WND)</option>
            <option value="asset">Custom Asset</option>
          </select>
        </div>

        {asset1Type === "asset" && (
          <div className="form-group">
            <label htmlFor="asset1Id">Asset 1 ID:</label>
            <input
              id="asset1Id"
              type="number"
              value={asset1Id}
              onChange={(e) => setAsset1Id(e.target.value)}
              placeholder="Enter asset ID (e.g., 1000)"
              className="form-input"
              disabled={isCreating || !isConnected}
              min="0"
            />
            <small className="form-help">
              The ID of the first asset in the pool
            </small>
          </div>
        )}

        {/* Asset 2 Configuration */}
        <div className="form-group">
          <label htmlFor="asset2Type">Asset 2 Type:</label>
          <select
            id="asset2Type"
            value={asset2Type}
            onChange={(e) => setAsset2Type(e.target.value)}
            className="form-input"
            disabled={isCreating || !isConnected}
          >
            <option value="native">Native Token (WND)</option>
            <option value="asset">Custom Asset</option>
          </select>
        </div>

        {asset2Type === "asset" && (
          <div className="form-group">
            <label htmlFor="asset2Id">Asset 2 ID:</label>
            <input
              id="asset2Id"
              type="number"
              value={asset2Id}
              onChange={(e) => setAsset2Id(e.target.value)}
              placeholder="Enter asset ID (e.g., 2000)"
              className="form-input"
              disabled={isCreating || !isConnected}
              min="0"
            />
            <small className="form-help">
              The ID of the second asset in the pool
            </small>
          </div>
        )}

        <div className="form-group">
          <label>Pool Creator:</label>
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
            This account will create the liquidity pool
          </small>
        </div>

        <button
          onClick={createPool}
          disabled={isCreating || !isConnected || !selectedAccount}
          className="create-button"
        >
          {isCreating ? "🔄 Creating Pool..." : "🌊 Create Pool"}
        </button>
      </div>

      {/* LP Token Display */}
      {lpTokenId && (
        <div className="lp-token-info">
          <h4>🪙 LP Token Created</h4>
          <div className="token-id">
            <strong>LP Token ID: {lpTokenId}</strong>
          </div>
          <small>This LP token represents your share in the liquidity pool</small>
        </div>
      )}

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
        <h4>💡 How Pool Creation Works:</h4>
        <ul>
          <li>Choose two different assets to create a trading pair</li>
          <li>The pool starts empty - you'll need to add liquidity separately</li>
          <li>A new LP (Liquidity Provider) token is created to represent pool shares</li>
          <li>The LP token ID is returned and can be used for managing liquidity</li>
          <li>Pool creation requires network fees to be paid</li>
        </ul>
        
        <h4>🌐 Westend Asset Hub - Known Working Examples:</h4>
        <div className="working-examples">
          <div className="example">
            <strong>WND ↔ USDT:</strong> Native WND paired with Asset 1984 (USDT)
          </div>
          <div className="example">
            <strong>Custom Asset Pairs:</strong> Any two different existing assets can be paired
          </div>
        </div>
        
        <h4>⚠️ Common Issues:</h4>
        <ul>
          <li><strong>InvalidAssetPair:</strong> Usually means one of the assets doesn't exist or the format is incorrect</li>
          <li><strong>Asset not found:</strong> Make sure custom assets exist on-chain before creating pools</li>
          <li><strong>Insufficient permissions:</strong> Some assets may require special permissions</li>
        </ul>
      </div>
    </div>
  );
}
