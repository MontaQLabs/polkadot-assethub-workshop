import { useState } from "react";
import { usePolkadotApi } from "../../contexts/PolkadotApiContext.jsx";

export default function QueryPool({ selectedAccount }) {
  const { api, isConnected, ensureApi } = usePolkadotApi();
  
  // Form state
  const [asset1Type, setAsset1Type] = useState("native"); // "native" or "asset"
  const [asset1Id, setAsset1Id] = useState("");
  const [asset2Type, setAsset2Type] = useState("asset"); // "native" or "asset"
  const [asset2Id, setAsset2Id] = useState("");
  
  // Operation state
  const [isQuerying, setIsQuerying] = useState(false);
  const [poolInfo, setPoolInfo] = useState(null);
  const [error, setError] = useState("");
  const [lpProviders, setLpProviders] = useState([]);
  const [isQueryingProviders, setIsQueryingProviders] = useState(false);
  const [checkAddress, setCheckAddress] = useState("");

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

  const queryPool = async () => {
    // Reset previous results
    setPoolInfo(null);
    setError("");
    setLpProviders([]); // Clear previous LP providers data
    
    // Validation
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

    // Prevent same asset pool query
    if (asset1Type === asset2Type && asset1Type === "asset" && asset1Id === asset2Id) {
      setError("❌ Cannot query pool with the same asset twice");
      return;
    }

    // Additional validation for native-native pairs
    if (asset1Type === "native" && asset2Type === "native") {
      setError("❌ Cannot query pool with native token (WND) paired with itself");
      return;
    }

    setIsQuerying(true);

    try {
      // Ensure API is ready
      const apiInstance = await ensureApi();
      
      // Create asset location objects
      const asset1Location = createAssetLocation(asset1Type, asset1Id);
      const asset2Location = createAssetLocation(asset2Type, asset2Id);

      // Debug logging
      console.log("🔍 Asset 1 Location:", JSON.stringify(asset1Location, null, 2));
      console.log("🔍 Asset 2 Location:", JSON.stringify(asset2Location, null, 2));
      
      // Query the pool information
      const poolResult = await apiInstance.query.assetConversion.pools([asset1Location, asset2Location]);
      
      if (poolResult.isNone) {
        setError("❌ No liquidity pool found for this asset pair");
        return;
      }

      const poolData = poolResult.unwrap();
      
      // Get additional information about the assets if they are custom assets
      let asset1Info = null;
      let asset2Info = null;
      
      if (asset1Type === "asset") {
        try {
          const assetDetails = await apiInstance.query.assets.asset(parseInt(asset1Id));
          const assetMetadata = await apiInstance.query.assets.metadata(parseInt(asset1Id));
          if (!assetDetails.isNone) {
            asset1Info = {
              symbol: assetMetadata.isEmpty ? `ASSET_${asset1Id}` : assetMetadata.symbol.toUtf8(),
              name: assetMetadata.isEmpty ? `Asset ${asset1Id}` : assetMetadata.name.toUtf8(),
              decimals: assetMetadata.isEmpty ? 0 : assetMetadata.decimals.toNumber()
            };
          }
        } catch (e) {
          console.warn("Could not fetch Asset 1 details:", e);
        }
      }
      
      if (asset2Type === "asset") {
        try {
          const assetDetails = await apiInstance.query.assets.asset(parseInt(asset2Id));
          const assetMetadata = await apiInstance.query.assets.metadata(parseInt(asset2Id));
          if (!assetDetails.isNone) {
            asset2Info = {
              symbol: assetMetadata.isEmpty ? `ASSET_${asset2Id}` : assetMetadata.symbol.toUtf8(),
              name: assetMetadata.isEmpty ? `Asset ${asset2Id}` : assetMetadata.name.toUtf8(),
              decimals: assetMetadata.isEmpty ? 0 : assetMetadata.decimals.toNumber()
            };
          }
        } catch (e) {
          console.warn("Could not fetch Asset 2 details:", e);
        }
      }

      // Get LP token information
      let lpTokenInfo = null;
      try {
        const lpTokenResult = await apiInstance.call.assetConversionApi.getLpToken(asset1Location, asset2Location);
        if (lpTokenResult.isOk) {
          const lpTokenId = lpTokenResult.asOk;
          
          // Get LP token metadata and details
          const lpTokenDetails = await apiInstance.query.poolAssets.asset(lpTokenId);
          const lpTokenMetadata = await apiInstance.query.poolAssets.metadata(lpTokenId);
          
          if (!lpTokenDetails.isNone) {
            const details = lpTokenDetails.unwrap();
            lpTokenInfo = {
              id: lpTokenId.toString(),
              supply: details.supply.toString(),
              accounts: details.accounts.toNumber(),
              admin: details.admin.toString(),
              symbol: lpTokenMetadata.isEmpty ? `LP-${lpTokenId}` : lpTokenMetadata.symbol.toUtf8(),
              name: lpTokenMetadata.isEmpty ? `LP Token ${lpTokenId}` : lpTokenMetadata.name.toUtf8(),
              decimals: lpTokenMetadata.isEmpty ? 12 : lpTokenMetadata.decimals.toNumber()
            };
          }
        }
      } catch (e) {
        console.warn("Could not fetch LP token details:", e);
      }

      // Format the pool information
      const formattedPoolInfo = {
        lpToken: poolData.lpToken.toJSON(),
        lpTokenInfo,
        asset1: {
          type: asset1Type,
          id: asset1Type === "asset" ? asset1Id : "native",
          displayName: asset1Type === "native" ? "WND (Native)" : asset1Info ? `${asset1Info.symbol} (${asset1Id})` : `Asset ${asset1Id}`,
          info: asset1Info
        },
        asset2: {
          type: asset2Type,
          id: asset2Type === "asset" ? asset2Id : "native",
          displayName: asset2Type === "native" ? "WND (Native)" : asset2Info ? `${asset2Info.symbol} (${asset2Id})` : `Asset ${asset2Id}`,
          info: asset2Info
        },
        rawData: poolData.toJSON()
      };

      setPoolInfo(formattedPoolInfo);
      
    } catch (error) {
      console.error("Pool query error:", error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      if (error.message.includes("AssetNotFound")) {
        errorMessage = "One or both assets not found";
      } else if (error.message.includes("BadOrigin")) {
        errorMessage = "Unable to query pool information";
      }
      
      setError(`❌ Pool query failed: ${errorMessage}`);
    } finally {
      setIsQuerying(false);
    }
  };

  // Helper function to extract LP token ID from the LP token data
  const getLpTokenId = (lpToken) => {
    if (!lpToken) return "Unknown";
    
    if (typeof lpToken === 'number') return lpToken;
    
    if (lpToken.interior && lpToken.interior.x2) {
      const generalIndex = lpToken.interior.x2.find(item => item.generalIndex !== undefined);
      if (generalIndex) {
        return generalIndex.generalIndex;
      }
    }
    
    return "Unknown";
  };

  // Function to check LP token balance for a specific address
  const checkLpBalance = async () => {
    if (!poolInfo || !poolInfo.lpTokenInfo) {
      setError("❌ Please query a pool first to check LP balances");
      return;
    }

    if (!checkAddress.trim()) {
      setError("❌ Please enter an address to check");
      return;
    }

    if (!isConnected || !api) {
      setError("❌ API not connected");
      return;
    }

    setIsQueryingProviders(true);
    setError("");

    try {
      const apiInstance = await ensureApi();
      const lpTokenId = poolInfo.lpTokenInfo.id;
      
      // Query LP token balance for the specified address
      const balanceResult = await apiInstance.query.poolAssets.account(lpTokenId, checkAddress.trim());
      
      if (balanceResult.isNone) {
        // Add to providers list with 0 balance
        const newProvider = {
          address: checkAddress.trim(),
          balance: "0",
          formattedBalance: "0.000000000000",
          percentage: "0.00%"
        };
        
        setLpProviders(prev => {
          const existing = prev.find(p => p.address === newProvider.address);
          if (existing) {
            return prev.map(p => p.address === newProvider.address ? newProvider : p);
          }
          return [...prev, newProvider];
        });
      } else {
        const accountData = balanceResult.unwrap();
        const balance = accountData.balance.toString();
        const totalSupply = poolInfo.lpTokenInfo.supply;
        const decimals = poolInfo.lpTokenInfo.decimals;
        
        // Calculate percentage of total supply
        const balanceNumber = parseFloat(balance);
        const totalSupplyNumber = parseFloat(totalSupply);
        const percentage = totalSupplyNumber > 0 ? ((balanceNumber / totalSupplyNumber) * 100).toFixed(2) : "0.00";
        
        // Format balance with decimals
        const formattedBalance = (balanceNumber / Math.pow(10, decimals)).toFixed(decimals);
        
        const newProvider = {
          address: checkAddress.trim(),
          balance,
          formattedBalance,
          percentage: `${percentage}%`
        };
        
        setLpProviders(prev => {
          const existing = prev.find(p => p.address === newProvider.address);
          if (existing) {
            return prev.map(p => p.address === newProvider.address ? newProvider : p);
          }
          return [...prev, newProvider];
        });
      }
      
      setCheckAddress(""); // Clear input after successful check
    } catch (error) {
      console.error("LP balance check error:", error);
      setError(`❌ Failed to check LP balance: ${error.message}`);
    } finally {
      setIsQueryingProviders(false);
    }
  };

  // Function to add current connected account to check list
  const checkConnectedAccount = () => {
    if (selectedAccount) {
      setCheckAddress(selectedAccount.account.address);
    }
  };

  return (
    <div className="query-pool-container">
      <h3 className="feature-title">🔍 Query Liquidity Pool</h3>
      <p className="feature-description">
        Search and display information about existing liquidity pools
      </p>
      
      {/* Helpful Suggestion */}
      <div className="suggestion-box">
        <h4>💡 Quick Test Suggestion</h4>
        <p>
          Try querying the <strong>WND ↔ Asset 1984 (USDT)</strong> pool 
          to see an example of pool information display.
        </p>
      </div>

      {/* Connection Status */}
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 API Connected' : '🔴 API Disconnected'}
        </div>
        {!isConnected && (
          <div className="warning">
            ⚠️ Please wait for API connection to enable pool queries...
          </div>
        )}
      </div>

      {/* Form */}
      <div className="pool-form">
        {/* Asset 1 Configuration */}
        <div className="form-group">
          <label htmlFor="query-asset1Type">Asset 1 Type:</label>
          <select
            id="query-asset1Type"
            value={asset1Type}
            onChange={(e) => setAsset1Type(e.target.value)}
            className="form-input"
            disabled={isQuerying || !isConnected}
          >
            <option value="native">Native Token (WND)</option>
            <option value="asset">Custom Asset</option>
          </select>
        </div>

        {asset1Type === "asset" && (
          <div className="form-group">
            <label htmlFor="query-asset1Id">Asset 1 ID:</label>
            <input
              id="query-asset1Id"
              type="number"
              value={asset1Id}
              onChange={(e) => setAsset1Id(e.target.value)}
              placeholder="Enter asset ID (e.g., 1000)"
              className="form-input"
              disabled={isQuerying || !isConnected}
              min="0"
            />
            <small className="form-help">
              The ID of the first asset in the pool
            </small>
          </div>
        )}

        {/* Asset 2 Configuration */}
        <div className="form-group">
          <label htmlFor="query-asset2Type">Asset 2 Type:</label>
          <select
            id="query-asset2Type"
            value={asset2Type}
            onChange={(e) => setAsset2Type(e.target.value)}
            className="form-input"
            disabled={isQuerying || !isConnected}
          >
            <option value="native">Native Token (WND)</option>
            <option value="asset">Custom Asset</option>
          </select>
        </div>

        {asset2Type === "asset" && (
          <div className="form-group">
            <label htmlFor="query-asset2Id">Asset 2 ID:</label>
            <input
              id="query-asset2Id"
              type="number"
              value={asset2Id}
              onChange={(e) => setAsset2Id(e.target.value)}
              placeholder="Enter asset ID (e.g., 2000)"
              className="form-input"
              disabled={isQuerying || !isConnected}
              min="0"
            />
            <small className="form-help">
              The ID of the second asset in the pool
            </small>
          </div>
        )}

        <button
          onClick={queryPool}
          disabled={isQuerying || !isConnected}
          className="create-button"
        >
          {isQuerying ? "🔄 Querying Pool..." : "🔍 Query Pool"}
        </button>
      </div>

      {/* Pool Information Display */}
      {poolInfo && (
        <div className="pool-info-display">
          <div className="pool-info-header">
            <h4>🌊 Liquidity Pool Information</h4>
            <div className="pool-status-badge">
              <span className="status-active">● Active Pool</span>
            </div>
          </div>
          
          {/* Asset Pair Section */}
          <div className="pool-section asset-pair-section">
            <h5>💱 Trading Pair</h5>
            <div className="asset-pair-display">
              <div className="asset-card">
                <div className="asset-icon">🪙</div>
                <div className="asset-details">
                  <div className="asset-name">{poolInfo.asset1.displayName}</div>
                  {poolInfo.asset1.info && (
                    <div className="asset-metadata">
                      <div className="metadata-item">
                        <span className="label">Name:</span>
                        <span className="value">{poolInfo.asset1.info.name}</span>
                      </div>
                      <div className="metadata-item">
                        <span className="label">Decimals:</span>
                        <span className="value">{poolInfo.asset1.info.decimals}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pair-connector">
                <div className="connector-line"></div>
                <div className="connector-icon">⚡</div>
                <div className="connector-line"></div>
              </div>
              
              <div className="asset-card">
                <div className="asset-icon">🪙</div>
                <div className="asset-details">
                  <div className="asset-name">{poolInfo.asset2.displayName}</div>
                  {poolInfo.asset2.info && (
                    <div className="asset-metadata">
                      <div className="metadata-item">
                        <span className="label">Name:</span>
                        <span className="value">{poolInfo.asset2.info.name}</span>
                      </div>
                      <div className="metadata-item">
                        <span className="label">Decimals:</span>
                        <span className="value">{poolInfo.asset2.info.decimals}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* LP Token Section */}
          {poolInfo.lpTokenInfo && (
            <div className="pool-section lp-token-section">
              <h5>🪙 LP Token Details</h5>
              <div className="lp-token-grid">
                <div className="lp-stat-card">
                  <div className="stat-icon">🆔</div>
                  <div className="stat-content">
                    <div className="stat-label">Token ID</div>
                    <div className="stat-value">{poolInfo.lpTokenInfo.id}</div>
                  </div>
                </div>
                
                <div className="lp-stat-card">
                  <div className="stat-icon">🏷️</div>
                  <div className="stat-content">
                    <div className="stat-label">Symbol</div>
                    <div className="stat-value">{poolInfo.lpTokenInfo.symbol}</div>
                  </div>
                </div>
                
                <div className="lp-stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <div className="stat-label">Total Supply</div>
                    <div className="stat-value">{poolInfo.lpTokenInfo.supply}</div>
                  </div>
                </div>
                
                <div className="lp-stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <div className="stat-label">Holders</div>
                    <div className="stat-value">{poolInfo.lpTokenInfo.accounts}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Liquidity Providers Section */}
          <div className="pool-section providers-section">
            <h5>👥 Liquidity Providers</h5>
            <p className="section-description">
              Check LP token balances for specific addresses to see who has provided liquidity to this pool.
            </p>
            
            <div className="provider-check-form">
              <div className="form-group">
                <label htmlFor="checkAddress">Address to Check:</label>
                <div className="address-input-group">
                  <input
                    id="checkAddress"
                    type="text"
                    value={checkAddress}
                    onChange={(e) => setCheckAddress(e.target.value)}
                    placeholder="Enter address (e.g., 5GNJq...)"
                    className="form-input"
                    disabled={isQueryingProviders || !isConnected}
                  />
                  <button
                    onClick={checkConnectedAccount}
                    disabled={!selectedAccount || isQueryingProviders}
                    className="quick-fill-button"
                    title="Use connected account address"
                  >
                    👤
                  </button>
                </div>
                <small className="form-help">
                  Enter any address to check their LP token balance in this pool
                </small>
              </div>

              <button
                onClick={checkLpBalance}
                disabled={isQueryingProviders || !isConnected}
                className="create-button"
              >
                {isQueryingProviders ? "🔄 Checking..." : "🔍 Check LP Balance"}
              </button>
            </div>

            {/* LP Providers List */}
            {lpProviders.length > 0 && (
              <div className="providers-list">
                <h6>💰 LP Token Holders</h6>
                <div className="providers-grid">
                  {lpProviders.map((provider, index) => (
                    <div key={provider.address} className="provider-card">
                      <div className="provider-header">
                        <div className="provider-rank">#{index + 1}</div>
                        <div className="provider-address">
                          <strong>{provider.address.slice(0, 8)}...{provider.address.slice(-8)}</strong>
                        </div>
                      </div>
                      <div className="provider-stats">
                        <div className="provider-stat">
                          <span className="stat-label">LP Balance:</span>
                          <span className="stat-value">{provider.formattedBalance}</span>
                        </div>
                        <div className="provider-stat">
                          <span className="stat-label">Pool Share:</span>
                          <span className="stat-value pool-share">{provider.percentage}</span>
                        </div>
                        <div className="provider-stat">
                          <span className="stat-label">Raw Balance:</span>
                          <span className="stat-value raw-balance">{provider.balance}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="providers-note">
                  <p>
                    <strong>Note:</strong> This shows LP token balances for addresses you've checked. 
                    To get a complete list of all liquidity providers, you would need to scan the 
                    entire chain or use an indexer service.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Raw Data Section (Collapsible) */}
          <div className="pool-section raw-data-section">
            <details>
              <summary>📊 Raw Pool Data (Advanced)</summary>
              <div className="raw-data">
                <div className="raw-data-grid">
                  <div className="raw-data-item">
                    <h6>Pool Info:</h6>
                    <pre>{JSON.stringify(poolInfo.rawData, null, 2)}</pre>
                  </div>
                  <div className="raw-data-item">
                    <h6>LP Token Location:</h6>
                    <pre>{JSON.stringify(poolInfo.lpToken, null, 2)}</pre>
                  </div>
                </div>
              </div>
            </details>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Help Information */}
      <div className="help-section">
        <h4>💡 How Pool Querying Works:</h4>
        <ul>
          <li>Enter the two assets that form the trading pair</li>
          <li>The system will search for an existing liquidity pool</li>
          <li>If found, detailed pool information will be displayed</li>
          <li>The LP token information shows how pool shares are represented</li>
          <li>Asset metadata is automatically fetched when available</li>
        </ul>
        
        <h4>🌐 Westend Asset Hub - Known Working Pools:</h4>
        <div className="working-examples">
          <div className="example">
            <strong>WND ↔ USDT:</strong> Native WND paired with Asset 1984 (USDT)
          </div>
        </div>
        
        <h4>⚠️ Common Issues:</h4>
        <ul>
          <li><strong>Pool not found:</strong> The requested asset pair doesn't have a liquidity pool</li>
          <li><strong>Asset not found:</strong> One of the specified assets doesn't exist on-chain</li>
          <li><strong>Invalid asset pair:</strong> Check that the asset IDs are correct and different</li>
        </ul>
      </div>
    </div>
  );
}
