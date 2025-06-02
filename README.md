# Polkadot Simple Connection Demo

A React application that demonstrates connecting to the Polkadot Paseo testnet and retrieving basic chain information using the `@polkadot/api` library.

## Features

- 🔗 Connect to Paseo testnet via WebSocket
- 📊 Display chain information (name, node, version)
- 🎨 Modern, responsive UI with glassmorphism design
- ⚡ Built with React and Vite for fast development
- 🔄 Real-time connection status and error handling

## What it does

The application showcases the `simple-connection.js` functionality which:
1. Establishes a WebSocket connection to the Paseo testnet
2. Creates a Polkadot API instance
3. Retrieves chain metadata including:
   - Chain name
   - Node name  
   - Node version
4. Displays the information in a beautiful, user-friendly interface

## Installation

First, install the dependencies:

```bash
npm install
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Building for Production

Build the application:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## File Structure

```
core/
├── src/
│   ├── App.jsx          # Main React component
│   ├── main.jsx         # React entry point
│   └── index.css        # Styling
├── simple-connection.js  # Core Polkadot connection logic
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
└── package.json         # Dependencies and scripts
```

## Core Functionality

The `simple-connection.js` file contains the main connection logic:

```javascript
import { ApiPromise, WsProvider } from '@polkadot/api';

export async function simpleConnection() {
    const provider = new WsProvider("wss://paseo.rpc.amforc.com:443")
    const api = await ApiPromise.create({ provider });
    
    const [chain, nodeName, nodeVersion] = await Promise.all([
        api.rpc.system.chain(),
        api.rpc.system.name(),
        api.rpc.system.version()
    ]);
    
    console.log(`You are connected to chain ${chain.toString()} using ${nodeName.toString()} v${nodeVersion.toString()}`);
}
```

## Technologies Used

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **@polkadot/api** - Polkadot blockchain interaction
- **CSS3** - Modern styling with glassmorphism effects

## Network Information

- **Network**: Paseo Testnet
- **Endpoint**: `wss://paseo.rpc.amforc.com:443`
- **Type**: WebSocket connection

## Usage

1. Open the application in your browser
2. Click the "Connect to Paseo" button
3. Wait for the connection to establish
4. View the retrieved chain information

The app will display:
- Connection endpoint
- Chain name
- Node name and version
- Connection timestamp

## Error Handling

The application includes comprehensive error handling for:
- Network connectivity issues
- WebSocket connection failures
- API initialization problems
- Timeout scenarios

## License

ISC 