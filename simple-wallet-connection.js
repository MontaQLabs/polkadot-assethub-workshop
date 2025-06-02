import {
  web3Accounts,
  web3Enable
} from "@polkadot/extension-dapp";

export async function simpleWalletConnection() {
  const extensions = await web3Enable("Asset Hub Workshop");

  if (extensions.length === 0) {
    return;
  }

  const accounts = await web3Accounts();

  return accounts;
}
