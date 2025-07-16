import React from 'react';
import { usePolkadotApi } from '../contexts/PolkadotApiContext.jsx';

const ApiStatusIndicator = () => {
  const { isConnecting, isConnected, error, chainInfo } = usePolkadotApi();

  return (
    <div className="api-status-indicator">
      <div className={`status-badge ${isConnected ? 'connected' : isConnecting ? 'connecting' : 'disconnected'}`}>
        {isConnecting && <div className="loading-spinner"></div>}
        <span className="status-icon">
          {isConnected ? '🟢' : isConnecting ? '🟡' : '🔴'}
        </span>
        <span className="status-text">
          {isConnected 
            ? 'Connected' 
            : isConnecting 
              ? 'Connecting...' 
              : 'Disconnected'
          }
        </span>
      </div>
      
      {isConnected && chainInfo && (
        <div className="chain-info">
          <span className="chain-name">{chainInfo.chain}</span>
          <span className="separator">•</span>
          <span className="node-name">{chainInfo.nodeName}</span>
        </div>
      )}
      
      {error && (
        <div className="api-error">
          <span className="error-icon">⚠️</span>
          <span className="error-text">{error}</span>
        </div>
      )}
    </div>
  );
};

export default ApiStatusIndicator; 