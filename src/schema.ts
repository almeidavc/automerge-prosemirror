import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";

export const EditorSchema = new Schema({
  // nodes: addListNodes(basicSchema.spec.nodes, "block*", "block"),
  nodes: basicSchema.spec.nodes.append({
    ordered_list: {
      content: "list_item*",
      group: "block",
      // attrs: { order: { default: 1 } },
      // parseDOM: [{ tag: "ol", getAttrs(dom) {
      //     return { order: dom.hasAttribute("start") ? +dom.getAttribute("start") : 1 };
      //   } }],
      toDOM(node) {
        const olDOM = ["ol", 0];
        return node.attrs.order == 1
          ? olDOM
          : ["ol", { start: node.attrs.order }, 0];
      },
    },
    bullet_list: {
      content: "list_item*",
      group: "block",
      // parseDOM: [{ tag: "ul" }],
      toDOM() {
        const ulDOM = ["ul", 0];
        return ulDOM;
      },
    },
    list_item: {
      // TODO: fix itemContent expression. the first child of a list item must be a paragraph not just any block
      content: "block*",
      // parseDOM: [{ tag: "li" }],
      toDOM() {
        const liDOM = ["li", 0];
        return liDOM;
      },
      // defining: true
    },
  }),
  marks: basicSchema.spec.marks,
});
