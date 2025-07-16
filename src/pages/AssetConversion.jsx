// This page is build based on the doc: https://wiki.polkadot.network/learn/learn-guides-asset-conversion/
// https://wiki.polkadot.network/learn/learn-guides-assets-create/
//
// General step:
// 1. Find out the next available asset id
// 2. Create the asset
// 3. Mint the asset to a desired account
// 4. Create a pool with the asset
// 5. Add liquidity to the pool
// 6. Swap the asset
// 7. Remove liquidity from the pool
// 8. Delete the pool

import { useState } from "react";
import WalletSelection from "../components/wallet-selection.jsx";
import AssetConversionDisplay from "../components/asset-conversion.jsx";
import NextAvailableId from "../components/asset/next-available-id.jsx";

export default function AssetConversion() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [signer, setSigner] = useState(null);

  const handleAccountSelect = (accountData) => {
    setSelectedAccount(accountData);
    setSigner(accountData.signer);
  };
  return (
    <div className="page-content">
      <div className="asset-conversion-page-layout">
        <WalletSelection
          onAccountSelect={handleAccountSelect}
          selectedAccount={selectedAccount}
        />
      </div>
      <NextAvailableId />
      {selectedAccount && (
        <div>
          <AssetConversionDisplay selectedAccount={selectedAccount} />
        </div>
      )}
    </div>
  );
}
