import { Editor } from "./Editor.tsx";
import { Repo } from "@automerge/automerge-repo";
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { useState } from "react";

export interface DocType {
  content: string;
}

function initRepo() {
  return new Repo({
    network: [new BroadcastChannelNetworkAdapter()],
    storage: new IndexedDBStorageAdapter(),
  });
}

function App() {
  const [repo] = useState(initRepo);
  const [docHandle] = useState(() => repo.create<DocType>());

  return <Editor docHandle={docHandle} />;
}

export default App;
