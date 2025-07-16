// This page is build based on the doc: https://wiki.polkadot.network/learn/learn-guides-asset-conversion/
// https://wiki.polkadot.network/learn/learn-guides-assets-create/
//
// General step:
// 1. ✅ Find out the next available asset id
// 2. ✅ Create the asset
// 3. ✅ Check the created asset by id
// 4. ✅ Set metadata for the created asset
// 5. ✅ Mint the asset to a desired account
// 6. ✅ Create a pool with the asset
// 7. Add liquidity to the pool
// 8. Swap the asset
// 9. Remove liquidity from the pool
// 10. Delete the pool

import { useState } from "react";
import AssetConversionDisplay from "../components/asset-conversion.jsx";
import NextAvailableId from "../components/asset/next-available-id.jsx";
import CreateAssets from "../components/asset/create-assets.jsx";
import CheckAssets from "../components/asset/check-assets.jsx";
import WalletSelection from "../components/wallet-selection.jsx";
import SetMetadata from "../components/asset/set-metadata.jsx";
import MintAssetToAccount from "../components/asset/mint-asset-to-account.jsx";
import CreatePool from "../components/asset/create-pool.jsx";

export default function AssetConversion() {
  const [selectedAccount, setSelectedAccount] = useState(null);

  const handleAccountSelect = (accountData) => {
    setSelectedAccount(accountData);
    console.log("Selected account for asset operations:", accountData);
  };

  return (
    <div className="page-content">
      <div className="asset-conversion-header">
        <h1 className="title">Asset Conversion Hub</h1>
        <p className="subtitle">
          Manage asset creation, liquidity pools, and decentralized exchange operations on Polkadot Asset Hub
        </p>
      </div>

      {/* Wallet Selection Section */}
      <div className="wallet-section card">
        <h2 className="section-title">👛 Wallet Connection</h2>
        <p className="section-subtitle">
          Connect your wallet to create and manage assets
        </p>
        <WalletSelection 
          onAccountSelect={handleAccountSelect}
          selectedAccount={selectedAccount}
        />
      </div>

      <div className="asset-conversion-grid">
        {/* Asset Management Section */}
        <div className="asset-section card">
          <h2 className="section-title">
            🏗️ Asset Management
          </h2>
          <p className="section-subtitle">
            Create and manage custom assets on the network
          </p>
          
          <NextAvailableId />
          
          {/* Asset Creation Component */}
          <CreateAssets selectedAccount={selectedAccount} />
          
          {/* Asset Check Component */}
          <CheckAssets selectedAccount={selectedAccount} />

          <SetMetadata selectedAccount={selectedAccount} />
          
          {/* Asset Minting Component */}
          <MintAssetToAccount selectedAccount={selectedAccount} />
        </div>

        {/* Liquidity & Trading Section */}
        <div className="liquidity-section card">
          <h2 className="section-title">
            🔄 Liquidity & Trading
          </h2>
          <p className="section-subtitle">
            Manage liquidity pools and execute swaps
          </p>
          
          {/* Pool Creation Component */}
          <CreatePool selectedAccount={selectedAccount} />
          
          <div className="feature-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">➕</div>
              <h3>Add Liquidity</h3>
              <p>Provide liquidity to existing pools and earn rewards</p>
              <div className="coming-soon">Coming Soon</div>
            </div>
          </div>
          
          <div className="feature-placeholder">
            <div className="placeholder-content">
              <div className="placeholder-icon">🔁</div>
              <h3>Asset Swapping</h3>
              <p>Exchange assets through optimal swap routes</p>
              <div className="coming-soon">Coming Soon</div>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Conversion Display Section */}
      {selectedAccount && (
        <div className="conversion-display-section">
          <AssetConversionDisplay selectedAccount={selectedAccount} />
        </div>
      )}
    </div>
  );
}
