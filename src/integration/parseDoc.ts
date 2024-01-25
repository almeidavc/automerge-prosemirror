import { DocType } from "../App.tsx";
import { next as Automerge } from "@automerge/automerge";
import { getActiveMarks } from "./utils.ts";
import { EditorSchema } from "../schema.ts";

export function parseDoc(doc: Automerge.Doc<DocType>, path: Automerge.Prop[]) {
  const spans = Automerge.spans<DocType>(doc, path.slice());

  if (!spans.length || spans[0].type !== "block") {
    throw Error("Invalid doc: document must start with a block");
  }

  const blockNodes = [];
  let currBlock = spans[0];
  let currBlockChildren = [];

  for (const span of spans.slice(1)) {
    if (span.type === "block") {
      if (!span.value.type) {
        throw Error("Invalid block: block has no type");
      }

      blockNodes.push(
        EditorSchema.node(
          currBlock.value.type,
          null,
          currBlockChildren.map((span) => {
            return EditorSchema.text(
              span.value,
              getActiveMarks(span.marks).map((mark) => EditorSchema.mark(mark)),
            );
          }),
        ),
      );

      currBlock = span;
      currBlockChildren = [];
    } else {
      currBlockChildren.push(span);
    }
  }

  blockNodes.push(
    EditorSchema.node(
      currBlock.value.type,
      null,
      currBlockChildren.map((span) => {
        return EditorSchema.text(
          span.value,
          getActiveMarks(span.marks).map((mark) => EditorSchema.mark(mark)),
        );
      }),
    ),
  );

  return EditorSchema.node(EditorSchema.topNodeType, null, blockNodes);
}
