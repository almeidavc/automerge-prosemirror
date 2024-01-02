import { EditorSchema } from "../../src/Editor.tsx";
import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "../../src/App.tsx";
import { next as Automerge } from "@automerge/automerge";
import React from "react";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { PM_EDITOR, setupEditor } from "./utils.tsx";

describe("blocks", () => {
  const editorViewRef = React.createRef<EditorView>();
  let docHandle: DocHandle<DocType>;

  beforeEach(() => {
    docHandle = setupEditor(editorViewRef);
  });

  it("create block", () => {
    cy.get(PM_EDITOR)
      .type("{enter}")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        expect(spans).to.deep.equal([
          { type: "block", value: { type: "paragraph" } },
        ]);

        const actualDoc = editorViewRef.current?.state.doc;
        const { doc: expectedDoc } = EditorState.create({
          doc: EditorSchema.node(EditorSchema.topNodeType, null, [
            EditorSchema.node("paragraph", null),
            EditorSchema.node("paragraph", null),
          ]),
        });
        expect(actualDoc).to.deep.equal(expectedDoc);
      });
  });

  it("create block and insert character", () => {
    cy.get(PM_EDITOR)
      .type("{enter}a")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        expect(spans).to.deep.equal([
          { type: "block", value: { type: "paragraph" } },
          { type: "text", value: "a" },
        ]);

        const actualDoc = editorViewRef.current?.state.doc;
        const { doc: expectedDoc } = EditorState.create({
          doc: EditorSchema.node(EditorSchema.topNodeType, null, [
            EditorSchema.node("paragraph", null),
            EditorSchema.node("paragraph", null, EditorSchema.text("a")),
          ]),
        });
        expect(actualDoc).to.deep.equal(expectedDoc);
      });
  });

  it("pressing backspace at the start of a block joins two blocks", () => {
    cy.get(PM_EDITOR).type("fox{enter}");

    cy.get(PM_EDITOR)
      .type("{backspace}")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        expect(spans).to.deep.equal([{ type: "text", value: "fox" }]);

        const actualDoc = editorViewRef.current?.state.doc;
        const { doc: expectedDoc } = EditorState.create({
          doc: EditorSchema.node(EditorSchema.topNodeType, null, [
            EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
          ]),
        });
        expect(actualDoc).to.deep.equal(expectedDoc);
      });
  });
});
