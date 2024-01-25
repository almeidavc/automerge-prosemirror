import { Schema } from "prosemirror-model";
import { addListNodes } from "prosemirror-schema-list";
import { schema as basicSchema } from "prosemirror-schema-basic";

export const EditorSchema = new Schema({
  // TODO: fix itemContent expression. the first child of a list item must be a paragraph not just any block
  nodes: addListNodes(basicSchema.spec.nodes, "block*", "block"),
  marks: basicSchema.spec.marks,
});
