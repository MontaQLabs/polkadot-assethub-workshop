import React, { useState } from 'react';
import WalletSelection from './wallet-selection.jsx';

const WalletSelectionDemo = () => {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [demoAction, setDemoAction] = useState('');

  const handleAccountSelect = (accountData) => {
    setSelectedAccount(accountData);
    setDemoAction('');
    console.log('Selected account:', accountData);
  };

  const simulateTransaction = async () => {
    if (!selectedAccount) {
      setDemoAction('❌ No account selected! Please select an account first.');
      return;
    }

    setDemoAction('🔄 Preparing transaction...');
    
    try {
      // Simulate a transaction preparation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setDemoAction(`✅ Ready to sign transaction with ${selectedAccount.account.meta.name || 'Selected Account'}`);
      
      // In a real dApp, you would use the selectedAccount.signer here
      // For example:
      // const tx = await api.tx.balances.transfer(recipient, amount);
      // await tx.signAndSend(selectedAccount.account.address, { signer: selectedAccount.signer });
      
    } catch (error) {
      setDemoAction(`❌ Transaction failed: ${error.message}`);
    }
  };

  const clearSelection = () => {
    setSelectedAccount(null);
    setDemoAction('');
  };

  return (
    <div className="demo-container">
      <div className="demo-header">
        <h1 className="title">Wallet Selection Demo</h1>
        <p className="subtitle">
          Experience the wallet selection interface for Polkadot dApps
        </p>
      </div>

      {/* Wallet Selection Component */}
      <WalletSelection 
        onAccountSelect={handleAccountSelect}
        selectedAccount={selectedAccount}
      />

      {/* Demo Actions Section */}
      {selectedAccount && (
        <div className="demo-actions card">
          <h3 className="section-title">🎯 Demo Actions</h3>
          <p className="section-subtitle">
            Test how the selected account can be used in your dApp
          </p>

          <div className="action-buttons">
            <button 
              className="demo-button transaction-button"
              onClick={simulateTransaction}
            >
              📝 Simulate Transaction
            </button>
            
            <button 
              className="demo-button clear-button"
              onClick={clearSelection}
            >
              🗑️ Clear Selection
            </button>
          </div>

          {demoAction && (
            <div className="demo-result">
              <strong>Action Result:</strong>
              <p>{demoAction}</p>
            </div>
          )}

          <div className="account-details">
            <h4>Selected Account Details:</h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Name:</span>
                <span className="detail-value">
                  {selectedAccount.account.meta.name || 'Unnamed Account'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Address:</span>
                <span className="detail-value mono">
                  {selectedAccount.account.address}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Source:</span>
                <span className="detail-value">
                  {selectedAccount.account.meta.source}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Signer Available:</span>
                <span className="detail-value">
                  {selectedAccount.signer ? '✅ Yes' : '❌ No'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Integration Guide */}
      <div className="integration-guide card">
        <h3 className="section-title">💡 Integration Guide</h3>
        <div className="guide-content">
          <div className="guide-step">
            <span className="step-number">1</span>
            <div className="step-content">
              <h4>Import the Component</h4>
              <code className="code-snippet">
                import WalletSelection from './wallet-selection.jsx';
              </code>
            </div>
          </div>

          <div className="guide-step">
            <span className="step-number">2</span>
            <div className="step-content">
              <h4>Add State Management</h4>
              <code className="code-snippet">
                const [selectedAccount, setSelectedAccount] = useState(null);
              </code>
            </div>
          </div>

          <div className="guide-step">
            <span className="step-number">3</span>
            <div className="step-content">
              <h4>Use the Component</h4>
              <code className="code-snippet">
                {`<WalletSelection 
  onAccountSelect={setSelectedAccount}
  selectedAccount={selectedAccount}
/>`}
              </code>
            </div>
          </div>

          <div className="guide-step">
            <span className="step-number">4</span>
            <div className="step-content">
              <h4>Use Selected Account</h4>
              <code className="code-snippet">
                {`// Access account data
const address = selectedAccount.account.address;
const signer = selectedAccount.signer;

// Sign transactions
await tx.signAndSend(address, { signer });`}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletSelectionDemo; 