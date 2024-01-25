import React from "react";
import { EditorView } from "prosemirror-view";
import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "../../src/App.tsx";
import { EditorState } from "prosemirror-state";
import { EditorSchema } from "../../src/schema.ts";
import { PM_EDITOR, mountEditor } from "./utils.tsx";
import { next as Automerge } from "@automerge/automerge";

describe("basic", () => {
  const editorViewRef = React.createRef<EditorView>();
  let docHandle: DocHandle<DocType>;

  beforeEach(() => {
    docHandle = mountEditor(editorViewRef);
  });

  it("insert", () => {
    cy.get(PM_EDITOR).type("fox");
    cy.get(PM_EDITOR).then(() => {
      const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
      expect(spans).to.deep.equal([
        { type: "block", value: { type: "paragraph" } },
        { type: "text", value: "fox" },
      ]);

      const actualDoc = editorViewRef.current?.state.doc;
      const { doc: expectedDoc } = EditorState.create({
        doc: EditorSchema.node(EditorSchema.topNodeType, null, [
          EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
        ]),
      });
      expect(actualDoc).to.deep.equal(expectedDoc);
    });
  });
  it("insert, delete", () => {
    cy.get(PM_EDITOR).type("fox");

    cy.get(PM_EDITOR).type("{backspace}{backspace}{backspace}");
    cy.get(PM_EDITOR).then(() => {
      const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
      expect(spans).to.deep.equal([
        { type: "block", value: { type: "paragraph" } },
      ]);

      const actualDoc = editorViewRef.current?.state.doc;
      const { doc: expectedDoc } = EditorState.create({
        doc: EditorSchema.node(EditorSchema.topNodeType, null, [
          EditorSchema.node("paragraph", null),
        ]),
      });
      expect(actualDoc).to.deep.equal(expectedDoc);
    });
  });
});
