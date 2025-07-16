import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { ASSET_HUB_WS } from '../../constants.js';

// Create the context
const PolkadotApiContext = createContext();

// Custom hook to use the Polkadot API context
export const usePolkadotApi = () => {
  const context = useContext(PolkadotApiContext);
  if (!context) {
    throw new Error('usePolkadotApi must be used within a PolkadotApiProvider');
  }
  return context;
};

// Provider component
export const PolkadotApiProvider = ({ children }) => {
  const [api, setApi] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [chainInfo, setChainInfo] = useState(null);

  // Connect to the API
  const connectApi = async () => {
    if (api && isConnected) return api; // Already connected

    setIsConnecting(true);
    setError(null);

    try {
      console.log('🔗 Connecting to Polkadot API...');
      
      // Create WebSocket provider
      const provider = new WsProvider(ASSET_HUB_WS);
      
      // Create API instance
      const apiInstance = await ApiPromise.create({ provider });
      
      // Wait for the API to be ready
      await apiInstance.isReady;
      
      // Get chain information
      const [chain, nodeName, nodeVersion] = await Promise.all([
        apiInstance.rpc.system.chain(),
        apiInstance.rpc.system.name(),
        apiInstance.rpc.system.version(),
      ]);

      const chainData = {
        chain: chain.toString(),
        nodeName: nodeName.toString(),
        nodeVersion: nodeVersion.toString(),
        endpoint: ASSET_HUB_WS
      };

      setApi(apiInstance);
      setChainInfo(chainData);
      setIsConnected(true);
      
      console.log('✅ Polkadot API connected successfully');
      console.log('📊 Chain Info:', chainData);
      
      // Handle disconnection events
      provider.on('disconnected', () => {
        console.log('❌ Polkadot API disconnected');
        setIsConnected(false);
        setApi(null);
      });

      provider.on('error', (error) => {
        console.error('🚨 Polkadot API error:', error);
        setError(error.message);
        setIsConnected(false);
      });

      return apiInstance;
    } catch (err) {
      console.error('❌ Failed to connect to Polkadot API:', err);
      setError(err.message);
      setIsConnected(false);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect from the API
  const disconnectApi = async () => {
    if (api) {
      try {
        await api.disconnect();
        setApi(null);
        setIsConnected(false);
        setChainInfo(null);
        setError(null);
        console.log('📴 Polkadot API disconnected');
      } catch (err) {
        console.error('Error disconnecting API:', err);
      }
    }
  };

  // Auto-connect on component mount
  useEffect(() => {
    connectApi().catch(err => {
      console.error('Auto-connect failed:', err);
    });

    // Cleanup on unmount
    return () => {
      if (api) {
        api.disconnect().catch(console.error);
      }
    };
  }, []);

  // Context value
  const value = {
    api,
    isConnecting,
    isConnected,
    error,
    chainInfo,
    connectApi,
    disconnectApi,
    // Helper method to ensure API is ready before use
    ensureApi: async () => {
      if (api && isConnected) return api;
      return await connectApi();
    }
  };

  return (
    <PolkadotApiContext.Provider value={value}>
      {children}
    </PolkadotApiContext.Provider>
  );
};

export default PolkadotApiContext; 