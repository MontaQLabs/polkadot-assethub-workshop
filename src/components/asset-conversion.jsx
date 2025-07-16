import React, { useState, useEffect } from "react";
import { usePolkadotApi } from "../contexts/PolkadotApiContext.jsx";

function AssetConversionDisplay({ selectedAccount }) {
  const { api, isConnected, ensureApi } = usePolkadotApi();
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionResult, setActionResult] = useState("");
  const [events, setEvents] = useState([]);
  const [errors, setErrors] = useState([]);
  
  // Asset discovery state
  const [userAssets, setUserAssets] = useState([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [assetIdInput, setAssetIdInput] = useState("");
  
  // Pool and liquidity parameters
  const [poolParams, setPoolParams] = useState({
    asset1: {
      parents: 1,
      interior: "Here"
    },
    asset2: {
      parents: 0,
      interior: {
        X2: [
          { PalletInstance: 50 },
          { GeneralIndex: 1984 }
        ]
      }
    },
  });

  // Swap parameters
  const [swapParams, setSwapParams] = useState({
    amountIn: "1000000000", // 0.1 PAS
    amountOut: "1000000", // 1 USDT
    amountInMax: "2000000000", // Max 0.2 PAS
    amountOutMin: "500000", // Min 0.5 USDT
    keepAlive: false // Keep account alive after swap
  });

  // Asset location helpers - Now returns proper StagingXcmV4Location objects
  const getAssetLocation = (assetLocation) => {
    // Return the complete StagingXcmV4Location object
    return assetLocation;
  };

  const getSwapPath = () => {
    // Returns Vec<StagingXcmV4Location> for the swap path
    return [getAssetLocation(poolParams.asset1), getAssetLocation(poolParams.asset2)];
  };

  // Asset discovery functions for specific assets based on user input
  const discoverAsset = async () => {
    if (!assetIdInput.trim()) {
      setActionResult("❌ Please enter an asset ID to search for");
      return;
    }

    const assetId = parseInt(assetIdInput.trim());
    if (isNaN(assetId)) {
      setActionResult("❌ Please enter a valid numeric asset ID");
      return;
    }

    if (!isConnected || !api) {
      setActionResult("❌ API not connected. Please wait for connection...");
      return;
    }

    setIsDiscovering(true);
    setActionResult(`🔍 Searching for asset ${assetId}...`);

    try {
      // Get asset details from the Assets pallet
      const assetDetails = await api.query.assets.asset(assetId);
      
      if (!assetDetails || assetDetails.isNone) {
        setActionResult(`❌ Asset ${assetId} not found on chain`);
        return;
      }

      const details = assetDetails.unwrap();
      
      // Get asset metadata (symbol, name, decimals)
      const metadataResult = await api.query.assets.metadata(assetId);
      const metadata = metadataResult.isEmpty ? null : metadataResult;
      
      const symbol = metadata ? metadata.symbol.toUtf8() : `ASSET_${assetId}`;
      const name = metadata ? metadata.name.toUtf8() : `Asset ${assetId}`;
      const decimals = metadata ? metadata.decimals.toNumber() : 0;

      const assetInfo = {
        id: assetId,
        symbol,
        name,
        decimals,
        supply: details.supply.toString(),
        accounts: details.accounts.toNumber(),
        admin: details.admin.toString(),
        // Create proper XCM location for this asset
        location: {
          parents: 0,
          interior: {
            X2: [
              { PalletInstance: 50 }, // Assets pallet instance
              { GeneralIndex: assetId }
            ]
          }
        }
      };

      // Add to discovered assets (or replace if already exists)
      setUserAssets(prevAssets => {
        const existingIndex = prevAssets.findIndex(asset => asset.id === assetId);
        if (existingIndex >= 0) {
          const updatedAssets = [...prevAssets];
          updatedAssets[existingIndex] = assetInfo;
          return updatedAssets;
        } else {
          return [...prevAssets, assetInfo];
        }
      });

      setActionResult(`✅ Asset ${assetId} (${assetInfo.symbol}) retrieved successfully!`);
      setAssetIdInput(""); // Clear input after successful search
    } catch (error) {
      console.error("Asset discovery error:", error);
      setActionResult(`❌ Asset search failed: ${error.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  const useAssetInPool = (asset, assetSlot) => {
    const newPoolParams = { ...poolParams };
    if (assetSlot === 'asset1') {
      newPoolParams.asset1 = asset.location;
    } else if (assetSlot === 'asset2') {
      newPoolParams.asset2 = asset.location;
    }
    setPoolParams(newPoolParams);
    setActionResult(`✅ Using ${asset.symbol} (ID: ${asset.id}) as ${assetSlot}`);
  };

  useEffect(() => {
    if (isConnected && api) {
      // Subscribe to events when API is available
      subscribeToEvents(api);
    }
  }, [isConnected, api]);

  const subscribeToEvents = (apiInstance) => {
    try {
      // Subscribe to system events
      apiInstance.query.system.events((events) => {
        const newEvents = events
          .filter((record) => {
            const { event } = record;
            return event.section === 'assetConversion' || 
                   event.section === 'assets' ||
                   event.section === 'balances';
          })
          .map((record, index) => ({
            id: `${Date.now()}_${index}`,
            section: record.event.section,
            method: record.event.method,
            data: record.event.data.toString(),
            timestamp: new Date().toLocaleTimeString()
          }));
        
        if (newEvents.length > 0) {
          setEvents(prevEvents => [...newEvents, ...prevEvents].slice(0, 10));
        }
      });
    } catch (error) {
      console.error("Event subscription error:", error);
      setErrors(prev => [...prev, `Event subscription failed: ${error.message}`]);
    }
  };

  // Query functions for various Asset Conversion API calls
  const queryGetReserves = () => {
    executeQuery("Get Pool Reserves", async (apiInstance) => {
      const reserves = await apiInstance.query.assetConversion.pools([
        getAssetLocation(poolParams.asset1),
        getAssetLocation(poolParams.asset2)
      ]);
      return reserves.isEmpty ? "Pool not found" : reserves.toString();
    });
  };

  const queryQuotePrice = () => {
    executeQuery("Quote Price", async (apiInstance) => {
      const path = getSwapPath();
      const quote = await apiInstance.call.assetConversionApi.quotePriceExactTokensForTokens(
        path,
        swapParams.amountIn,
        true // include_fee
      );
      return quote.toString();
    });
  };

  const queryQuotePriceTokensForExact = () => {
    executeQuery("Quote Price (Tokens for Exact)", async (apiInstance) => {
      const path = getSwapPath();
      const quote = await apiInstance.call.assetConversionApi.quotePriceTokensForExactTokens(
        path,
        swapParams.amountOut,
        true // include_fee
      );
      return quote.toString();
    });
  };

  const queryGetLiquidityTokenBalance = () => {
    if (!selectedAccount) {
      setActionResult("❌ Please connect a wallet first!");
      return;
    }
    
    executeQuery("Liquidity Token Balance", async (apiInstance) => {
      const lpTokenId = await apiInstance.call.assetConversionApi.getLpToken(
        getAssetLocation(poolParams.asset1),
        getAssetLocation(poolParams.asset2)
      );
      
      if (lpTokenId.isErr) {
        return "No LP token found for this pool";
      }
      
      const balance = await apiInstance.query.poolAssets.account(
        lpTokenId.asOk,
        selectedAccount.account.address
      );
      
      return balance.isEmpty ? "0" : balance.unwrap().balance.toString();
    });
  };

  const executeQuery = async (queryType, queryBuilder) => {
    if (!isConnected || !api) {
      setActionResult("❌ API not ready. Please wait for connection...");
      return;
    }

    setIsProcessing(true);
    setActionResult(`🔍 Executing ${queryType}...`);

    try {
      const apiInstance = await ensureApi();
      const result = await queryBuilder(apiInstance);
      setActionResult(`✅ ${queryType} result: ${result.toString()}`);
    } catch (error) {
      console.error(`${queryType} error:`, error);
      setActionResult(`❌ ${queryType} failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card">
      <h2 className="wallet-title">🔄 Asset Conversion APIs Demo</h2>
      
      {/* Connection Status */}
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 API Connected' : '🔴 API Disconnected'}
        </div>
        {!isConnected && (
          <div className="warning">
            ⚠️ Waiting for API connection to enable asset conversion features...
          </div>
        )}
      </div>
      
      {/* Introduction */}
      <div className="demo-section">
        <h3>📖 What are Asset Conversion APIs?</h3>
        <p className="subtitle">
          Asset Conversion APIs enable decentralized exchange functionality on Polkadot Asset Hub. 
          They allow users to create liquidity pools, add/remove liquidity, swap tokens, and get price quotes 
          for various asset pairs in a trustless manner.
        </p>
        <div className="api-note">
          <strong>Note:</strong> Asset parameters use proper StagingXcmV4Location format for unambiguous 
          cross-chain asset identification. WND is referenced as relay chain native token, 
          USDT as local asset 1984 on Westend Asset Hub.
        </div>
      </div>

      {/* Asset Discovery Section */}
      <div className="demo-section">
        <h3>🔍 Asset Discovery</h3>
        <p>Search for assets by ID to use in conversions:</p>
        
        <div className="input-group">
          <input
            type="number"
            placeholder="Enter Asset ID (e.g., 1984 for USDT)"
            value={assetIdInput}
            onChange={(e) => setAssetIdInput(e.target.value)}
            className="asset-input"
            disabled={isDiscovering || !isConnected}
          />
          <button
            onClick={discoverAsset}
            disabled={isDiscovering || !isConnected}
            className="search-button"
          >
            {isDiscovering ? "🔄 Searching..." : "🔍 Search Asset"}
          </button>
        </div>

        {/* Discovered Assets */}
        {userAssets.length > 0 && (
          <div className="discovered-assets">
            <h4>🏆 Discovered Assets:</h4>
            {userAssets.map((asset) => (
              <div key={asset.id} className="asset-card">
                <div className="asset-info">
                  <strong>{asset.symbol}</strong> (ID: {asset.id})
                  <br />
                  <small>{asset.name} • {asset.decimals} decimals</small>
                </div>
                <div className="asset-actions">
                  <button onClick={() => useAssetInPool(asset, 'asset1')} className="use-asset-btn">
                    Use as Asset 1
                  </button>
                  <button onClick={() => useAssetInPool(asset, 'asset2')} className="use-asset-btn">
                    Use as Asset 2
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rest of the component continues with the existing query sections... */}
      <div className="demo-section">
        <h3>💹 Pool Queries</h3>
        <div className="query-grid">
          <button
            onClick={queryGetReserves}
            disabled={isProcessing || !isConnected}
            className="query-button"
          >
            📊 Get Pool Reserves
          </button>
          
          <button
            onClick={queryQuotePrice}
            disabled={isProcessing || !isConnected}
            className="query-button"
          >
            💱 Quote Price (Exact In)
          </button>
          
          <button
            onClick={queryQuotePriceTokensForExact}
            disabled={isProcessing || !isConnected}
            className="query-button"
          >
            💰 Quote Price (Exact Out)
          </button>
          
          <button
            onClick={queryGetLiquidityTokenBalance}
            disabled={isProcessing || !isConnected || !selectedAccount}
            className="query-button"
          >
            🏦 LP Token Balance
          </button>
        </div>
      </div>

      {/* Results Display */}
      {actionResult && (
        <div className="results">
          <h3>📈 Query Result:</h3>
          <div className="result-text">{actionResult}</div>
        </div>
      )}

      {/* Events Display */}
      {events.length > 0 && (
        <div className="events-section">
          <h3>📡 Recent Events:</h3>
          <div className="events-list">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="event-item">
                <strong>{event.section}.{event.method}</strong>
                <span className="event-time">{event.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AssetConversionDisplay;
