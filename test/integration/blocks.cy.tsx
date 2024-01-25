import { EditorSchema } from "../../src/schema.ts";
import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "../../src/App.tsx";
import { next as Automerge } from "@automerge/automerge";
import React from "react";
import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { PM_EDITOR, mountEditor } from "./utils.tsx";

describe("blocks", () => {
  const editorViewRef = React.createRef<EditorView>();
  let docHandle: DocHandle<DocType>;

  beforeEach(() => {
    docHandle = mountEditor(editorViewRef);
  });

  it("create block", () => {
    cy.get(PM_EDITOR)
      .type("{enter}")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        expect(spans).to.deep.equal([
          { type: "block", value: { type: "paragraph" } },
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

  it("create block, insert character", () => {
    cy.get(PM_EDITOR)
      .type("{enter}a")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        expect(spans).to.deep.equal([
          { type: "block", value: { type: "paragraph" } },
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

  it("selecting characters and pressing enter, deletes the characters and creates a new block", () => {
    cy.get(PM_EDITOR).type("fox");
    cy.get(PM_EDITOR).type("{selectAll}");
    cy.get(PM_EDITOR)
      .type("{enter}")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        expect(spans).to.deep.equal([
          { type: "block", value: { type: "paragraph" } },
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

  it(
    "selecting range of characters that includes block delimiters and pressing backspace, " +
      "deletes selected characters and joins blocks",
    () => {
      cy.get(PM_EDITOR).type("fox{enter}fox");
      cy.get(PM_EDITOR).realPress([
        "ArrowLeft",
        "ArrowLeft",
        "Shift",
        "ArrowLeft",
        "ArrowLeft",
        "ArrowLeft",
      ]);
      cy.get(PM_EDITOR)
        .type("{backspace}")
        .then(() => {
          const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
          expect(spans).to.deep.equal([
            { type: "block", value: { type: "paragraph" } },
            { type: "text", value: "foox" },
          ]);

          const actualDoc = editorViewRef.current?.state.doc;
          const { doc: expectedDoc } = EditorState.create({
            doc: EditorSchema.node(EditorSchema.topNodeType, null, [
              EditorSchema.node("paragraph", null, EditorSchema.text("foox")),
            ]),
          });
          expect(actualDoc).to.deep.equal(expectedDoc);
        });
    },
  );

  it(
    "selecting range of characters that includes block delimiters and pressing enter, " +
      "deletes selected characters and block structure doesn't change",
    () => {
      cy.get(PM_EDITOR).type("fox{enter}fox");
      cy.get(PM_EDITOR).realPress([
        "ArrowLeft",
        "ArrowLeft",
        "Shift",
        "ArrowLeft",
        "ArrowLeft",
        "ArrowLeft",
      ]);
      cy.get(PM_EDITOR)
        .type("{enter}")
        .then(() => {
          const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
          expect(spans).to.deep.equal([
            { type: "block", value: { type: "paragraph" } },
            { type: "text", value: "fo" },
            { type: "block", value: { type: "paragraph" } },
            { type: "text", value: "ox" },
          ]);

          const actualDoc = editorViewRef.current?.state.doc;
          const { doc: expectedDoc } = EditorState.create({
            doc: EditorSchema.node(EditorSchema.topNodeType, null, [
              EditorSchema.node("paragraph", null, EditorSchema.text("fo")),
              EditorSchema.node("paragraph", null, EditorSchema.text("ox")),
            ]),
          });
          expect(actualDoc).to.deep.equal(expectedDoc);
        });
    },
  );

  it(
    "select range of characters that includes block delimiters, starts at the first character, and does not contain " +
      "the last character and press backspace",
    () => {
      cy.get(PM_EDITOR).type("a{enter}bb");
      cy.get(PM_EDITOR).realPress([
        "ArrowLeft",
        "Shift",
        "ArrowLeft",
        "ArrowLeft",
        "ArrowLeft",
      ]);
      cy.get(PM_EDITOR)
        .type("{backspace}")
        .then(() => {
          const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
          expect(spans).to.deep.equal([
            { type: "block", value: { type: "paragraph" } },
            { type: "text", value: "b" },
          ]);

          const actualDoc = editorViewRef.current?.state.doc;
          const { doc: expectedDoc } = EditorState.create({
            doc: EditorSchema.node(EditorSchema.topNodeType, null, [
              EditorSchema.node("paragraph", null, EditorSchema.text("b")),
            ]),
          });
          expect(actualDoc).to.deep.equal(expectedDoc);
        });
    },
  );

  it(
    "select range of characters that includes block delimiters, starts at the first character, and does not contain " +
      "the last character and press enter",
    () => {
      cy.get(PM_EDITOR).type("a{enter}bb");
      cy.get(PM_EDITOR).realPress([
        "ArrowLeft",
        "Shift",
        "ArrowLeft",
        "ArrowLeft",
        "ArrowLeft",
      ]);
      cy.get(PM_EDITOR)
        .type("{enter}")
        .then(() => {
          const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
          expect(spans).to.deep.equal([
            { type: "block", value: { type: "paragraph" } },
            { type: "block", value: { type: "paragraph" } },
            { type: "text", value: "b" },
          ]);

          const actualDoc = editorViewRef.current?.state.doc;
          const { doc: expectedDoc } = EditorState.create({
            doc: EditorSchema.node(EditorSchema.topNodeType, null, [
              EditorSchema.node("paragraph", null),
              EditorSchema.node("paragraph", null, EditorSchema.text("b")),
            ]),
          });
          expect(actualDoc).to.deep.equal(expectedDoc);
        });
    },
  );
});
