import { ApiPromise, WsProvider } from "@polkadot/api";

export const endpoint = "wss://testnet-passet-hub.polkadot.io";

export async function simpleConnection() {
  const provider = new WsProvider(endpoint);

  const api = await ApiPromise.create({ provider });

  const [chain, nodeName, noeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]);

  console.log(
    `You are connected to chain ${chain.toString()} using ${nodeName.toString()} v${noeVersion.toString()}`
  );
}
