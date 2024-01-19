import { Repo } from "@automerge/automerge-repo";
// import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb";
import { useState } from "react";
import { Publisher } from "./PubSub.ts";
import { next as Automerge } from "@automerge/automerge";
import { ChangeQueue } from "./ChangeQueue.ts";
import { DocType } from "../App.tsx";
import { EditorDemo } from "./EditorDemo.tsx";
import { initDoc } from "../integration/initDoc.ts";

function initRepo() {
  return new Repo({
    network: [],
    // storage: new IndexedDBStorageAdapter(),
  });
}

function Demo() {
  const [repo] = useState(initRepo);

  const [publisher] = useState(() => new Publisher<Automerge.Change[]>());
  const [queue1] = useState(new ChangeQueue());
  const [queue2] = useState(new ChangeQueue());

  const [doc1Handle] = useState(() => {
    const docHandle = repo.create<DocType>();
    initDoc(docHandle);
    return docHandle;
  });

  const [doc2Handle] = useState(() => {
    const docHandle = repo.create<DocType>();
    docHandle.merge(doc1Handle);
    doc1Handle.merge(docHandle);
    return docHandle;
  });

  const [realtimeOn, setRealtimeOn] = useState(false);

  return (
    <div
      style={{
        width: "90%",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
        }}
      >
        <div style={{ flex: "1 1 0" }}>
          <h3>User 1</h3>
          <EditorDemo
            key={doc1Handle.url}
            docHandle={doc1Handle}
            path={["text"]}
            sync={{
              publishLocalChange: (change) => {
                if (realtimeOn) {
                  publisher.publish("user 1", [change]);
                } else {
                  queue1.enqueue(change);
                }
              },
              subscribeToRemoteChanges: (handler) =>
                publisher.subscribe("user 1", handler),
              unsubscribe: () => publisher.unsubscribe("user 1"),
            }}
          />
        </div>
        <div style={{ flex: "1 1 0" }}>
          <h3>User 2</h3>
          <EditorDemo
            docHandle={doc2Handle}
            path={["text"]}
            sync={{
              publishLocalChange: (change) => {
                if (realtimeOn) {
                  publisher.publish("user 2", [change]);
                } else {
                  queue2.enqueue(change);
                }
              },
              subscribeToRemoteChanges: (handler) =>
                publisher.subscribe("user 2", handler),
              unsubscribe: () => publisher.unsubscribe("user 2"),
            }}
          />
        </div>
      </div>
      <button onClick={() => setRealtimeOn((realtimeOn) => !realtimeOn)}>
        {realtimeOn ? "realtime" : "manual"}
      </button>
      {!realtimeOn && (
        <button
          onClick={() => {
            publisher.publish("user 1", queue1.flush());
            publisher.publish("user 2", queue2.flush());
          }}
        >
          sync
        </button>
      )}
    </div>
  );
}

export default Demo;
