import { ApiPromise, WsProvider } from "@polkadot/api";
import { PASSET_HUB_WS } from "./constants.js";

export const endpoint = PASSET_HUB_WS;

export async function simpleConnection() {
  const provider = new WsProvider(endpoint);

  const api = await ApiPromise.create({ provider });

  const [chain, nodeName, noeVersion] = await Promise.all([
    api.rpc.system.chain(),
    api.rpc.system.name(),
    api.rpc.system.version(),
  ]);

  return { chain, nodeName, noeVersion };
}
