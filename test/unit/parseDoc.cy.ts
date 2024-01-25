import { EditorState } from "prosemirror-state";
import { EditorSchema } from "../../src/schema.ts";
import { next as Automerge } from "@automerge/automerge";
import { DocType } from "../../src/App.tsx";
import { parseDoc } from "../../src/integration/parseDoc.ts";

const PATH = ["text"];

describe("parseDoc", () => {
  it("doc with one paragraph", () => {
    const amDoc = Automerge.change(Automerge.init<DocType>(), (doc) => {
      doc.text = "";
      Automerge.splitBlock(doc, PATH.slice(), 0, {
        type: new Automerge.RawString("paragraph"),
      });
      Automerge.splice(doc, PATH.slice(), 1, 0, "fox");
    });

    const actualPmDoc = parseDoc(amDoc, PATH.slice());
    const { doc: expectedPmDoc } = EditorState.create({
      doc: EditorSchema.node(EditorSchema.topNodeType, null, [
        EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
      ]),
    });
    expect(actualPmDoc).to.deep.equal(expectedPmDoc);
  });

  it("doc with one paragraph + bold mark", () => {
    const amDoc = Automerge.change(Automerge.init<DocType>(), (doc) => {
      doc.text = "";
      Automerge.splitBlock(doc, PATH.slice(), 0, {
        type: new Automerge.RawString("paragraph"),
      });
      Automerge.splice(doc, PATH.slice(), 1, 0, "fox");
      Automerge.mark(
        doc,
        PATH.slice(),
        {
          start: 1,
          end: 4,
        },
        "strong",
        true,
      );
    });

    const actualPmDoc = parseDoc(amDoc, PATH.slice());
    const { doc: expectedPmDoc } = EditorState.create({
      doc: EditorSchema.node(EditorSchema.topNodeType, null, [
        EditorSchema.node(
          "paragraph",
          null,
          EditorSchema.text("fox", [EditorSchema.mark("strong")]),
        ),
      ]),
    });
    expect(actualPmDoc).to.deep.equal(expectedPmDoc);
  });

  it("doc with four paragraphs", () => {
    const amDoc = Automerge.change(Automerge.init<DocType>(), (doc) => {
      doc.text = "";
      Automerge.splitBlock(doc, PATH.slice(), 0, {
        type: new Automerge.RawString("paragraph"),
      });
      Automerge.splice(doc, PATH.slice(), 1, 0, "a");
      Automerge.splitBlock(doc, PATH.slice(), 2, {
        type: new Automerge.RawString("paragraph"),
      });
      Automerge.splice(doc, PATH.slice(), 3, 0, "b");
      Automerge.splitBlock(doc, PATH.slice(), 4, {
        type: new Automerge.RawString("paragraph"),
      });
      Automerge.splice(doc, PATH.slice(), 5, 0, "c");
      Automerge.splitBlock(doc, PATH.slice(), 6, {
        type: new Automerge.RawString("paragraph"),
      });
      Automerge.splice(doc, PATH.slice(), 7, 0, "d");
    });

    const actualPmDoc = parseDoc(amDoc, PATH.slice());
    const { doc: expectedPmDoc } = EditorState.create({
      doc: EditorSchema.node(EditorSchema.topNodeType, null, [
        EditorSchema.node("paragraph", null, EditorSchema.text("a")),
        EditorSchema.node("paragraph", null, EditorSchema.text("b")),
        EditorSchema.node("paragraph", null, EditorSchema.text("c")),
        EditorSchema.node("paragraph", null, EditorSchema.text("d")),
      ]),
    });
    expect(actualPmDoc).to.deep.equal(expectedPmDoc);
  });
});
