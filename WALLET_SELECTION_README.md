# Wallet Selection Component for Polkadot dApps

A comprehensive React component for wallet selection and account management in Polkadot ecosystem dApps.

## 🌟 Features

- **Multi-wallet Support**: Compatible with Polkadot.js, Talisman, SubWallet, and other browser extension wallets
- **Account Selection**: Users can choose which specific account they want to use for transactions
- **Visual Feedback**: Clear indication of selected account with beautiful UI
- **Signer Integration**: Automatically prepares signers for transaction signing
- **Error Handling**: Comprehensive error messages and user guidance
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Glassmorphism design that matches your dApp's aesthetic

## 📦 Installation

The component is already included in this project. No additional installation required.

**Dependencies used:**
- `@polkadot/extension-dapp` - For wallet extension interaction
- `React` - Component framework

## 🚀 Quick Start

### 1. Basic Usage

```jsx
import React, { useState } from 'react';
import WalletSelection from './wallet-selection.jsx';

function MyDApp() {
  const [selectedAccount, setSelectedAccount] = useState(null);

  const handleAccountSelect = (accountData) => {
    setSelectedAccount(accountData);
    console.log('Selected account:', accountData);
  };

  return (
    <div>
      <WalletSelection 
        onAccountSelect={handleAccountSelect}
        selectedAccount={selectedAccount}
      />
      
      {selectedAccount && (
        <p>Using account: {selectedAccount.account.meta.name}</p>
      )}
    </div>
  );
}
```

### 2. Using with Transactions

```jsx
const signTransaction = async () => {
  if (!selectedAccount) {
    alert('Please select an account first');
    return;
  }

  try {
    // Create your transaction
    const tx = api.tx.balances.transfer(recipient, amount);
    
    // Sign and send using the selected account
    await tx.signAndSend(
      selectedAccount.account.address, 
      { signer: selectedAccount.signer }
    );
    
    console.log('Transaction sent successfully!');
  } catch (error) {
    console.error('Transaction failed:', error);
  }
};
```

## 📋 API Reference

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onAccountSelect` | `function` | Yes | Callback function called when user selects an account |
| `selectedAccount` | `object \| null` | Yes | Currently selected account data |

### Account Data Structure

When an account is selected, the `onAccountSelect` callback receives an object with:

```typescript
{
  account: {
    address: string,           // Account address
    meta: {
      name: string,           // Account name
      source: string,         // Wallet extension name
      genesisHash?: string    // Optional genesis hash
    }
  },
  injector: Injector,         // Polkadot extension injector
  signer: Signer             // Signer instance for transactions
}
```

## 🎨 Styling

The component uses CSS classes that follow the existing glassmorphism theme:

- `.wallet-selection` - Main container
- `.account-card` - Individual account cards
- `.selected` - Applied to selected account card
- `.connect-button` - Wallet connection button

All styles are included in the main CSS file and follow the design system.

## 🔧 Customization

### Custom Styling

You can override the default styles by targeting the CSS classes:

```css
.wallet-selection {
  /* Your custom styles */
}

.account-card.selected {
  /* Custom selected account styling */
}
```

### Custom Account Display

The component automatically formats account addresses and displays account names. The address is truncated for better readability.

## 🌐 Supported Wallets

The component automatically detects and works with:

- **Polkadot.js Extension** - Official Polkadot browser extension
- **Talisman** - Multi-chain wallet with beautiful UI
- **SubWallet** - Comprehensive Substrate wallet
- **Other Polkadot-compatible wallets** - Any wallet implementing the standard interface

## 🔍 Error Handling

The component handles various error scenarios:

- **No Extension Installed**: Shows helpful links to install wallet extensions
- **No Accounts Available**: Guides users to create accounts in their wallet
- **Connection Failures**: Displays specific error messages
- **Account Setup Issues**: Handles signer preparation failures

## 📱 Mobile Support

The component is fully responsive and includes:

- Touch-friendly interface
- Optimized layout for small screens
- Readable text and buttons on mobile
- Proper spacing and interaction areas

## 🛠️ Development

### Testing the Component

1. Install a Polkadot wallet extension (Polkadot.js or Talisman)
2. Create or import accounts in your wallet
3. Run the development server: `npm run dev`
4. Test the wallet connection and account selection

### Demo Component

A complete demo is available in `wallet-selection-demo.jsx` that shows:

- How to integrate the component
- Account selection workflow
- Transaction simulation
- Integration patterns

## 🔐 Security Considerations

- The component never stores private keys or sensitive data
- All cryptographic operations are handled by the wallet extensions
- Account data is only kept in component state
- Signers are provided by the trusted wallet extensions

## 🤝 Integration Examples

### With Polkadot API

```jsx
import { ApiPromise, WsProvider } from '@polkadot/api';

const MyDApp = () => {
  const [api, setApi] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);

  useEffect(() => {
    const initApi = async () => {
      const provider = new WsProvider('wss://rpc.polkadot.io');
      const apiInstance = await ApiPromise.create({ provider });
      setApi(apiInstance);
    };
    initApi();
  }, []);

  const transfer = async (to, amount) => {
    if (!api || !selectedAccount) return;
    
    const tx = api.tx.balances.transfer(to, amount);
    await tx.signAndSend(
      selectedAccount.account.address,
      { signer: selectedAccount.signer }
    );
  };

  return (
    <div>
      <WalletSelection 
        onAccountSelect={setSelectedAccount}
        selectedAccount={selectedAccount}
      />
      {/* Your dApp UI */}
    </div>
  );
};
```

### State Management

For larger applications, consider using state management solutions:

```jsx
// With Context API
const WalletContext = createContext();

// With Redux/Zustand
const useWalletStore = create((set) => ({
  selectedAccount: null,
  setSelectedAccount: (account) => set({ selectedAccount: account }),
}));
```

## 📚 Additional Resources

- [Polkadot.js Extension Documentation](https://polkadot.js.org/docs/extension/)
- [Polkadot API Documentation](https://polkadot.js.org/docs/api/)
- [Substrate Connect](https://substrate.io/developers/substrate-connect/)

## 🐛 Troubleshooting

### Common Issues

1. **"No wallet extensions found"**
   - Ensure wallet extension is installed and enabled
   - Refresh the page after installing the extension

2. **"No accounts available"**
   - Create accounts in your wallet extension
   - Make sure accounts are not hidden/locked

3. **Transaction signing fails**
   - Check if the account has sufficient balance
   - Ensure the correct network is selected in the wallet

### Debug Mode

Enable console logging to debug issues:

```javascript
console.log('Selected account:', selectedAccount);
console.log('Available extensions:', extensions);
```

## 📄 License

This component is part of the Asset Hub Workshop project and follows the same license terms.

## 🤔 Need Help?

If you encounter issues or need assistance:

1. Check the console for error messages
2. Verify wallet extension installation
3. Ensure accounts are properly set up
4. Review the integration examples above

The component is designed to be plug-and-play for most Polkadot dApp use cases while remaining flexible for custom requirements. 