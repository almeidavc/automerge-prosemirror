import { useEffect, useRef } from "react";
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import "prosemirror-example-setup/style/style.css";
import "prosemirror-menu/style/menu.css";

export function Editor() {
  const editorRoot = useRef(null);
  const editorRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!editorRef.current) {
      editorRef.current = new EditorView(editorRoot.current, {
        state: EditorState.create({
          schema,
          plugins: exampleSetup({ schema }),
        }),
      });
    }
  }, []);

  // "editor" id is required so that styles are applied properly
  return <div ref={editorRoot} id={"editor"} />;
}
