import { useEffect, useRef } from "react";
import { schema } from "prosemirror-schema-basic";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";
import { DocHandle } from "@automerge/automerge-repo";
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
  sync?: {
    publishLocalChange: (change: Automerge.Change) => void;
    subscribeToRemoteChanges: (
      handler: (changes: Automerge.Change[]) => void,
    ) => void;
    unsubscribe: () => void;
  };
}

export function Editor({ docHandle, sync }: EditorProps) {
  const mountTargetRef = useRef<HTMLDivElement>(null);

  const editorViewRef = useRef<EditorView | null>(null);
  const editorPluginRef = useRef<AutomergePlugin | null>(null);

  function dispatchTransaction(onChange?: (change: Automerge.Change) => void) {
    return (transaction: Transaction) => {
      const doc = docHandle.docSync();
      const view = editorViewRef.current;
      const plugin = editorPluginRef.current;

      if (!doc || !view || !plugin) {
        return;
      }

      const lastHeads = getLastHeads(plugin, view.state);

      if (transaction.docChanged) {
        console.group();
        console.log("transaction", transaction);

        const newHeads = applyChangesToAm(docHandle, lastHeads, transaction);
        onChange?.(Automerge.getLastLocalChange(Automerge.view(doc, newHeads)));

        const diff = Automerge.diff(doc, lastHeads, newHeads);
        console.log("patches", diff);

        reconcilePmEditor(view, view.state, diff, newHeads);

        console.groupEnd();
      } else {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
      }
    };
  }

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
      dispatchTransaction: dispatchTransaction(sync?.publishLocalChange),
    });

    editorPluginRef.current = plugin;
    editorViewRef.current = view;

    return () => {
      sync?.unsubscribe();
      view.destroy();
    };
  }, []);

  useEffect(() => {
    if (editorViewRef.current) {
      editorViewRef.current?.setProps({
        dispatchTransaction: dispatchTransaction(sync?.publishLocalChange),
      });
    }
  }, [sync?.publishLocalChange]);

  useEffect(() => {
    sync?.subscribeToRemoteChanges((changes) => {
      const view = editorViewRef.current;
      const plugin = editorPluginRef.current;

      if (!view || !plugin) {
        return;
      }

      docHandle.update((doc) => {
        const [newDoc] = Automerge.applyChanges(doc, changes);

        const lastHeads = getLastHeads(plugin, view.state);
        const newHeads = Automerge.getHeads(newDoc);

        const patches = Automerge.diff(newDoc, lastHeads, newHeads);
        console.log("syncing... patches", patches);

        reconcilePmEditor(view, view.state, patches, newHeads);

        return newDoc;
      });
    });

    return () => {
      sync?.unsubscribe();
    };
  }, [sync?.subscribeToRemoteChanges]);

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
