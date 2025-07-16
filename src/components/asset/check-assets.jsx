import React, { useState } from "react";
import { usePolkadotApi } from "../../contexts/PolkadotApiContext.jsx";

function CheckAssets({ selectedAccount, onAssetDiscovered }) {
  const { api, isConnected } = usePolkadotApi();
  const [userAssets, setUserAssets] = useState([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [assetIdInput, setAssetIdInput] = useState("");
  const [actionResult, setActionResult] = useState("");

  // Asset discovery function for specific assets based on user input
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
      
      // Notify parent component if callback provided
      if (onAssetDiscovered) {
        onAssetDiscovered(assetInfo);
      }
    } catch (error) {
      console.error("Asset discovery error:", error);
      setActionResult(`❌ Asset search failed: ${error.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="demo-section">
      <h3>🔍 Asset Discovery & Verification</h3>
      <p>Search for existing assets by ID to verify their details and properties:</p>
      
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

      {/* Action Result */}
      {actionResult && (
        <div className="result-text" style={{ marginTop: '1rem' }}>
          {actionResult}
        </div>
      )}

      {/* Discovered Assets */}
      {userAssets.length > 0 && (
        <div className="discovered-assets" style={{ marginTop: '1.5rem' }}>
          <h4>🏆 Discovered Assets:</h4>
          {userAssets.map((asset) => (
            <div key={asset.id} className="asset-card">
              <div className="asset-info">
                <div className="asset-header">
                  <strong>{asset.symbol}</strong> (ID: {asset.id})
                </div>
                <div className="asset-details">
                  <div>Name: {asset.name}</div>
                  <div>Decimals: {asset.decimals}</div>
                  <div>Total Supply: {asset.supply}</div>
                  <div>Accounts: {asset.accounts}</div>
                  <div>Admin: {asset.admin}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CheckAssets;
