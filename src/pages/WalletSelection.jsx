import React, { useState } from "react";
import WalletSelection from "../components/wallet-selection.jsx";
import { usePolkadotApi } from "../contexts/PolkadotApiContext.jsx";
import { RECIPIENT, PASSEO_SYMBOL, PASSEO_DECIMALS } from "../../constants.js";

function WalletSelectionPage() {
  const { api, isConnected, ensureApi } = usePolkadotApi();
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [demoAction, setDemoAction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [signer, setSigner] = useState(null);

  const handleAccountSelect = (accountData) => {
    setSelectedAccount(accountData);
    setDemoAction("");
    console.log("Selected account for dApp:", accountData);
    setSigner(accountData?.signer);
  };

  const transferTransaction = async () => {
    if (!selectedAccount) {
      setDemoAction("❌ Please select an account first!");
      return;
    }

    if (!isConnected) {
      setDemoAction("❌ API not connected. Please wait for connection...");
      return;
    }

    setIsProcessing(true);
    setDemoAction("🔄 Executing transaction...");

    try {
      // Ensure API is ready
      const apiInstance = await ensureApi();
      
      // Use balances.transferKeepAlive instead of balances.transfer for Asset Hub
      const transactionExtrinsic = apiInstance.tx.balances.transferKeepAlive(
        RECIPIENT,
        1 * PASSEO_DECIMALS
      );

      await transactionExtrinsic.signAndSend(selectedAccount.account.address, { signer });
      
      setDemoAction("✅ Transaction submitted successfully!");
    } catch (error) {
      console.error("Transaction error:", error);
      setDemoAction(`❌ Demo failed: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const checkBalance = async () => {
    if (!selectedAccount) {
      setDemoAction("❌ Please select an account first!");
      return;
    }

    if (!isConnected) {
      setDemoAction("❌ API not connected. Please wait for connection...");
      return;
    }

    setIsProcessing(true);
    setDemoAction("🔍 Checking account balance...");

    try {
      // Ensure API is ready
      const apiInstance = await ensureApi();

      const { data: balance } = await apiInstance.query.system.account(
        selectedAccount.account.address
      );
      setDemoAction(`💰 Account balance: ${balance.free / PASSEO_DECIMALS} ${PASSEO_SYMBOL}`);
    } catch (error) {
      console.error("Balance check error:", error);
      setDemoAction(`❌ Balance check failed: ${error.message}`); 
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="page">
      <div className="page-content">
        <WalletSelection 
          onAccountSelect={handleAccountSelect}
          selectedAccount={selectedAccount}
        />
        
        {selectedAccount && (
          <div className="card">
            <h2 className="wallet-title">🚀 Demo Actions</h2>
            <p className="subtitle">
              Test blockchain operations with your selected account
            </p>
            
            <div className="selected-account-info">
              <h3>Selected Account:</h3>
              <div className="account-details">
                <div><strong>Name:</strong> {selectedAccount.account.meta.name}</div>
                <div><strong>Address:</strong> {selectedAccount.account.address}</div>
                <div><strong>Source:</strong> {selectedAccount.account.meta.source}</div>
              </div>
            </div>

            <div className="demo-actions">
              <button
                className="action-button"
                onClick={checkBalance}
                disabled={isProcessing || !isConnected}
              >
                {isProcessing ? "🔄 Checking..." : "💰 Check Balance"}
              </button>
              
              <button
                className="action-button"
                onClick={transferTransaction}
                disabled={isProcessing || !isConnected}
              >
                {isProcessing ? "🔄 Processing..." : "💸 Send Test Transaction"}
              </button>
            </div>

            {!isConnected && (
              <div className="warning">
                ⚠️ Waiting for API connection to enable demo actions...
              </div>
            )}

            {demoAction && (
              <div className="demo-result">
                <h3>Demo Result:</h3>
                <div className="result-text">{demoAction}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default WalletSelectionPage; 