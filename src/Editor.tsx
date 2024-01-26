import { MutableRefObject, useEffect, useRef } from "react";
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
import { reconcilePmEditor } from "./integration/reconcilePmEditor.ts";
import { EditorSchema } from "./schema.ts";
import { parseDoc } from "./integration/parseDoc.ts";
import { keymap } from "prosemirror-keymap";
import {
  convertEmptyBulletList,
  toggleBulletList,
} from "./integration/commands/toggleBulletList.ts";
import { applyChangesToAm } from "./integration/applyChangesToAm.ts";
import { splitBlock } from "./integration/commands/splitBlock.ts";
import { Node } from "prosemirror-model";

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
  // for testing purposes
  viewRef?: MutableRefObject<EditorView | null>;
  initialPmDoc?: Node;
}

// assumes the doc is ready
export function Editor({
  docHandle,
  path,
  sync,
  viewRef,
  initialPmDoc,
}: EditorProps) {
  const mountTargetRef = useRef<HTMLDivElement>(null);

  const editorViewRef = useRef<EditorView | null>(null);
  const editorPluginRef = useRef<AutomergePlugin | null>(null);

  useEffect(() => {
    const doc = docHandle.docSync();
    if (!doc) {
      throw Error("doc is not ready");
    }

    const plugin = automergePlugin(doc, path);
    const view = new EditorView(mountTargetRef.current, {
      state: EditorState.create({
        schema: EditorSchema,
        doc: initialPmDoc,
        // doc: parseDoc(doc, path.slice()),
        plugins: [
          keymap({
            Enter: splitBlock,
            Backspace: convertEmptyBulletList,
            "Shift-Ctrl-8": toggleBulletList,
          }),
          ...exampleSetup({ schema: EditorSchema }),
          plugin,
        ],
      }),
      dispatchTransaction(transaction: Transaction) {
        const doc = docHandle.docSync();
        const view = editorViewRef.current;
        const plugin = editorPluginRef.current;

        if (!doc || !view || !plugin) {
          return;
        }

        if (transaction.docChanged || transaction.getMeta("_blocks")) {
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
    if (viewRef) {
      viewRef.current = view;
    }

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

      reconcilePmEditor(view, plugin, payload, path.slice());
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
    />
  );
}
