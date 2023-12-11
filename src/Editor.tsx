import { useEffect, useRef } from "react";
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";
import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "./App.tsx";
import { automergePlugin, getLastHeads } from "./integration/plugin.ts";
import { next as Automerge } from "@automerge/automerge";
import { applyChangesToAm } from "./integration/applyChangesToAm.ts";
import { replicatePatchesToPm } from "./integration/replicatePatchesToPm.ts";

export const EditorSchema = schema;

interface EditorProps {
  docHandle: DocHandle<DocType>;
}

export function Editor({ docHandle }: EditorProps) {
  const mountTargetRef = useRef(null);

  useEffect(() => {
    const doc = docHandle.docSync();
    // TODO: handle loading, error states
    if (!doc) {
      throw Error("doc is not ready");
    }

    const plugin = automergePlugin(doc);
    const view = new EditorView(mountTargetRef.current, {
      state: EditorState.create({
        schema: EditorSchema,
        plugins: [...exampleSetup({ schema: EditorSchema }), plugin],
      }),
      dispatchTransaction(transaction) {
        const state = view.state;
        const lastHeads = getLastHeads(plugin, state);

        if (transaction.docChanged) {
          const newHeads = applyChangesToAm(
            docHandle,
            lastHeads,
            state,
            transaction,
          );
          const diff = Automerge.diff(doc, lastHeads, newHeads);
          const reconcileTransaction = replicatePatchesToPm(state, diff);

          // update heads
          reconcileTransaction.setMeta("newHeads", newHeads);

          const newState = state.apply(reconcileTransaction);
          view.updateState(newState);
        } else {
          const newState = state.apply(transaction);
          view.updateState(newState);
        }
      },
    });

    return () => {
      view.destroy();
    };
  }, [docHandle]);

  return (
    <div
      ref={mountTargetRef}
      // "editor" id is required so that styles are applied properly
      id={"editor"}
      // disable "Enter" key as it creates a new paragraph node and blocks are not yet supported
      onKeyDownCapture={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
        }
      }}
    />
  );
}
