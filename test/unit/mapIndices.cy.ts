import { EditorState } from "prosemirror-state";
import { EditorSchema } from "../../src/schema.ts";
import {
  PmToAmIndexMapper,
  AmToPmIndexMapper,
} from "../../src/integration/mapIndices.ts";
import { next as Automerge } from "@automerge/automerge";
import { DocType } from "../../src/App.tsx";

const PATH = ["text"];

describe("mapIndices", () => {
  it("single paragraph", () => {
    // PM: "<p>fox</p>"
    // AM: "<split />fox"
    const amDoc = Automerge.change(Automerge.init<DocType>(), (doc) => {
      doc.text = "";
      Automerge.splitBlock(doc, PATH.slice(), 0, {
        type: new Automerge.RawString("paragraph"),
      });
      Automerge.splice(doc, PATH.slice(), 1, 0, "fox");
    });
    const editorState = EditorState.create({
      doc: EditorSchema.node(
        EditorSchema.topNodeType,
        null,
        EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
      ),
    });

    const pmToAm = new PmToAmIndexMapper(editorState.doc);
    const amToPm = new AmToPmIndexMapper(Automerge.spans(amDoc, PATH.slice()));

    expect(pmToAm.map(1)).to.equal(1);
    expect(amToPm.map(1)).to.equal(1);

    expect(pmToAm.map(2)).to.equal(2);
    expect(amToPm.map(2)).to.equal(2);

    expect(pmToAm.map(3)).to.equal(3);
    expect(amToPm.map(3)).to.equal(3);

    expect(pmToAm.map(4)).to.equal(4);
    expect(amToPm.map(4)).to.equal(4);
  });

  it("four consecutive paragraphs", () => {
    // PM: "<p>a</p><p>b</p><p>c</p><p>def</p>"
    // AM: "<split />a<split />b<split />c<split />def"
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
      Automerge.splice(doc, PATH.slice(), 7, 0, "def");
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

    // first block
    expect(pmToAm.map(1)).to.equal(1);
    expect(amToPm.map(1)).to.equal(1);
    expect(pmToAm.map(2)).to.equal(2);
    expect(amToPm.map(2)).to.equal(2);

    // second block
    expect(pmToAm.map(4)).to.equal(3);
    expect(amToPm.map(3)).to.equal(4);
    expect(pmToAm.map(5)).to.equal(4);
    expect(amToPm.map(4)).to.equal(5);

    // third block
    expect(pmToAm.map(7)).to.equal(5);
    expect(amToPm.map(5)).to.equal(7);
    expect(pmToAm.map(8)).to.equal(6);
    expect(amToPm.map(6)).to.equal(8);

    // fourth block
    expect(pmToAm.map(10)).to.equal(7);
    expect(amToPm.map(7)).to.equal(10);
    expect(pmToAm.map(11)).to.equal(8);
    expect(amToPm.map(8)).to.equal(11);
    expect(pmToAm.map(12)).to.equal(9);
    expect(amToPm.map(9)).to.equal(12);
    expect(pmToAm.map(13)).to.equal(10);
    expect(amToPm.map(10)).to.equal(13);
  });

  it("two list items", () => {
    // PM: "<ul><li><p>fox</p></li><li><p>rabbit</p></li></ul>"
    // AM: "<split type="li"/>fox<split type"li"/>rabbit"
    const amDoc = Automerge.change(Automerge.init<DocType>(), (doc) => {
      doc.text = "";
      Automerge.splitBlock(doc, PATH.slice(), 0, {
        type: new Automerge.RawString("li"),
      });
      Automerge.splice(doc, PATH.slice(), 1, 0, "fox");
      Automerge.splitBlock(doc, PATH.slice(), 4, {
        type: new Automerge.RawString("li"),
      });
      Automerge.splice(doc, PATH.slice(), 5, 0, "rabbit");
    });
    const editorState = EditorState.create({
      doc: EditorSchema.node(
        EditorSchema.topNodeType,
        null,
        EditorSchema.node("bullet_list", null, [
          EditorSchema.node("list_item", null, [
            EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
          ]),
          EditorSchema.node("list_item", null, [
            EditorSchema.node("paragraph", null, EditorSchema.text("rabbit")),
          ]),
        ]),
      ),
    });

    const pmToAm = new PmToAmIndexMapper(editorState.doc);
    const amToPm = new AmToPmIndexMapper(Automerge.spans(amDoc, PATH.slice()));

    // first list item
    expect(pmToAm.map(3)).to.equal(1);
    expect(amToPm.map(1)).to.equal(3);
    expect(pmToAm.map(4)).to.equal(2);
    expect(amToPm.map(2)).to.equal(4);
    expect(pmToAm.map(5)).to.equal(3);
    expect(amToPm.map(3)).to.equal(5);
    expect(pmToAm.map(6)).to.equal(4);
    expect(amToPm.map(4)).to.equal(6);

    // second list item
    expect(pmToAm.map(10)).to.equal(5);
    expect(amToPm.map(5)).to.equal(10);
  });

  it("list item followed by paragraph", () => {
    // PM: "<ul><li><p>fox</p></li></ul><p>rabbit</p>"
    // AM: "<split type="li"/>fox<split type"p"/>rabbit"
    const amDoc = Automerge.change(Automerge.init<DocType>(), (doc) => {
      doc.text = "";
      Automerge.splitBlock(doc, PATH.slice(), 0, {
        type: new Automerge.RawString("li"),
      });
      Automerge.splice(doc, PATH.slice(), 1, 0, "fox");
      Automerge.splitBlock(doc, PATH.slice(), 4, {
        type: new Automerge.RawString("paragraph"),
      });
      Automerge.splice(doc, PATH.slice(), 5, 0, "rabbit");
    });
    const editorState = EditorState.create({
      doc: EditorSchema.node(EditorSchema.topNodeType, null, [
        EditorSchema.node("bullet_list", null, [
          EditorSchema.node("list_item", null, [
            EditorSchema.node("paragraph", null, EditorSchema.text("fox")),
          ]),
        ]),
        EditorSchema.node("paragraph", null, EditorSchema.text("rabbit")),
      ]),
    });

    const pmToAm = new PmToAmIndexMapper(editorState.doc);
    const amToPm = new AmToPmIndexMapper(Automerge.spans(amDoc, PATH.slice()));

    // list item
    expect(pmToAm.map(3)).to.equal(1);
    expect(amToPm.map(1)).to.equal(3);
    expect(pmToAm.map(4)).to.equal(2);
    expect(amToPm.map(2)).to.equal(4);
    expect(pmToAm.map(5)).to.equal(3);
    expect(amToPm.map(3)).to.equal(5);
    expect(pmToAm.map(6)).to.equal(4);
    expect(amToPm.map(4)).to.equal(6);

    // paragraph
    expect(pmToAm.map(10)).to.equal(5);
    expect(amToPm.map(5)).to.equal(10);
  });
});
