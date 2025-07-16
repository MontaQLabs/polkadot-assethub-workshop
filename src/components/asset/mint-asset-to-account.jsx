import { useState } from "react";
import { usePolkadotApi } from "../../contexts/PolkadotApiContext.jsx";

export default function MintAssetToAccount({ selectedAccount }) {
  const { api, isConnected, ensureApi } = usePolkadotApi();
  
  // Form state
  const [assetId, setAssetId] = useState("");
  const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
  const [amount, setAmount] = useState("");
  
  // Operation state
  const [isMinting, setIsMinting] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const mintAsset = async () => {
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
    
    if (!beneficiaryAddress.trim()) {
      setError("❌ Please enter a beneficiary address");
      return;
    }
    
    if (!amount.trim()) {
      setError("❌ Please enter an amount to mint");
      return;
    }
    
    const parsedAssetId = parseInt(assetId.trim());
    if (isNaN(parsedAssetId) || parsedAssetId < 0) {
      setError("❌ Please enter a valid positive asset ID");
      return;
    }
    
    const parsedAmount = parseInt(amount.trim());
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError("❌ Please enter a valid positive amount");
      return;
    }

    // Basic address validation (Substrate addresses should be 48 characters)
    if (beneficiaryAddress.length < 47 || beneficiaryAddress.length > 49) {
      setError("❌ Please enter a valid Substrate address");
      return;
    }

    setIsMinting(true);
    setResult("🔄 Minting asset...");

    try {
      // Ensure API is ready
      const apiInstance = await ensureApi();
      
      // First check if the asset exists
      const assetDetails = await apiInstance.query.assets.asset(parsedAssetId);
      if (!assetDetails || assetDetails.isNone) {
        setError(`❌ Asset ${parsedAssetId} not found. Please create the asset first.`);
        return;
      }

      // Check if the selected account is the issuer of this asset
      const details = assetDetails.unwrap();
      if (details.issuer.toString() !== selectedAccount.account.address) {
        setError("❌ Only the asset issuer can mint tokens. You are not the issuer of this asset.");
        return;
      }

      // Create the asset minting transaction
      // Parameters: (assetId, beneficiary, amount)
      const transactionExtrinsic = apiInstance.tx.assets.mint(
        parsedAssetId,
        beneficiaryAddress.trim(),
        parsedAmount
      );

      // Sign and send the transaction
      const txHash = await transactionExtrinsic.signAndSend(
        selectedAccount.account.address, 
        { signer: selectedAccount.signer }
      );
      
      setResult(`✅ Asset minting transaction submitted! 
        Asset ID: ${parsedAssetId}
        Amount: ${parsedAmount}
        Beneficiary: ${beneficiaryAddress}
        Transaction hash: ${txHash}`);
      
      // Reset form after success
      setAssetId("");
      setBeneficiaryAddress("");
      setAmount("");
      
    } catch (error) {
      console.error("Asset minting error:", error);
      
      // Provide helpful error messages
      let errorMessage = error.message;
      if (error.message.includes("BadOrigin")) {
        errorMessage = "Account does not have permission to mint this asset";
      } else if (error.message.includes("NoPermission")) {
        errorMessage = "Insufficient permissions to mint asset - you must be the issuer";
      } else if (error.message.includes("Unknown")) {
        errorMessage = "Asset not found or invalid asset ID";
      } else if (error.message.includes("BadWitness")) {
        errorMessage = "Invalid beneficiary address";
      } else if (error.message.includes("BalanceLow")) {
        errorMessage = "Insufficient balance to pay transaction fees";
      } else if (error.message.includes("user rejected")) {
        errorMessage = "Transaction was rejected by user";
      } else if (error.message.includes("Frozen")) {
        errorMessage = "Asset is frozen and cannot be minted";
      }
      
      setError(`❌ Asset minting failed: ${errorMessage}`);
    } finally {
      setIsMinting(false);
    }
  };

  const fillCurrentAccount = () => {
    if (selectedAccount) {
      setBeneficiaryAddress(selectedAccount.account.address);
    }
  };

  return (
    <div className="asset-component">
      <div className="component-header">
        <h3 className="component-title">💰 Mint Asset to Account</h3>
        <p className="component-subtitle">
          Mint existing assets to specific accounts with precise amounts
        </p>
      </div>

      <div className="component-content">
        {/* Asset ID Input */}
        <div className="input-group">
          <label className="input-label">Asset ID</label>
          <input
            type="number"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="Enter asset ID (e.g., 1000)"
            className="input-field"
            disabled={isMinting}
            min="0"
          />
          <div className="input-hint">
            The unique identifier of the asset you want to mint
          </div>
        </div>

        {/* Beneficiary Address Input */}
        <div className="input-group">
          <label className="input-label">Beneficiary Address</label>
          <div className="address-input-container">
            <input
              type="text"
              value={beneficiaryAddress}
              onChange={(e) => setBeneficiaryAddress(e.target.value)}
              placeholder="Enter beneficiary address (5..."
              className="input-field address-input"
              disabled={isMinting}
            />
            <button
              type="button"
              onClick={fillCurrentAccount}
              className="fill-address-btn"
              disabled={isMinting || !selectedAccount}
              title="Use current account address"
            >
              Use Mine
            </button>
          </div>
          <div className="input-hint">
            The account that will receive the minted assets
          </div>
        </div>

        {/* Amount Input */}
        <div className="input-group">
          <label className="input-label">Amount to Mint</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount (e.g., 1000)"
            className="input-field"
            disabled={isMinting}
            min="1"
          />
          <div className="input-hint">
            Number of asset units to create and send to the beneficiary
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={mintAsset}
          disabled={isMinting || !selectedAccount}
          className={`action-button ${isMinting ? 'loading' : ''}`}
        >
          {isMinting ? (
            <>
              <span className="loading-spinner"></span>
              Minting Asset...
            </>
          ) : (
            'Mint Asset'
          )}
        </button>

        {/* Results Display */}
        {result && (
          <div className="result-display success">
            <div className="result-content">
              {result.split('\n').map((line, index) => (
                <div key={index}>{line}</div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="result-display error">
            {error}
          </div>
        )}

        {/* Information Panel */}
        <div className="info-panel">
          <h4>ℹ️ Minting Requirements</h4>
          <ul>
            <li>You must be the <strong>issuer</strong> of the asset to mint tokens</li>
            <li>The asset must exist and not be frozen</li>
            <li>You need sufficient balance to pay transaction fees</li>
            <li>The beneficiary address must be a valid Substrate address</li>
            <li>Asset amounts are in the smallest unit (consider decimals if applicable)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
