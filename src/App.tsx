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
  const [docHandle] = useState(() => {
    const docHandle = repo.create<DocType>();
    docHandle.change((doc) => {
      doc.content = "";
    });
    docHandle.on("change", ({ doc }) => {
      console.log("doc", doc);
    });
    return docHandle;
  });

  return <Editor docHandle={docHandle} />;
}

export default App;
