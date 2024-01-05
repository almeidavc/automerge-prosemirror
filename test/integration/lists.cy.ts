import React from "react";
import { EditorView } from "prosemirror-view";
import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "../../src/App.tsx";
import { PM_EDITOR, setupEditor } from "./utils.tsx";
import { next as Automerge } from "@automerge/automerge";
import { EditorState } from "prosemirror-state";
import { EditorSchema } from "../../src/schema.ts";

describe.skip("lists", () => {
  const editorViewRef = React.createRef<EditorView>();
  let docHandle: DocHandle<DocType>;

  beforeEach(() => {
    docHandle = setupEditor(editorViewRef);
  });

  it(
    "pressing hyphen + space at the start of a paragraph, converts the paragraph to a bullet list and creates" +
      " a list item",
    () => {
      cy.get(PM_EDITOR)
        .type("- ")
        .then(() => {
          const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
          expect(spans).to.deep.equal([
            { type: "block", value: { type: "uli" } },
          ]);

          const actualDoc = editorViewRef.current?.state.doc;
          const { doc: expectedDoc } = EditorState.create({
            doc: EditorSchema.node(EditorSchema.topNodeType, null, [
              EditorSchema.node("bullet_list", null, [
                EditorSchema.node("list_item", null, [
                  EditorSchema.node("paragraph", null),
                ]),
              ]),
            ]),
          });
          expect(actualDoc).to.deep.equal(expectedDoc);
        });
    },
  );

  it("pressing enter inside a non-empty list item, creates a new list item", () => {
    cy.get(PM_EDITOR).type("- fox");

    cy.get(PM_EDITOR)
      .type("{enter}")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        expect(spans).to.deep.equal([
          { type: "block", value: { type: "uli" } },
          { type: "text", value: "fox" },
          { type: "block", value: { type: "uli" } },
        ]);

        const actualDoc = editorViewRef.current?.state.doc;
        const { doc: expectedDoc } = EditorState.create({
          doc: EditorSchema.node(EditorSchema.topNodeType, null, [
            EditorSchema.node("bullet_list", null, [
              EditorSchema.node("list_item", null, [
                EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
              ]),
              EditorSchema.node("list_item", null, [
                EditorSchema.node("paragraph", null),
              ]),
            ]),
          ]),
        });
        expect(actualDoc).to.deep.equal(expectedDoc);
      });
  });

  it("pressing enter in an an empty list item, converts the list item to a paragraph", () => {
    cy.get(PM_EDITOR).type("- ");

    cy.get(PM_EDITOR)
      .type("{enter}")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        expect(spans).to.deep.equal([{ type: "block", value: { type: "p" } }]);

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
