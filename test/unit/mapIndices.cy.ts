import { EditorState } from "prosemirror-state";
import { EditorSchema } from "../../src/Editor.tsx";
import {
  PmToAmIndexMapper,
  AmToPmIndexMapper,
} from "../../src/integration/mapIndices.ts";
import { next as Automerge } from "@automerge/automerge";
import { DocType } from "../../src/App.tsx";

const PATH = ["text"];

describe("mapIndices", () => {
  it("default top-level block", () => {
    // PM: "<p>fox</p>"
    // AM: "fox"
    const amDoc = Automerge.from({ text: "fox" });
    const editorState = EditorState.create({
      doc: EditorSchema.node(
        EditorSchema.topNodeType,
        null,
        EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
      ),
    });

    const pmToAm = new PmToAmIndexMapper(editorState.doc);
    const amToPm = new AmToPmIndexMapper(Automerge.spans(amDoc, PATH.slice()));

    expect(pmToAm.map(1)).to.equal(0);
    expect(amToPm.map(0)).to.equal(1);

    expect(pmToAm.map(2)).to.equal(1);
    expect(amToPm.map(1)).to.equal(2);

    expect(pmToAm.map(3)).to.equal(2);
    expect(amToPm.map(2)).to.equal(3);

    expect(pmToAm.map(4)).to.equal(3);
    expect(amToPm.map(3)).to.equal(4);
  });

  it("four top-level paragraphs", () => {
    // PM: "<p>a</p><p>b</p><p>c</p><p>def</p>"
    // AM: "a<splitblock />b<splitblock />c<splitblock />def"
    const amDoc = Automerge.change(Automerge.init<DocType>(), (doc) => {
      doc.text = "a";
      Automerge.splitBlock(doc, PATH.slice(), 1, null);
      Automerge.splice(doc, PATH.slice(), 2, 0, "b");
      Automerge.splitBlock(doc, PATH.slice(), 3, null);
      Automerge.splice(doc, PATH.slice(), 4, 0, "c");
      Automerge.splitBlock(doc, PATH.slice(), 5, null);
      Automerge.splice(doc, PATH.slice(), 6, 0, "def");
    });
    const editorState = EditorState.create({
      doc: EditorSchema.node(EditorSchema.topNodeType, null, [
        EditorSchema.node("paragraph", null, EditorSchema.text("a")),
        EditorSchema.node("paragraph", null, EditorSchema.text("b")),
        EditorSchema.node("paragraph", null, EditorSchema.text("c")),
        EditorSchema.node("paragraph", null, EditorSchema.text("def")),
      ]),
    });

    const pmToAm = new PmToAmIndexMapper(editorState.doc);
    const amToPm = new AmToPmIndexMapper(Automerge.spans(amDoc, PATH.slice()));

    expect(pmToAm.map(1)).to.equal(0);
    expect(amToPm.map(0)).to.equal(1);

    expect(pmToAm.map(2)).to.equal(1);
    expect(amToPm.map(1)).to.equal(2);

    expect(pmToAm.map(4)).to.equal(2);
    expect(amToPm.map(2)).to.equal(4);

    expect(pmToAm.map(5)).to.equal(3);
    expect(amToPm.map(3)).to.equal(5);

    expect(pmToAm.map(7)).to.equal(4);
    expect(amToPm.map(4)).to.equal(7);

    expect(pmToAm.map(8)).to.equal(5);
    expect(amToPm.map(5)).to.equal(8);

    expect(pmToAm.map(10)).to.equal(6);
    expect(amToPm.map(6)).to.equal(10);

    expect(pmToAm.map(11)).to.equal(7);
    expect(amToPm.map(7)).to.equal(11);

    expect(pmToAm.map(12)).to.equal(8);
    expect(amToPm.map(8)).to.equal(12);

    expect(pmToAm.map(13)).to.equal(9);
    expect(amToPm.map(9)).to.equal(13);
  });
});
