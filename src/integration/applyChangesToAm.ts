import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "../App.tsx";
import { next as Automerge } from "@automerge/automerge";
import { EditorState, Transaction } from "prosemirror-state";
import {
  AddMarkStep,
  RemoveMarkStep,
  ReplaceStep,
} from "prosemirror-transform";

export function applyChangesToAm(
  docHandle: DocHandle<DocType>,
  lastHeads: Automerge.Heads,
  state: EditorState,
  transaction: Transaction,
) {
  const PATH = ["content"];

  let newHeads;

  transaction.steps.forEach((step) => {
    if (step instanceof ReplaceStep) {
      // at the moment we are only handling inline text nodes
      // in the future we will support blocks
      if (
        // deletion
        step.slice.content.size !== 0 &&
        // insertion
        (step.slice.content.childCount > 1 ||
          !step.slice.content.firstChild?.isText)
      ) {
        throw new Error("not yet supported");
      }

      const textNode = step.slice.content.firstChild;
      const textToInsert = textNode?.text;

      newHeads = docHandle.changeAt(lastHeads, (doc) => {
        Automerge.splice(
          doc,
          PATH.slice(),
          step.from - 1,
          step.to - step.from,
          textToInsert,
        );
      });
    }

    if (step instanceof AddMarkStep) {
      newHeads = docHandle.changeAt(lastHeads, (doc) => {
        Automerge.mark(
          doc,
          PATH,
          {
            start: step.from - 1,
            end: step.to - 1,
            expand: "after",
          },
          step.mark.type.name,
          true,
        );
      });
    }

    if (step instanceof RemoveMarkStep) {
      newHeads = docHandle.changeAt(lastHeads, (doc) => {
        Automerge.unmark(
          doc,
          PATH,
          {
            start: step.from - 1,
            end: step.to - 1,
          },
          step.mark.type.name,
        );
      });
    }
  });

  return newHeads || lastHeads;
}
