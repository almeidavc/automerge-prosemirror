import React from "react";
import { EditorView } from "prosemirror-view";
import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "../../src/App.tsx";
import { PM_EDITOR, mountEditor } from "./utils.tsx";
import { next as Automerge } from "@automerge/automerge";
import { EditorState } from "prosemirror-state";
import { EditorSchema } from "../../src/schema.ts";

const PATH = ["text"];

describe("lists", () => {
  const editorViewRef = React.createRef<EditorView>();
  let docHandle: DocHandle<DocType>;

  beforeEach(() => {
    docHandle = mountEditor(editorViewRef);
  });

  describe.only("turn paragraph to a list item", () => {
    it.only("no adjacent list items", () => {
      const initialAmDoc = Automerge.change(
        Automerge.init<DocType>(),
        (doc) => {
          doc.text = "";
          Automerge.splitBlock(doc, PATH.slice(), 0, {
            type: new Automerge.RawString("paragraph"),
          });
          Automerge.splice(doc, PATH.slice(), 1, 0, "fox");
          Automerge.splitBlock(doc, PATH.slice(), 4, {
            type: new Automerge.RawString("paragraph"),
          });
          Automerge.splice(doc, PATH.slice(), 5, 0, "rabbit");
        },
      );
      const { doc: initialPmDoc } = EditorState.create({
        doc: EditorSchema.node(EditorSchema.topNodeType, null, [
          EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
          EditorSchema.node("paragraph", null, EditorSchema.text("rabbit")),
        ]),
      });
      const editorViewRef = React.createRef<EditorView>();
      const docHandle = mountEditor(editorViewRef, initialPmDoc, initialAmDoc);

      cy.get(PM_EDITOR).type("{moveToStart}");
      cy.get(PM_EDITOR)
        .type("{shift}{ctrl}8")
        .then(() => {
          const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
          expect(spans).to.deep.equal([
            { type: "block", value: { type: "li" } },
            { type: "text", value: "fox" },
            { type: "block", value: { type: "paragraph" } },
            { type: "text", value: "rabbit" },
          ]);

          const actualDoc = editorViewRef.current?.state.doc;
          const { doc: expectedDoc } = EditorState.create({
            doc: EditorSchema.node(EditorSchema.topNodeType, null, [
              EditorSchema.node("bullet_list", null, [
                EditorSchema.node("list_item", null, [
                  EditorSchema.node(
                    "paragraph",
                    null,
                    EditorSchema.text("fox"),
                  ),
                ]),
              ]),
              EditorSchema.node("paragraph", null, EditorSchema.text("rabbit")),
            ]),
          });

          expect(actualDoc).to.deep.equal(expectedDoc);
        });
    });

    it("preceding block is a list item", () => {
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
    });

    it("following block is a list item", () => {
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
    });

    it("both adjacent blocks are list items", () => {
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
    });
  });

  describe.only("turn list item to a paragraph", () => {
    it.only("no adjacent list items", () => {
      // setup
      const initialAmDoc = Automerge.change(
        Automerge.init<DocType>(),
        (doc) => {
          doc.text = "";
          Automerge.splitBlock(doc, PATH.slice(), 0, {
            type: new Automerge.RawString("li"),
          });
          Automerge.splice(doc, PATH.slice(), 1, 0, "fox");
          Automerge.splitBlock(doc, PATH.slice(), 4, {
            type: new Automerge.RawString("paragraph"),
          });
          Automerge.splice(doc, PATH.slice(), 5, 0, "rabbit");
        },
      );
      const { doc: initialPmDoc } = EditorState.create({
        doc: EditorSchema.node(EditorSchema.topNodeType, null, [
          EditorSchema.node("bullet_list", null, [
            EditorSchema.node("list_item", null, [
              EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
            ]),
          ]),
          EditorSchema.node("paragraph", null, EditorSchema.text("rabbit")),
        ]),
      });
      const editorViewRef = React.createRef<EditorView>();
      const docHandle = mountEditor(editorViewRef, initialPmDoc, initialAmDoc);

      cy.get(PM_EDITOR).type("{moveToStart}");
      cy.get(PM_EDITOR)
        .type("{shift}{ctrl}8")
        .then(() => {
          const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
          expect(spans).to.deep.equal([
            { type: "block", value: { type: "paragraph" } },
            { type: "text", value: "fox" },
            { type: "block", value: { type: "paragraph" } },
            { type: "text", value: "rabbit" },
          ]);

          const actualDoc = editorViewRef.current?.state.doc;
          const { doc: expectedDoc } = EditorState.create({
            doc: EditorSchema.node(EditorSchema.topNodeType, null, [
              EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
              EditorSchema.node("paragraph", null, EditorSchema.text("rabbit")),
            ]),
          });
          expect(actualDoc).to.deep.equal(expectedDoc);
        });
    });

    // TODO
    it("pressing backspace in an empty list item turns it into a paragraph");
  });

  it("split list item", () => {
    // setup
    const initialAmDoc = Automerge.change(Automerge.init<DocType>(), (doc) => {
      doc.text = "";
      Automerge.splitBlock(doc, PATH.slice(), 0, {
        type: new Automerge.RawString("li"),
      });
      Automerge.splice(doc, PATH.slice(), 1, 0, "fox");
    });
    const { doc: initialPmDoc } = EditorState.create({
      doc: EditorSchema.node(EditorSchema.topNodeType, null, [
        EditorSchema.node("bullet_list", null, [
          EditorSchema.node("list_item", null, [
            EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
          ]),
        ]),
      ]),
    });
    const editorViewRef = React.createRef<EditorView>();
    const docHandle = mountEditor(editorViewRef, initialPmDoc, initialAmDoc);

    cy.get(PM_EDITOR)
      .type("{enter}")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        expect(spans).to.deep.equal([
          { type: "block", value: { type: "li" } },
          { type: "text", value: "fox" },
          { type: "block", value: { type: "li" } },
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

  it.skip("nest block within list item", () => {
    cy.get(PM_EDITOR).type("- fox{enter}");

    cy.get(PM_EDITOR)
      .type("{cmd}]")
      .then(() => {
        const spans = Automerge.spans(docHandle.docSync()!, ["text"]);
        expect(spans).to.deep.equal([
          { type: "block", value: { type: "uli" } },
          { type: "text", value: "fox" },
          { type: "block", value: { type: "uli", parent: "uli" } },
        ]);

        const actualDoc = editorViewRef.current?.state.doc;
        const { doc: expectedDoc } = EditorState.create({
          doc: EditorSchema.node(EditorSchema.topNodeType, null, [
            EditorSchema.node("bullet_list", null, [
              EditorSchema.node("list_item", null, [
                EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
                EditorSchema.node("bullet_list", null, [
                  EditorSchema.node("list_item", null, [
                    EditorSchema.node("paragraph", null),
                  ]),
                ]),
              ]),
            ]),
          ]),
        });
        expect(actualDoc).to.deep.equal(expectedDoc);
      });
  });

  it.skip("lift block from underneath list item", () => {
    cy.get(PM_EDITOR).type("- fox{enter}");
    cy.get(PM_EDITOR).type("{cmd}]");

    cy.get(PM_EDITOR)
      .type("{cmd}[")
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
});
