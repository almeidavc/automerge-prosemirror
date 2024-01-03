import React from "react";
import { EditorView } from "prosemirror-view";
import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "../../src/App.tsx";
import { EditorState } from "prosemirror-state";
import { EditorSchema } from "../../src/Editor.tsx";
import { assertAmSpans, PM_EDITOR, setupEditor } from "./utils.tsx";
import { next as Automerge } from "@automerge/automerge";

describe.only("marks", () => {
  const editorViewRef = React.createRef<EditorView>();
  let docHandle: DocHandle<DocType>;

  beforeEach(() => {
    docHandle = setupEditor(editorViewRef);
  });

  it("select, add bold mark", () => {
    cy.get(PM_EDITOR).type("fox");
    cy.get(PM_EDITOR).type("{selectAll}");
    cy.get(PM_EDITOR)
      .type("{cmd}b")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        assertAmSpans(spans, [
          { type: "text", value: "fox", marks: { strong: true } },
        ]);

        const actualDoc = editorViewRef.current?.state.doc;
        const { doc: expectedDoc } = EditorState.create({
          doc: EditorSchema.node(EditorSchema.topNodeType, null, [
            EditorSchema.node(
              "paragraph",
              null,
              EditorSchema.text("fox", [EditorSchema.mark("strong")]),
            ),
          ]),
        });
        expect(actualDoc).to.deep.equal(expectedDoc);
      });
  });

  it("select, remove bold mark", () => {
    cy.get(PM_EDITOR).type("fox");
    cy.get(PM_EDITOR).type("{selectAll}");
    cy.get(PM_EDITOR).type("{cmd}b");

    cy.get(PM_EDITOR).type("{selectAll}");
    cy.get(PM_EDITOR)
      .type("{cmd}b")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        assertAmSpans(spans, [{ type: "text", value: "fox" }]);

        const actualDoc = editorViewRef.current?.state.doc;
        const { doc: expectedDoc } = EditorState.create({
          doc: EditorSchema.node(EditorSchema.topNodeType, null, [
            EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
          ]),
        });
        expect(actualDoc).to.deep.equal(expectedDoc);
      });
  });

  it("enable bold mark while selection empty, insert character", () => {
    cy.get(PM_EDITOR).type("{cmd}b");
    cy.get(PM_EDITOR)
      .type("fox")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        assertAmSpans(spans, [
          { type: "text", value: "fox", marks: { strong: true } },
        ]);

        const actualDoc = editorViewRef.current?.state.doc;
        const { doc: expectedDoc } = EditorState.create({
          doc: EditorSchema.node(EditorSchema.topNodeType, null, [
            EditorSchema.node(
              "paragraph",
              null,
              EditorSchema.text("fox", [EditorSchema.mark("strong")]),
            ),
          ]),
        });
        expect(actualDoc).to.deep.equal(expectedDoc);
      });
  });

  it("disable bold mark while selection empty, insert character", () => {
    cy.get(PM_EDITOR).type("fox");
    cy.get(PM_EDITOR).type("{selectAll}");
    cy.get(PM_EDITOR).type("{cmd}b");
    cy.get(PM_EDITOR).type("{moveToEnd}");

    cy.get(PM_EDITOR).type("{cmd}b");
    cy.get(PM_EDITOR)
      .type("a")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        assertAmSpans(spans, [
          { type: "text", value: "fox", marks: { strong: true } },
          { type: "text", value: "a" },
        ]);

        const actualDoc = editorViewRef.current?.state.doc;
        const { doc: expectedDoc } = EditorState.create({
          doc: EditorSchema.node(EditorSchema.topNodeType, null, [
            EditorSchema.node("paragraph", null, [
              EditorSchema.text("fox", [EditorSchema.mark("strong")]),
              EditorSchema.text("a"),
            ]),
          ]),
        });
        expect(actualDoc).to.deep.equal(expectedDoc);
      });
  });

  it("activating mark, then deleting a character deactivates mark", () => {
    cy.get(PM_EDITOR).type("fox");

    cy.get(PM_EDITOR).type("{cmd}b");
    cy.get(PM_EDITOR).type("{backspace}");
    cy.get(PM_EDITOR)
      .type("x")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        assertAmSpans(spans, [{ type: "text", value: "fox" }]);

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
