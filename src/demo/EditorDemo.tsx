import { useEffect, useRef } from "react";
import { schema } from "prosemirror-schema-basic";
import { EditorState, Transaction } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";
import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "../App.tsx";
import {
  AutomergePlugin,
  automergePlugin,
  getLastHeads,
  getLastSpans,
} from "../integration/plugin.ts";
import { next as Automerge } from "@automerge/automerge";
import { applyChangesToAm } from "../integration/applyChangesToAm.ts";
import { reconcilePmEditor } from "../integration/reconcilePmEditor.ts";

export const EditorSchema = schema;

interface EditorDemoProps {
  docHandle: DocHandle<DocType>;
  path: Automerge.Prop[];
  sync?: {
    publishLocalChange?: (change: Automerge.Change) => void;
    subscribeToRemoteChanges: (
      handler: (changes: Automerge.Change[]) => void,
    ) => void;
    unsubscribe: () => void;
  };
}

// assumes the doc is ready
export function EditorDemo({ docHandle, path, sync }: EditorDemoProps) {
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

      if (transaction.docChanged) {
        console.group();
        console.log("transaction", transaction);

        const lastHeads = getLastHeads(plugin, view.state);
        const newHeads = applyChangesToAm(
          docHandle,
          path,
          lastHeads,
          transaction,
        );

        if (newHeads !== lastHeads) {
          onChange?.(
            Automerge.getLastLocalChange(Automerge.view(doc, newHeads)),
          );
          const diff = Automerge.diff(doc, lastHeads, newHeads);
          const newDoc = docHandle.docSync()!;
          console.log("patches", diff);

          reconcilePmEditor(
            view,
            view.state,
            { doc: newDoc, patches: diff },
            getLastSpans(plugin, view.state),
            path.slice(),
          );
        }

        console.groupEnd();
      } else {
        const newState = view.state.apply(transaction);
        view.updateState(newState);
      }
    };
  }

  useEffect(() => {
    const doc = docHandle.docSync();
    if (!doc) {
      throw Error("doc is not ready");
    }

    const plugin = automergePlugin(doc, path);
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

      changes.forEach((change) => {
        docHandle.update((doc) => {
          const [newDoc] = Automerge.applyChanges(doc, [change]);

          const lastHeads = getLastHeads(plugin, view.state);
          const newHeads = Automerge.getHeads(newDoc);

          const patches = Automerge.diff(newDoc, lastHeads, newHeads);
          console.log("syncing... patches", patches);

          reconcilePmEditor(
            view,
            view.state,
            { doc: newDoc, patches },
            getLastSpans(plugin, view.state),
            path.slice(),
          );

          return newDoc;
        });
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
    />
  );
}
