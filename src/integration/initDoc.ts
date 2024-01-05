import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "../App.tsx";
import { next as Automerge } from "@automerge/automerge";

export function initDoc(docHandle: DocHandle<DocType>) {
  docHandle.change((doc) => {
    doc.text = "";
    Automerge.splitBlock(doc, ["text"], 0, {
      type: new Automerge.RawString("p"),
    });
  });
}
