import { useEffect, useRef } from "react";
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";
import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "./App.tsx";

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

    const view = new EditorView(mountTargetRef.current, {
      state: EditorState.create({
        schema,
        plugins: exampleSetup({ schema }),
      }),
    });

    return () => {
      view.destroy();
    };
  }, [docHandle]);

  // "editor" id is required so that styles are applied properly
  return <div ref={mountTargetRef} id={"editor"} />;
}
