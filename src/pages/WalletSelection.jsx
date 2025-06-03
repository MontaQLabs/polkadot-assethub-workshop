import React, { useState } from "react";
import WalletSelection from "../../wallet-selection.jsx";
import { ApiPromise, WsProvider } from "@polkadot/api";
import { RECIPIENT, PASSET_HUB_WS, PASSEO_SYMBOL, PASSEO_DECIMALS } from "../../constants.js";

function WalletSelectionPage() {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [demoAction, setDemoAction] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [signer, setSigner] = useState(null);

  const handleAccountSelect = (accountData) => {
    setSelectedAccount(accountData);
    setDemoAction("");
    console.log("Selected account for dApp:", accountData);
    setSigner(accountData.signer);
  };

  const transferTransaction = async () => {
    if (!selectedAccount) {
      setDemoAction("❌ Please select an account first!");
      return;
    }

    setIsProcessing(true);
    setDemoAction("🔄 Executing transaction...");

    try {
      const api = await ApiPromise.create({
        provider: new WsProvider(PASSET_HUB_WS),
      });
      
      // Wait for the API to be ready
      await api.isReady;
      
      // Use balances.transferKeepAlive instead of balances.transfer for Asset Hub
      const transactionExtrinsic = api.tx.balances.transferKeepAlive(
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

    setIsProcessing(true);
    setDemoAction("🔍 Checking account balance...");

    try {
      const api = await ApiPromise.create({
        provider: new WsProvider(PASSET_HUB_WS),
      });

      // Wait for the API to be ready
      await api.isReady;

      const { data: balance } = await api.query.system.account(
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
    <div className="page-content">
      <div className="wallet-page-layout">
        {/* Left Side - Wallet Selection */}
        <div className="wallet-selection-section">
          <WalletSelection
            onAccountSelect={handleAccountSelect}
            selectedAccount={selectedAccount}
          />
        </div>

        {/* Right Side - Demo Actions */}
        {selectedAccount && (
          <div className="demo-actions-section">
            <div className="card">
              <h2 className="wallet-title">🎯 dApp Demo Actions</h2>
              <p className="subtitle">
                Test dApp functionality with your selected account
              </p>

              <div className="demo-actions-grid">
                <button
                  className="demo-action-button transaction-demo"
                  onClick={transferTransaction}
                  disabled={isProcessing}
                >
                  {isProcessing && <div className="loading"></div>}
                  📝 Simple Transfer
                </button>

                <button
                  className="demo-action-button balance-demo"
                  onClick={checkBalance}
                  disabled={isProcessing}
                >
                  {isProcessing && <div className="loading"></div>}
                  💰 Check Balance
                </button>
              </div>

              {demoAction && (
                <div className="demo-result">
                  <strong>Demo Result:</strong>
                  <p>{demoAction}</p>
                </div>
              )}

              {/* Active Account Summary */}
              <div className="active-account-summary">
                <h3>🔗 Active Account</h3>
                <div className="account-summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">Name:</span>
                    <span className="summary-value">
                      {selectedAccount.account.meta.name || "Unnamed Account"}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Wallet:</span>
                    <span className="summary-value">
                      {selectedAccount.account.meta.source}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Address:</span>
                    <span className="summary-value address-short">
                      {`${selectedAccount.account.address.slice(
                        0,
                        12
                      )}...${selectedAccount.account.address.slice(-12)}`}
                    </span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">Ready to Sign:</span>
                    <span className="summary-value">
                      {selectedAccount.signer ? "✅ Yes" : "❌ No"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Integration Status */}
              <div className="integration-status">
                <div className="status-grid">
                  <div className="status-item">
                    <span className="status-icon">👛</span>
                    <span className="status-text">
                      Wallet: {selectedAccount ? "✅ Selected" : "❌ Not Selected"}
                    </span>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">🔐</span>
                    <span className="status-text">
                      Signer:{" "}
                      {selectedAccount?.signer ? "✅ Ready" : "❌ Not Ready"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default WalletSelectionPage; 