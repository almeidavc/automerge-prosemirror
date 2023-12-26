import { Editor } from "./Editor.tsx";
import {
  Repo,
  isValidAutomergeUrl,
  DocHandle,
} from "@automerge/automerge-repo";
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel";

export interface DocType {
  text: string;
}

function initRepo() {
  return new Repo({
    network: [new BroadcastChannelNetworkAdapter()],
    storage: new IndexedDBStorageAdapter(),
  });
}

function App() {
  const url = new URL(window.location.href);
  const documentUrl = url.searchParams.get("document");

  const [loading, setLoading] = useState(true);

  const [repo] = useState(initRepo);
  const [docHandle, setDocHandle] = useState<DocHandle<DocType>>();

  useEffect(() => {
    let docHandle: DocHandle<DocType>;
    let created = false;

    if (isValidAutomergeUrl(documentUrl)) {
      docHandle = repo.find<DocType>(documentUrl);
    } else {
      docHandle = repo.create<DocType>();
      created = true;
    }

    setDocHandle(docHandle);

    docHandle.whenReady().then(() => {
      if (created) {
        docHandle.change((doc) => {
          doc.text = "";
        });
      }
      setLoading(false);
    });

    if (created) {
      url.searchParams.set("document", docHandle.url);
      history.replaceState({}, "", url.href);
    }
  }, []);

  if (loading || !docHandle) {
    return (
      <div
        style={{
          marginTop: 256,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </div>
    );
  }

  return (
    <div style={{ margin: 32 }}>
      <Editor
        key={docHandle.url}
        docHandle={docHandle}
        path={["text"]}
        sync={{
          subscribeToChanges: (handler) => {
            docHandle.on("change", handler);
          },
          unsubscribe: (handler) => {
            docHandle?.removeListener("change", handler);
          },
        }}
      />
    </div>
  );
}

export default App;
