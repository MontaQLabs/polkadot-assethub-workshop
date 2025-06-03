# Asset Hub Workshop - Polkadot Blockchain Integration

A simple React application demonstrating blockchain interactions with Polkadot's Asset Hub. This workshop showcases essential blockchain development patterns including network connections, wallet integrations, and smart contract interactions.

## 🎯 What This Project Demonstrates

This application is a complete tutorial for building blockchain dApps on Polkadot, featuring:

- **🔗 Network Connection**: Connect to Polkadot Asset Hub testnet and retrieve chain information
- **👛 Wallet Integration**: Connect and manage Polkadot wallet extensions (Polkadot.js, Talisman, etc.)
- **📱 Smart Contracts**: Interact with EVM-compatible smart contracts on Asset Hub

## 🏗️ Project Structure

```
asset-hub-hackathon-workshop/
├── 📁 src/                          # Frontend React application
│   ├── 📁 components/               # Reusable UI components
│   │   └── TabNavigation.jsx        # Navigation tabs component
│   ├── 📁 pages/                    # Application pages/routes
│   │   ├── SimpleConnection.jsx     # Network connection demo page
│   │   ├── WalletSelection.jsx      # Wallet management page
│   │   └── SmartContracts.jsx       # Smart contract interaction page
│   ├── App.jsx                      # Main React app with routing
│   ├── main.jsx                     # React entry point
│   └── index.css                    # Global styles and UI design
├── 📁 Core Blockchain Files
│   ├── simple-connection.js         # Basic Polkadot network connection
│   ├── simple-wallet-connection.js  # Wallet extension integration
│   ├── simple-contract-calls.js     # Smart contract interaction logic
│   ├── wallet-selection.jsx         # Advanced wallet selection component
│   ├── ethersProvider.js           # Ethereum provider setup
│   └── constants.js                # Network endpoints and configurations
├── 📁 Configuration Files
│   ├── package.json                # Dependencies and scripts
│   ├── vite.config.js              # Vite build configuration
│   ├── index.html                  # HTML template
│   └── .gitignore                  # Git ignore rules
└── README.md                       # This documentation
```

### 📂 Directory Explanations

- **`src/`**: Contains the React frontend application with modern UI components
- **`src/components/`**: Reusable UI components that can be used across multiple pages
- **`src/pages/`**: Individual application pages corresponding to different workshop sections
- **Root JavaScript files**: Core blockchain integration modules that can be imported and used independently

## 🚀 Quick Start Guide (From Empty Folder)

Follow these steps to build this exact project from scratch:

### Step 1: Initialize the Project

```bash
# Create a new directory and navigate into it
mkdir asset-hub-workshop
cd asset-hub-workshop

# Initialize a new Node.js project
npm init -y

# Set up as ES6 module
npm pkg set type=module
```

### Step 2: Install Dependencies

```bash
# Install React and build tools
npm install react@^18.2.0 react-dom@^18.2.0
npm install vite@^5.0.8 @vitejs/plugin-react@^4.2.1 --save-dev

# Install Polkadot blockchain libraries
npm install @polkadot/api@^16.1.1 @polkadot/extension-dapp@^0.52.3

# Install Ethereum compatibility
npm install ethers@^6.14.3

# Install UI and routing libraries
npm install react-router-dom@^7.6.1 lucide-react@^0.511.0

# Install TypeScript types (optional but recommended)
npm install @types/react@^18.2.43 @types/react-dom@^18.2.17 --save-dev
```

### Step 3: Create Project Structure

```bash
# Create directory structure
mkdir src src/components src/pages

# Create core files
touch index.html vite.config.js
touch constants.js simple-connection.js simple-wallet-connection.js
touch simple-contract-calls.js wallet-selection.jsx ethersProvider.js
touch src/App.jsx src/main.jsx src/index.css
touch src/components/TabNavigation.jsx
touch src/pages/SimpleConnection.jsx src/pages/WalletSelection.jsx src/pages/SmartContracts.jsx
```

### Step 4: Configure Build Tools

Create `vite.config.js`:
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})
```

Create `index.html`:
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Asset Hub Workshop</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### Step 5: Update Package.json Scripts

Add these scripts to your `package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build", 
    "preview": "vite preview"
  }
}
```

### Step 6: Copy Source Code

Copy all the source code files from this repository into your project structure. The core files you'll need to implement are detailed in the sections below.

### Step 7: Run the Application

```bash
# Start development server
npm run dev

# Open browser to http://localhost:3000
```

## 🔧 Core Blockchain Modules Explained

### 1. `simple-connection.js` - Basic Network Connection

This module demonstrates the fundamental pattern for connecting to any Polkadot network:

```javascript
import { ApiPromise, WsProvider } from "@polkadot/api";
import { PASSET_HUB_WS } from "./constants.js";

export async function simpleConnection() {
  // Create WebSocket provider pointing to Asset Hub
  const provider = new WsProvider(PASSET_HUB_WS);
  
  // Create API instance
  const api = await ApiPromise.create({ provider });
  
  // Fetch basic chain information
  const [chain, nodeName, nodeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(), 
    api.rpc.system.version(),
  ]);
  
  return { chain, nodeName, nodeVersion };
}
```

**What it does:**
- Establishes WebSocket connection to Asset Hub testnet
- Creates a Polkadot API instance for blockchain interactions
- Retrieves basic chain metadata (name, node type, version)
- Provides foundation for all other blockchain operations

**When to use:** This is your starting point for any Polkadot blockchain interaction.

### 2. `simple-wallet-connection.js` - Wallet Extension Integration

This module handles connection to browser wallet extensions:

```javascript
import { web3Accounts, web3Enable } from "@polkadot/extension-dapp";

export async function simpleWalletConnection() {
  // Enable wallet extensions for this dApp
  const extensions = await web3Enable("Asset Hub Workshop");
  
  if (extensions.length === 0) {
    throw new Error("No wallet extensions found");
  }
  
  // Get all available accounts from all extensions
  const accounts = await web3Accounts();
  
  return accounts;
}
```

**What it does:**
- Detects and connects to installed Polkadot wallet extensions (Polkadot.js, Talisman, etc.)
- Requests permission to access wallet accounts
- Returns list of available accounts across all connected wallets
- Enables account-based operations like signing transactions

**When to use:** When you need to access user accounts for signing transactions or identity verification.

### 3. `simple-contract-calls.js` - Smart Contract Interactions

This module demonstrates EVM smart contract interactions on Asset Hub:

```javascript
import { ethers } from 'ethers';
import { PASSET_HUB_RPC, Storage_ABI } from './constants.js';

export async function callRetrieve(contractAddress) {
  // Create provider for Asset Hub's EVM compatibility layer
  const provider = new ethers.JsonRpcProvider(PASSET_HUB_RPC);
  
  // Create contract interface
  const contract = new ethers.Contract(contractAddress, Storage_ABI, provider);
  
  // Call read-only function (no gas required)
  const storedValue = await contract.retrieve();
  
  return {
    contractAddress,
    storedValue: storedValue.toString(),
    networkInfo: { rpcUrl: PASSET_HUB_RPC, chainName: "PASSET Hub" }
  };
}

export async function storeValue(contractAddress, valueToStore, signer) {
  // Create contract with signer for transactions
  const contract = new ethers.Contract(contractAddress, Storage_ABI, signer);
  
  // Send transaction (requires gas and signing)
  const tx = await contract.store(valueToStore);
  const receipt = await tx.wait();
  
  return {
    transactionHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString()
  };
}
```

**What it does:**
- Connects to Asset Hub's EVM-compatible layer using Ethereum tools
- Demonstrates both read operations (no gas) and write operations (requires gas)
- Interacts with a simple Storage smart contract that stores/retrieves numbers
- Provides comprehensive error handling for common issues

**When to use:** When building dApps that need to interact with smart contracts deployed on Asset Hub.

### 4. `wallet-selection.jsx` - Advanced Wallet Management

This React component provides a complete wallet management interface:

```javascript
export default function WalletSelection({ onAccountSelect, selectedAccount }) {
  // Component handles:
  // - Detecting and connecting to wallet extensions
  // - Displaying available accounts in a user-friendly interface  
  // - Account selection and management
  // - Integration with signing capabilities
  // - Connection status and error handling
}
```

**What it does:**
- Provides polished UI for wallet connection and account selection
- Manages connection state and error handling
- Integrates with both Polkadot and Ethereum signing capabilities
- Displays account information in a user-friendly format
- Handles multiple wallet extensions simultaneously

**When to use:** When you need a production-ready wallet interface for your dApp.

## 🌐 Network Configuration

The application is configured to work with Polkadot testnets:

- **Asset Hub Testnet (WebSocket)**: `wss://testnet-passet-hub.polkadot.io`
- **Asset Hub Testnet (HTTP/EVM)**: `https://testnet-passet-hub-eth-rpc.polkadot.io/`
- **Test Tokens**: PAS (Paseo) with 10^10 decimals
- **Smart Contract**: Simple Storage contract for testing

## 🛠️ Available Scripts

```bash
npm run dev     # Start development server (http://localhost:3000)
npm run build   # Build for production
npm run preview # Preview production build locally
```

## 🎨 Features Showcase

### Tab Navigation
- **Simple Connection**: Demonstrates basic blockchain connection and chain info retrieval
- **Wallet Selection**: Complete wallet management interface with account selection
- **Smart Contracts**: Interactive smart contract calls with both read and write operations

### Modern UI/UX
- Glassmorphism design with blur effects and transparency
- Responsive layout that works on desktop and mobile
- Loading states and comprehensive error handling
- Real-time connection status indicators

### Blockchain Integration Patterns
- WebSocket connections for real-time blockchain data
- Wallet extension integration with multiple provider support
- EVM smart contract interactions using ethers.js
- Transaction signing and gas management

## 🧪 Testing the Application

1. **Install a Polkadot Wallet**: Get Polkadot.js extension or Talisman
2. **Get Test Tokens**: Use a faucet to get PAS tokens for the Paseo testnet
3. **Test Each Feature**:
   - Simple Connection: View chain information
   - Wallet Selection: Connect and select accounts
   - Smart Contracts: Read from and write to the storage contract

## 🚀 Next Steps & Extensions

This workshop provides a foundation for building more complex dApps:

- **Add NFT interactions**: Extend to work with NFT collections on Asset Hub
- **Implement cross-chain transfers**: Use XCM for multi-chain operations  
- **Add more smart contracts**: Deploy and interact with custom contracts
- **Enhanced UI**: Add charts, dashboards, and advanced visualizations
- **Mainnet deployment**: Configure for production Polkadot networks

## 📚 Learning Resources

- [Polkadot.js API Documentation](https://polkadot.js.org/docs/)
- [Asset Hub Documentation](https://wiki.polkadot.network/docs/learn-assets)
- [Polkadot Extension Integration](https://polkadot.js.org/docs/extension)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Comprehensive Endpoint List](https://polkadot.js.org/docs/substrate)
- [An Easier Way to Query On-chain Data](https://polkadot.js.org/docs/derives/)

## 🤝 Contributing

This project is designed for educational purposes. Feel free to:
- Add new blockchain interaction patterns
- Improve the UI/UX design
- Add support for additional networks
- Create additional workshop modules

## 📄 License

ISC License - Free for educational and commercial use. 