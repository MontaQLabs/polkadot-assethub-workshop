# PolkadotApiContext Usage Guide

## Overview

The `PolkadotApiContext` provides a centralized way to manage the polkadot.js API connection throughout your React application. It automatically connects to the Asset Hub network and makes the API instance available to all components.

## Quick Start

### 1. Using the Context in a Component

```jsx
import React from 'react';
import { usePolkadotApi } from '../contexts/PolkadotApiContext.jsx';

function MyComponent() {
  const { 
    api,           // The polkadot.js API instance
    isConnected,   // Boolean: Is the API connected?
    isConnecting,  // Boolean: Is connection in progress?
    error,         // String: Connection error if any
    chainInfo,     // Object: Chain metadata (name, version, etc.)
    ensureApi      // Function: Ensures API is ready before use
  } = usePolkadotApi();

  const handleQuery = async () => {
    if (!isConnected) {
      console.log('API not connected yet...');
      return;
    }

    try {
      // Use the API directly
      const blockHash = await api.rpc.chain.getBlockHash();
      console.log('Latest block:', blockHash.toString());
    } catch (err) {
      console.error('Query failed:', err);
    }
  };

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <button onClick={handleQuery} disabled={!isConnected}>
        Query Blockchain
      </button>
    </div>
  );
}
```

### 2. Using `ensureApi` for Robust Error Handling

```jsx
function MyComponent() {
  const { ensureApi } = usePolkadotApi();

  const handleTransaction = async () => {
    try {
      // This will wait for connection if needed, or throw if connection fails
      const api = await ensureApi();
      
      // Now you can safely use the API
      const result = await api.query.system.account(accountAddress);
      console.log('Account info:', result.toString());
    } catch (err) {
      console.error('Failed to connect or query:', err);
    }
  };

  return (
    <button onClick={handleTransaction}>
      Safe Transaction
    </button>
  );
}
```

## Available Properties

| Property | Type | Description |
|----------|------|-------------|
| `api` | `ApiPromise \| null` | The polkadot.js API instance, null if not connected |
| `isConnected` | `boolean` | True if API is connected and ready |
| `isConnecting` | `boolean` | True if connection is in progress |
| `error` | `string \| null` | Error message if connection failed |
| `chainInfo` | `object \| null` | Chain metadata (chain name, node name, version, endpoint) |
| `connectApi()` | `function` | Manually trigger connection (usually not needed) |
| `disconnectApi()` | `function` | Manually disconnect |
| `ensureApi()` | `function` | Returns API when ready, throws if connection fails |

## Common Patterns

### 1. Conditional Rendering Based on Connection Status

```jsx
function MyComponent() {
  const { isConnected, isConnecting, error } = usePolkadotApi();

  if (isConnecting) {
    return <div>🔄 Connecting to blockchain...</div>;
  }

  if (error) {
    return <div>❌ Connection error: {error}</div>;
  }

  if (!isConnected) {
    return <div>⚠️ Not connected to blockchain</div>;
  }

  return <div>✅ Ready to interact with blockchain!</div>;
}
```

### 2. Making Queries

```jsx
function BalanceChecker({ accountAddress }) {
  const { api, isConnected } = usePolkadotApi();
  const [balance, setBalance] = useState(null);

  const checkBalance = async () => {
    if (!isConnected || !api) return;

    try {
      const { data: { free } } = await api.query.system.account(accountAddress);
      setBalance(free.toString());
    } catch (err) {
      console.error('Balance check failed:', err);
    }
  };

  useEffect(() => {
    if (isConnected && accountAddress) {
      checkBalance();
    }
  }, [isConnected, accountAddress]);

  return (
    <div>
      Balance: {balance ? `${balance} units` : 'Loading...'}
    </div>
  );
}
```

### 3. Subscribing to Chain Events

```jsx
function EventMonitor() {
  const { api, isConnected } = usePolkadotApi();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (!isConnected || !api) return;

    const unsubscribe = api.query.system.events((events) => {
      const newEvents = events.map((record) => ({
        section: record.event.section,
        method: record.event.method,
        data: record.event.data.toString()
      }));
      setEvents(newEvents.slice(0, 10)); // Keep last 10 events
    });

    return () => unsubscribe?.then(fn => fn?.());
  }, [api, isConnected]);

  return (
    <div>
      <h3>Recent Events:</h3>
      {events.map((event, index) => (
        <div key={index}>
          {event.section}.{event.method}: {event.data}
        </div>
      ))}
    </div>
  );
}
```

## Configuration

The context automatically connects to the Asset Hub network using the endpoint defined in `constants.js`:

```javascript
// constants.js
export const ASSET_HUB_WS = "wss://westend-asset-hub-rpc.polkadot.io:443";
```

To change the network, update this constant.

## Error Handling

The context handles connection errors gracefully:

- **Connection failures**: Stored in the `error` property
- **Disconnections**: Automatically detected and `isConnected` becomes false
- **Reconnection**: The context doesn't auto-reconnect, but you can call `connectApi()` manually

## Best Practices

1. **Always check `isConnected`** before using the API
2. **Use `ensureApi()`** for critical operations that need guaranteed connection
3. **Handle errors gracefully** in your components
4. **Subscribe to events carefully** - always clean up subscriptions in useEffect cleanup
5. **Don't create multiple API instances** - use the context instead

## Example: Complete Component

```jsx
import React, { useState, useEffect } from 'react';
import { usePolkadotApi } from '../contexts/PolkadotApiContext.jsx';

function ChainExplorer() {
  const { api, isConnected, isConnecting, error, chainInfo, ensureApi } = usePolkadotApi();
  const [latestBlock, setLatestBlock] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchLatestBlock = async () => {
    setLoading(true);
    try {
      const apiInstance = await ensureApi();
      const hash = await apiInstance.rpc.chain.getBlockHash();
      const block = await apiInstance.rpc.chain.getBlock(hash);
      setLatestBlock({
        hash: hash.toString(),
        number: block.block.header.number.toString(),
        extrinsicsCount: block.block.extrinsics.length
      });
    } catch (err) {
      console.error('Failed to fetch block:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected) {
      fetchLatestBlock();
    }
  }, [isConnected]);

  if (isConnecting) {
    return <div>🔄 Connecting to {chainInfo?.chain || 'blockchain'}...</div>;
  }

  if (error) {
    return <div>❌ Connection failed: {error}</div>;
  }

  return (
    <div>
      <h2>Chain Explorer</h2>
      
      {chainInfo && (
        <div>
          <p>Chain: {chainInfo.chain}</p>
          <p>Node: {chainInfo.nodeName} v{chainInfo.nodeVersion}</p>
        </div>
      )}

      <button onClick={fetchLatestBlock} disabled={loading || !isConnected}>
        {loading ? '🔄 Loading...' : '🔍 Fetch Latest Block'}
      </button>

      {latestBlock && (
        <div>
          <h3>Latest Block</h3>
          <p>Number: #{latestBlock.number}</p>
          <p>Hash: {latestBlock.hash}</p>
          <p>Extrinsics: {latestBlock.extrinsicsCount}</p>
        </div>
      )}
    </div>
  );
}

export default ChainExplorer;
```

This context makes it incredibly easy to add blockchain functionality to any component in your app!