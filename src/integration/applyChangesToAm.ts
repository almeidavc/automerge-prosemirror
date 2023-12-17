import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "../App.tsx";
import { next as Automerge } from "@automerge/automerge";
import { Transaction } from "prosemirror-state";
import {
  AddMarkStep,
  RemoveMarkStep,
  ReplaceStep,
} from "prosemirror-transform";

function getMarkExpandProperty(mark: string) {
  switch (mark) {
    case "strong":
    case "italic":
      return "after";
    // TODO: add explicit statements for comment, link marks
    default:
      return "none";
  }
}

export function applyChangesToAm(
  docHandle: DocHandle<DocType>,
  lastHeads: Automerge.Heads,
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
      const textMarks = textNode?.marks;

      newHeads = docHandle.changeAt(lastHeads, (doc) => {
        Automerge.splice(
          doc,
          // splice() mutates path argument
          PATH.slice(),
          step.from - 1,
          step.to - step.from,
          textToInsert,
        );

        // step inserts characters
        if (step.slice.content.childCount > 0) {
          // reconcile the marks in the doc with the marks of the inserted text
          // this is necessary, when:
          // - selection is empty (otherwise we apply the mark in the AddMarkStep)
          // - mark is not implicit, e.g. inserted character should be bolded, but previous characters aren't
          const amMarks = Automerge.marksAt(doc, PATH.slice(), step.from - 1);

          // add missing marks
          for (const textMark of textMarks ?? []) {
            const isMarkInDoc =
              textMark.type.name in amMarks && !!amMarks[textMark.type.name];

            if (!isMarkInDoc) {
              Automerge.mark(
                doc,
                PATH.slice(),
                {
                  start: step.from - 1,
                  end: step.to,
                  expand: "after",
                },
                textMark.type.name,
                true,
              );
            }
          }

          // remove marks that are no longer active
          for (const amMark in amMarks) {
            // amMark is not active
            if (!amMarks[amMark]) {
              continue;
            }

            const hasInsertedTextMark = textMarks
              ?.map((m) => m.type.name)
              ?.includes(amMark);

            if (!hasInsertedTextMark) {
              Automerge.unmark(
                doc,
                PATH.slice(),
                {
                  start: step.from - 1,
                  end: step.to,
                  expand: "after",
                },
                amMark,
              );
            }
          }
        }
      });
    }

    if (step instanceof AddMarkStep) {
      const mark = step.mark.type.name;
      const expand = getMarkExpandProperty(mark);

      newHeads = docHandle.changeAt(lastHeads, (doc) => {
        Automerge.mark(
          doc,
          PATH.slice(),
          {
            start: step.from - 1,
            end: step.to - 1,
            expand,
          },
          mark,
          true,
        );
      });
    }

    if (step instanceof RemoveMarkStep) {
      const mark = step.mark.type.name;
      const expand = getMarkExpandProperty(mark);

      newHeads = docHandle.changeAt(lastHeads, (doc) => {
        Automerge.unmark(
          doc,
          PATH.slice(),
          {
            start: step.from - 1,
            end: step.to - 1,
            expand,
          },
          mark,
        );
      });
    }
  });

  return newHeads || lastHeads;
}
