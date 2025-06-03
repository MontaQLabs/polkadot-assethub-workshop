import { ethers } from 'ethers';
import { ASSET_HUB_RPC, Storage_ABI } from './constants.js';

/**
 * Simple function to call a Storage smart contract on Asset Hub
 * This example shows how to read a stored number from a Storage contract
 * 
 * @param {string} contractAddress - The address of the Storage smart contract
 * @returns {Promise<Object>} Contract call results
 */
export async function callRetrieve(contractAddress) {
  try {
    console.log("🔗 Connecting to Asset Hub (Westend)...");
    
    // Step 1: Create a provider to connect to Asset Hub
    // Asset Hub supports EVM, so we can use ethers.js JsonRpcProvider
    const provider = new ethers.JsonRpcProvider(ASSET_HUB_RPC);
    
    console.log("📋 Setting up Storage contract interface...");
    
    // Step 2: Create a contract instance
    // This creates an interface to interact with the Storage smart contract
    const contract = new ethers.Contract(contractAddress, Storage_ABI, provider);
    
    console.log("📞 Making contract call to retrieve stored value...");
    
    // Step 3: Call the retrieve function to get the stored number
    // This is a "view" function that doesn't cost gas and doesn't modify the blockchain
    const storedValue = await contract.retrieve();
    
    // Step 4: Format the results
    // Convert BigInt to string for better handling
    const results = {
      contractAddress,
      storedValue: storedValue.toString(),
      storedValueBigInt: storedValue,
      networkInfo: {
        rpcUrl: ASSET_HUB_RPC,
        chainName: "Asset Hub (Westend)"
      },
      contractType: "Storage Contract",
      functionCalled: "retrieve()"
    };
    
    console.log("✅ Contract call successful!");
    console.log("📊 Results:", results);
    console.log(`🔢 Stored Value: ${storedValue.toString()}`);
    
    return results;
    
  } catch (error) {
    console.error("❌ Error calling Storage contract:", error.message);
    
    // Provide helpful error messages for common issues
    if (error.message.includes("could not detect network")) {
      throw new Error("❌ Unable to connect to Asset Hub. Please check your internet connection.");
    } else if (error.message.includes("call revert")) {
      throw new Error("❌ Contract call failed. The contract address might be invalid or the retrieve function doesn't exist.");
    } else if (error.message.includes("invalid address")) {
      throw new Error("❌ Invalid contract address provided. Please check the contract address format.");
    } else {
      throw new Error(`❌ Storage contract call failed: ${error.message}`);
    }
  }
}


/**
 * Function to store a value in the Storage smart contract
 * This requires a wallet/signer as it sends a transaction that modifies the blockchain
 * 
 * @param {string} contractAddress - The address of the Storage smart contract
 * @param {number|BigInt} valueToStore - The number to store in the contract
 * @param {ethers.Signer} signer - The wallet signer to send the transaction
 * @returns {Promise<Object>} Transaction results
 */
export async function storeValue(contractAddress, valueToStore, signer) {
  try {
    console.log("🔗 Connecting to Asset Hub with signer...");
    
    // Create contract instance with signer for sending transactions
    const contract = new ethers.Contract(contractAddress, Storage_ABI, signer);
    
    console.log(`📝 Storing value: ${valueToStore}...`);
    
    // Call the store function - this will require gas and transaction signing
    const tx = await contract.store(valueToStore);
    console.log("⏳ Transaction sent, waiting for confirmation...");
    console.log(`📋 Transaction Hash: ${tx.hash}`);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    console.log("✅ Value stored successfully!");
    
    const results = {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      storedValue: valueToStore.toString(),
      contractAddress,
      networkInfo: {
        rpcUrl: ASSET_HUB_RPC,
        chainName: "Asset Hub (Westend)"
      }
    };
    
    console.log("📊 Store Results:", results);
    
    return results;
    
  } catch (error) {
    console.error("❌ Error storing value:", error.message);
    
    // Provide helpful error messages for common issues
    if (error.message.includes("insufficient funds")) {
      throw new Error("❌ Insufficient funds for gas fees. Please add tokens to your wallet.");
    } else if (error.message.includes("user rejected")) {
      throw new Error("❌ Transaction was rejected by user.");
    } else if (error.message.includes("nonce too low")) {
      throw new Error("❌ Transaction nonce error. Please try again.");
    } else {
      throw new Error(`❌ Store transaction failed: ${error.message}`);
    }
  }
}

/**
 * Complete example that demonstrates both storing and retrieving values
 * This shows the full lifecycle: store a value, then read it back
 * 
 * @param {string} contractAddress - The address of the Storage smart contract
 * @param {number} valueToStore - The number to store
 * @param {ethers.Signer} signer - The wallet signer (optional, only needed for storing)
 * @returns {Promise<Object>} Complete operation results
 */
export async function completeStorageExample(contractAddress, valueToStore, signer = null) {
  console.log("🚀 Starting complete Storage contract example...");
  
  const results = {
    initialValue: null,
    storeResult: null,
    finalValue: null
  };
  
  try {
    // Step 1: Read initial value
    console.log("\n📖 Step 1: Reading initial stored value...");
    const initialResult = await callSmartContract(contractAddress);
    results.initialValue = initialResult.storedValue;
    console.log(`Initial stored value: ${results.initialValue}`);
    
    // Step 2: Store new value (only if signer is provided)
    if (signer && valueToStore !== undefined) {
      console.log(`\n💾 Step 2: Storing new value: ${valueToStore}...`);
      const storeResult = await storeValue(contractAddress, valueToStore, signer);
      results.storeResult = storeResult;
      console.log("✅ Value stored successfully!");
      
      // Step 3: Read the updated value
      console.log("\n📖 Step 3: Reading updated stored value...");
      const finalResult = await callSmartContract(contractAddress);
      results.finalValue = finalResult.storedValue;
      console.log(`Final stored value: ${results.finalValue}`);
      
      // Verify the change
      if (results.finalValue === valueToStore.toString()) {
        console.log("🎉 Success! The stored value matches what we stored.");
      } else {
        console.log("⚠️ Note: The stored value might not have updated yet or there was an issue.");
      }
    } else {
      console.log("\n⚠️ Skipping store operation - no signer provided or no value specified");
      console.log("💡 To store values, provide both a signer and valueToStore parameters");
    }
    
    return results;
    
  } catch (error) {
    console.error("❌ Complete storage example failed:", error.message);
    throw error;
  }
}

// Export the RPC endpoint and ABI for advanced users
export { Storage_ABI, ASSET_HUB_RPC };
