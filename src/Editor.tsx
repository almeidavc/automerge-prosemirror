import { useEffect, useRef } from "react";
import { schema } from "prosemirror-schema-basic";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";
import { DocHandle, DocHandleChangePayload } from "@automerge/automerge-repo";
import { DocType } from "./App.tsx";
import {
  AutomergePlugin,
  automergePlugin,
  getLastHeads,
} from "./integration/plugin.ts";
import { next as Automerge } from "@automerge/automerge";
import { applyChangesToAm } from "./integration/applyChangesToAm.ts";
import { reconcilePmEditor } from "./integration/reconcilePmEditor.ts";

export const EditorSchema = schema;

interface EditorProps {
  docHandle: DocHandle<DocType>;
  path: Automerge.Prop[];
  sync: {
    subscribeToChanges: (
      handler: (payload: DocHandleChangePayload<DocType>) => void,
    ) => void;
    unsubscribe: (
      handler: (payload: DocHandleChangePayload<DocType>) => void,
    ) => void;
  };
}

// assumes the doc is ready
export function Editor({ docHandle, path, sync }: EditorProps) {
  const mountTargetRef = useRef<HTMLDivElement>(null);

  const editorViewRef = useRef<EditorView | null>(null);
  const editorPluginRef = useRef<AutomergePlugin | null>(null);

  useEffect(() => {
    const doc = docHandle.docSync();
    if (!doc) {
      throw Error("doc is not ready");
    }

    const plugin = automergePlugin(doc);
    const view = new EditorView(mountTargetRef.current, {
      state: EditorState.create({
        schema: EditorSchema,
        plugins: [...exampleSetup({ schema: EditorSchema }), plugin],
      }),
      dispatchTransaction(transaction: Transaction) {
        const doc = docHandle.docSync();
        const view = editorViewRef.current;
        const plugin = editorPluginRef.current;

        if (!doc || !view || !plugin) {
          return;
        }

        if (transaction.docChanged) {
          console.group();
          console.log("transaction", transaction);

          const lastHeads = getLastHeads(plugin, view.state);
          applyChangesToAm(docHandle, path, lastHeads, transaction);

          console.groupEnd();
        } else {
          const newState = view.state.apply(transaction);
          view.updateState(newState);
        }
      },
    });

    editorPluginRef.current = plugin;
    editorViewRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  useEffect(() => {
    const handler = (payload: DocHandleChangePayload<DocType>) => {
      const view = editorViewRef.current;
      const plugin = editorPluginRef.current;

      if (!view || !plugin) {
        return;
      }

      const patches = payload.patches;
      const newHeads = Automerge.getHeads(payload.doc);

      console.log("marks", Automerge.marks(payload.doc, path.slice()));
      console.log("patches", patches);

      reconcilePmEditor(view, view.state, patches, newHeads);
    };

    sync.subscribeToChanges(handler);

    return () => {
      sync.unsubscribe(handler);
    };
  }, [sync.subscribeToChanges]);

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
