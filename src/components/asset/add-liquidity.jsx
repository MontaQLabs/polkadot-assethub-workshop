import { useState } from "react";
import { usePolkadotApi } from "../../contexts/PolkadotApiContext.jsx";

export default function AddLiquidity({ selectedAccount }) {
  const { api, isConnected, ensureApi } = usePolkadotApi();
  
  // Form state
  const [asset1Type, setAsset1Type] = useState("native"); // "native" or "asset"
  const [asset1Id, setAsset1Id] = useState("");
  const [asset2Type, setAsset2Type] = useState("asset"); // "native" or "asset"
  const [asset2Id, setAsset2Id] = useState("");
  const [amount1Desired, setAmount1Desired] = useState("");
  const [amount2Desired, setAmount2Desired] = useState("");
  const [amount1Min, setAmount1Min] = useState("");
  const [amount2Min, setAmount2Min] = useState("");
  const [mintToAddress, setMintToAddress] = useState("");
  
  // Operation state
  const [isAdding, setIsAdding] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  // Helper function to create asset location object
  const createAssetLocation = (type, assetId) => {
    if (type === "native") {
      // Native token (WND) location for Westend Asset Hub
      return {
        parents: 1,
        interior: "Here"
      };
    } else {
      // Asset location for custom assets on Westend Asset Hub
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

  const addLiquidity = async () => {
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
    
    // Validate asset inputs
    if (asset1Type === "asset" && (!asset1Id.trim() || isNaN(parseInt(asset1Id)))) {
      setError("❌ Please enter a valid Asset 1 ID");
      return;
    }
    
    if (asset2Type === "asset" && (!asset2Id.trim() || isNaN(parseInt(asset2Id)))) {
      setError("❌ Please enter a valid Asset 2 ID");
      return;
    }

    // Prevent same asset liquidity addition
    if (asset1Type === asset2Type && asset1Type === "asset" && asset1Id === asset2Id) {
      setError("❌ Cannot add liquidity with the same asset twice");
      return;
    }

    if (asset1Type === "native" && asset2Type === "native") {
      setError("❌ Cannot add liquidity with native token (WND) paired with itself");
      return;
    }

    // Validate amount inputs
    const parsedAmount1Desired = parseInt(amount1Desired.trim());
    if (!amount1Desired.trim() || isNaN(parsedAmount1Desired) || parsedAmount1Desired <= 0) {
      setError("❌ Please enter a valid positive desired amount for Asset 1");
      return;
    }

    const parsedAmount2Desired = parseInt(amount2Desired.trim());
    if (!amount2Desired.trim() || isNaN(parsedAmount2Desired) || parsedAmount2Desired <= 0) {
      setError("❌ Please enter a valid positive desired amount for Asset 2");
      return;
    }

    const parsedAmount1Min = parseInt(amount1Min.trim());
    if (!amount1Min.trim() || isNaN(parsedAmount1Min) || parsedAmount1Min <= 0) {
      setError("❌ Please enter a valid positive minimum amount for Asset 1");
      return;
    }

    const parsedAmount2Min = parseInt(amount2Min.trim());
    if (!amount2Min.trim() || isNaN(parsedAmount2Min) || parsedAmount2Min <= 0) {
      setError("❌ Please enter a valid positive minimum amount for Asset 2");
      return;
    }

    // Validate minimum amounts are not greater than desired amounts
    if (parsedAmount1Min > parsedAmount1Desired) {
      setError("❌ Minimum amount for Asset 1 cannot be greater than desired amount");
      return;
    }

    if (parsedAmount2Min > parsedAmount2Desired) {
      setError("❌ Minimum amount for Asset 2 cannot be greater than desired amount");
      return;
    }

    // Validate mint-to address
    if (!mintToAddress.trim()) {
      setError("❌ Please enter a mint-to address");
      return;
    }

    if (mintToAddress.length < 47 || mintToAddress.length > 49) {
      setError("❌ Please enter a valid Substrate address for mint-to");
      return;
    }

    setIsAdding(true);
    setResult("🔄 Adding liquidity to pool...");

    try {
      // Ensure API is ready
      const apiInstance = await ensureApi();
      
      // Create asset location objects
      const asset1Location = createAssetLocation(asset1Type, asset1Id);
      const asset2Location = createAssetLocation(asset2Type, asset2Id);

      // Debug logging
      console.log("🔍 Asset 1 Location:", JSON.stringify(asset1Location, null, 2));
      console.log("🔍 Asset 2 Location:", JSON.stringify(asset2Location, null, 2));
      
      // Helpful message about what we're trying to do
      const asset1Desc = asset1Type === "native" ? "WND (Native)" : `Asset ${asset1Id}`;
      const asset2Desc = asset2Type === "native" ? "WND (Native)" : `Asset ${asset2Id}`;
      setResult(`🔄 Adding liquidity to ${asset1Desc} ↔ ${asset2Desc} pool...`);

      // Create the add liquidity transaction
      // addLiquidity(asset1, asset2, amount1_desired, amount2_desired, amount1_min, amount2_min, mint_to)
      const transactionExtrinsic = apiInstance.tx.assetConversion.addLiquidity(
        asset1Location,
        asset2Location,
        parsedAmount1Desired,
        parsedAmount2Desired,
        parsedAmount1Min,
        parsedAmount2Min,
        mintToAddress.trim()
      );

      // Sign and send the transaction with event handling
      const unsub = await transactionExtrinsic.signAndSend(
        selectedAccount.account.address,
        { signer: selectedAccount.signer },
        ({ status, events = [] }) => {
          if (status.isInBlock || status.isFinalized) {
            // Process events to find LiquidityAdded event
            let liquidityAdded = false;
            events.forEach(({ event }) => {
              if (apiInstance.events.assetConversion.LiquidityAdded.is(event)) {
                const eventData = event.data;
                console.log("Liquidity added event:", eventData.toString());
                liquidityAdded = true;
                
                setResult(`✅ Liquidity added successfully!
                  Assets: ${asset1Desc} ↔ ${asset2Desc}
                  LP tokens minted to: ${mintToAddress}
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
              
              setError(`❌ Liquidity addition failed: ${errorMessage}`);
            } else if (!liquidityAdded && !errorEvent) {
              setResult(`✅ Transaction completed!
                Assets: ${asset1Desc} ↔ ${asset2Desc}
                Block: ${status.isInBlock ? 'In Block' : 'Finalized'}`);
            }

            unsub();
            setIsAdding(false);
          }
        }
      );
      
    } catch (error) {
      console.error("Add liquidity error:", error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      if (error.message.includes("PoolNotFound")) {
        errorMessage = "Pool does not exist for this asset pair. Create the pool first.";
      } else if (error.message.includes("InsufficientAssetBalance")) {
        errorMessage = "Insufficient balance for one or both assets";
      } else if (error.message.includes("AmountOneTooLow")) {
        errorMessage = "Amount 1 is below the minimum required";
      } else if (error.message.includes("AmountTwoTooLow")) {
        errorMessage = "Amount 2 is below the minimum required";
      } else if (error.message.includes("BadOrigin")) {
        errorMessage = "Account does not have permission to add liquidity";
      } else if (error.message.includes("AssetNotFound")) {
        errorMessage = "One or both assets not found";
      } else if (error.message.includes("BalanceLow")) {
        errorMessage = "Insufficient balance to pay transaction fees";
      } else if (error.message.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user";
      }
      
      setError(`❌ Add liquidity failed: ${errorMessage}`);
      setIsAdding(false);
    }
  };

  const fillCurrentAccount = () => {
    if (selectedAccount) {
      setMintToAddress(selectedAccount.account.address);
    }
  };

  const fillMinAmounts = () => {
    // Set minimum amounts to 80% of desired amounts as a reasonable default
    if (amount1Desired) {
      const min1 = Math.floor(parseInt(amount1Desired) * 0.8);
      setAmount1Min(min1.toString());
    }
    if (amount2Desired) {
      const min2 = Math.floor(parseInt(amount2Desired) * 0.8);
      setAmount2Min(min2.toString());
    }
  };

  return (
    <div className="add-liquidity-container">
      <h3 className="feature-title">➕ Add Liquidity to Pool</h3>
      <p className="feature-description">
        Provide liquidity to an existing pool and receive LP tokens representing your share
      </p>
      
      {/* Helpful Suggestion */}
      <div className="suggestion-box">
        <h4>💡 Quick Test Suggestion</h4>
        <p>
          To test liquidity addition, make sure you have a pool created first (use Create Pool component above). 
          Try adding liquidity to the <strong>WND ↔ Asset 1984 (USDT)</strong> pool.
        </p>
        <p>
          <strong>Important:</strong> You need sufficient balance in both assets to add liquidity.
        </p>
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 API Connected' : '🔴 API Disconnected'}
        </div>
        {!isConnected && (
          <div className="warning">
            ⚠️ Please wait for API connection to enable liquidity addition...
          </div>
        )}
      </div>

      {/* Form */}
      <div className="liquidity-form">
        {/* Asset 1 Configuration */}
        <div className="asset-pair-section">
          <h4>🔹 Asset Pair Configuration</h4>
          
          <div className="form-group">
            <label htmlFor="asset1Type">Asset 1 Type:</label>
            <select
              id="asset1Type"
              value={asset1Type}
              onChange={(e) => setAsset1Type(e.target.value)}
              className="form-input"
              disabled={isAdding || !isConnected}
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
                placeholder="Enter asset ID (e.g., 1984)"
                className="form-input"
                disabled={isAdding || !isConnected}
                min="0"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="asset2Type">Asset 2 Type:</label>
            <select
              id="asset2Type"
              value={asset2Type}
              onChange={(e) => setAsset2Type(e.target.value)}
              className="form-input"
              disabled={isAdding || !isConnected}
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
                disabled={isAdding || !isConnected}
                min="0"
              />
            </div>
          )}
        </div>

        {/* Liquidity Amounts Section */}
        <div className="amounts-section">
          <h4>💰 Liquidity Amounts</h4>
          
          <div className="amounts-grid">
            <div className="form-group">
              <label htmlFor="amount1Desired">Asset 1 Desired Amount:</label>
              <input
                id="amount1Desired"
                type="number"
                value={amount1Desired}
                onChange={(e) => setAmount1Desired(e.target.value)}
                placeholder="Enter desired amount"
                className="form-input"
                disabled={isAdding || !isConnected}
                min="1"
              />
              <small className="form-help">
                Optimal amount you want to provide for Asset 1
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="amount2Desired">Asset 2 Desired Amount:</label>
              <input
                id="amount2Desired"
                type="number"
                value={amount2Desired}
                onChange={(e) => setAmount2Desired(e.target.value)}
                placeholder="Enter desired amount"
                className="form-input"
                disabled={isAdding || !isConnected}
                min="1"
              />
              <small className="form-help">
                Optimal amount you want to provide for Asset 2
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="amount1Min">Asset 1 Minimum Amount:</label>
              <input
                id="amount1Min"
                type="number"
                value={amount1Min}
                onChange={(e) => setAmount1Min(e.target.value)}
                placeholder="Enter minimum amount"
                className="form-input"
                disabled={isAdding || !isConnected}
                min="1"
              />
              <small className="form-help">
                Minimum amount you're willing to provide for Asset 1
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="amount2Min">Asset 2 Minimum Amount:</label>
              <input
                id="amount2Min"
                type="number"
                value={amount2Min}
                onChange={(e) => setAmount2Min(e.target.value)}
                placeholder="Enter minimum amount"
                className="form-input"
                disabled={isAdding || !isConnected}
                min="1"
              />
              <small className="form-help">
                Minimum amount you're willing to provide for Asset 2
              </small>
            </div>
          </div>

          <button
            type="button"
            onClick={fillMinAmounts}
            className="helper-button"
            disabled={isAdding || !amount1Desired || !amount2Desired}
          >
            💡 Set Min = 80% of Desired
          </button>
        </div>

        {/* Mint To Section */}
        <div className="mint-to-section">
          <h4>🎯 LP Token Destination</h4>
          
          <div className="form-group">
            <label htmlFor="mintToAddress">Mint LP Tokens To:</label>
            <div className="address-input-container">
              <input
                id="mintToAddress"
                type="text"
                value={mintToAddress}
                onChange={(e) => setMintToAddress(e.target.value)}
                placeholder="Enter address to receive LP tokens"
                className="form-input address-input"
                disabled={isAdding || !isConnected}
              />
              <button
                type="button"
                onClick={fillCurrentAccount}
                className="fill-address-btn"
                disabled={isAdding || !selectedAccount}
                title="Use current account address"
              >
                Use Mine
              </button>
            </div>
            <small className="form-help">
              Address that will receive the LP tokens representing your pool share
            </small>
          </div>
        </div>

        {/* Selected Account Info */}
        <div className="form-group">
          <label>Liquidity Provider:</label>
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
            This account will provide the liquidity and pay transaction fees
          </small>
        </div>

        <button
          onClick={addLiquidity}
          disabled={isAdding || !isConnected || !selectedAccount}
          className="create-button"
        >
          {isAdding ? "🔄 Adding Liquidity..." : "➕ Add Liquidity"}
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
        <h4>💡 How Adding Liquidity Works:</h4>
        <ul>
          <li><strong>Pool must exist:</strong> Use the Create Pool component first if the pool doesn't exist</li>
          <li><strong>Asset balances:</strong> You need sufficient balance in both assets</li>
          <li><strong>Optimal ratios:</strong> The system calculates optimal amounts based on current pool ratios</li>
          <li><strong>Minimum protection:</strong> Set minimum amounts to protect against excessive slippage</li>
          <li><strong>LP tokens:</strong> You receive tokens representing your share of the pool</li>
          <li><strong>Fees earned:</strong> As a liquidity provider, you earn a share of trading fees</li>
        </ul>
        
        <h4>⚙️ Parameter Explanation:</h4>
        <ul>
          <li><strong>Desired amounts:</strong> Your preferred contribution amounts</li>
          <li><strong>Minimum amounts:</strong> Lowest amounts you'll accept (usually 80-95% of desired)</li>
          <li><strong>Mint-to address:</strong> Where LP tokens will be sent (can be different from provider)</li>
        </ul>
        
        <h4>⚠️ Common Issues:</h4>
        <ul>
          <li><strong>Pool not found:</strong> Create the pool first using the Create Pool component</li>
          <li><strong>Insufficient balance:</strong> Ensure you have enough of both assets</li>
          <li><strong>Amount too low:</strong> Increase minimum amounts or desired amounts</li>
          <li><strong>Slippage protection:</strong> Adjust minimum amounts if pool ratios changed</li>
        </ul>
      </div>
    </div>
  );
}
