import React, { useState, useEffect } from 'react';
import { web3Accounts, web3Enable, web3FromAddress } from '@polkadot/extension-dapp';

const WalletSelection = ({ onAccountSelect, selectedAccount }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [walletExtensions, setWalletExtensions] = useState([]);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Check if already connected on component mount
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      const accounts = await web3Accounts();
      if (accounts && accounts.length > 0) {
        setAvailableAccounts(accounts);
        setIsConnected(true);
      }
    } catch (err) {
      // Silently handle - user might not have connected yet
    }
  };

  const connectWallet = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      // Enable web3 for this dApp
      const extensions = await web3Enable('Asset Hub Workshop');

      if (!extensions || extensions.length === 0) {
        throw new Error(
          'No wallet extensions found. Please install a Polkadot wallet extension like Polkadot.js or Talisman.'
        );
      }

      setWalletExtensions(extensions);

      // Get all accounts from all extensions
      const accounts = await web3Accounts();

      if (!accounts || accounts.length === 0) {
        throw new Error(
          'No accounts found. Please create or import accounts in your wallet extension.'
        );
      }

      setAvailableAccounts(accounts);
      setIsConnected(true);
    } catch (err) {
      console.error('Wallet connection failed:', err);
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleAccountSelect = async (account) => {
    try {
      // Get the injector for this account to enable signing
      const injector = await web3FromAddress(account.address);
      
      // Call the parent callback with account and injector
      onAccountSelect({
        account,
        injector,
        signer: injector.signer
      });
    } catch (err) {
      console.error('Failed to setup account:', err);
      setError(`Failed to setup account: ${err.message}`);
    }
  };

  const disconnectWallet = () => {
    setAvailableAccounts([]);
    setWalletExtensions([]);
    setIsConnected(false);
    setError(null);
    onAccountSelect(null);
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="wallet-selection">
      <div className="wallet-selection-header">
        <h2 className="wallet-title">👛 Wallet Selection</h2>
        <p className="subtitle">
          Choose which account you want to use for this dApp
        </p>
      </div>

      {!isConnected ? (
        <div className="wallet-connect-section">
          <button
            className="connect-button wallet-button"
            onClick={connectWallet}
            disabled={isConnecting}
          >
            {isConnecting && <div className="loading"></div>}
            {isConnecting ? 'Connecting...' : '🔗 Connect Wallet'}
          </button>

          <div className="wallet-help">
            <p>💡 <strong>Supported Wallets:</strong></p>
            <ul>
              <li>
                <a href="https://polkadot.js.org/extension/" target="_blank" rel="noopener noreferrer">
                  Polkadot.js Extension
                </a>
              </li>
              <li>
                <a href="https://talisman.xyz/" target="_blank" rel="noopener noreferrer">
                  Talisman Wallet
                </a>
              </li>
              <li>
                <a href="https://www.subwallet.app/" target="_blank" rel="noopener noreferrer">
                  SubWallet
                </a>
              </li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="wallet-connected-section">
          <div className="connection-status">
            <span className="status-indicator">✅</span>
            <span>Wallet Connected</span>
            <button className="disconnect-button" onClick={disconnectWallet}>
              🔓 Disconnect
            </button>
          </div>

          {selectedAccount && (
            <div className="selected-account-banner">
              <div className="selected-indicator">
                <span className="selection-icon">👤</span>
                <span className="selection-text">Active Account</span>
              </div>
              <div className="selected-account-info">
                <div className="selected-name">
                  {selectedAccount.account.meta.name || 'Unnamed Account'}
                </div>
                <div className="selected-address">
                  {formatAddress(selectedAccount.account.address)}
                </div>
              </div>
            </div>
          )}

          <div className="accounts-list">
            <h3 className="accounts-title">
              Available Accounts ({availableAccounts.length})
            </h3>
            
            {availableAccounts.map((account, index) => {
              const isSelected = selectedAccount && selectedAccount.account.address === account.address;
              
              return (
                <div
                  key={account.address}
                  className={`account-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => !isSelected && handleAccountSelect(account)}
                >
                  <div className="account-main-info">
                    <div className="account-header">
                      <div className="account-name">
                        {account.meta.name || `Account ${index + 1}`}
                      </div>
                      <div className="account-source">
                        {account.meta.source}
                      </div>
                    </div>
                    
                    <div className="account-address">
                      <span className="address-label">Address:</span>
                      <span className="address-value">{formatAddress(account.address)}</span>
                      <span className="address-full" title={account.address}>
                        📋
                      </span>
                    </div>
                  </div>

                  <div className="account-actions">
                    {isSelected ? (
                      <div className="selected-badge">
                        <span className="check-icon">✓</span>
                        <span>Selected</span>
                      </div>
                    ) : (
                      <button className="select-button">
                        Select Account
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {walletExtensions.length > 0 && (
            <div className="extension-info">
              <h4>Connected Extensions:</h4>
              <div className="extensions-list">
                {walletExtensions.map((ext, index) => (
                  <span key={index} className="extension-badge">
                    {ext.name} v{ext.version}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}
    </div>
  );
};

export default WalletSelection;
