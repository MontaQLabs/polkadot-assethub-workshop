import { useState } from "react";
import { usePolkadotApi } from "../../contexts/PolkadotApiContext.jsx";

export default function NextAvailableId() {
  const { api, isConnected, ensureApi } = usePolkadotApi();
  const [nextId, setNextId] = useState(null);

  const nextAvailableId = async () => {
    if (!isConnected || !api) {
      return;
    }

    const apiInstance = await ensureApi();
    const nextId = await apiInstance.query.assets.nextAssetId();
    setNextId(nextId.toString());
  };

  return (
    <div className="flex flex-col justify-start items-start">
      <button className="bg-white text-black" onClick={nextAvailableId}>Next Available ID</button>
      {nextId && <p className="text-white">Next Available ID: {nextId}</p>}
    </div>
  );
}