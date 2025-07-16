import { useState } from "react";
import { usePolkadotApi } from "../../contexts/PolkadotApiContext.jsx";

export default function NextAvailableId() {
  const { api, isConnected, ensureApi } = usePolkadotApi();
  const [nextId, setNextId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const nextAvailableId = async () => {
    if (!isConnected || !api) {
      return;
    }

    setIsLoading(true);
    try {
      const apiInstance = await ensureApi();
      const nextId = await apiInstance.query.assets.nextAssetId();
      setNextId(nextId.toString());
    } catch (error) {
      console.error("Error fetching next available ID:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="next-id-container">
      <h3 className="feature-title">🆔 Next Available Asset ID</h3>
      <p className="feature-description">
        Query the next available asset ID for creating new assets
      </p>
      
      <div className="action-section">
        <button 
          className="demo-button"
          onClick={nextAvailableId}
          disabled={!isConnected || isLoading}
        >
          {isLoading ? (
            <>
              <div className="loading"></div>
              Fetching...
            </>
          ) : (
            <>
              🔍 Get Next ID
            </>
          )}
        </button>
        
        {nextId && (
          <div className="result-display">
            <div className="result-header">
              <span className="result-icon">✅</span>
              <span className="result-label">Next Available ID:</span>
            </div>
            <div className="result-value">
              <span className="asset-id">{nextId}</span>
            </div>
          </div>
        )}
        
        {!isConnected && (
          <div className="warning-message">
            <span className="warning-icon">⚠️</span>
            API not connected. Please wait for connection...
          </div>
        )}
      </div>
    </div>
  );
}