import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "../App.tsx";
import { next as Automerge } from "automerge-blocks3";
import { Transaction } from "prosemirror-state";
import {
  AddMarkStep,
  RemoveMarkStep,
  ReplaceStep,
} from "prosemirror-transform";

function getMarkExpandProperty(mark: string) {
  switch (mark) {
    case "strong":
    case "em":
      return "after";
    // TODO: add explicit statements for comment, link marks
    default:
      return "none";
  }
}

function mapPmIndexToAm(index: number) {
  return index - 1;
}

export function applyChangesToAm(
  docHandle: DocHandle<DocType>,
  lastHeads: Automerge.Heads,
  transaction: Transaction,
) {
  const PATH = ["content"];

  let newHeads;

  transaction.steps.forEach((step) => {
    // this path handles pasting and inserting text
    // for each text node:
    // - we insert the corresponding text
    // - reconcile the marks in the doc so that they are consistent with the marks contained in the text node
    if (step instanceof ReplaceStep) {
      newHeads = docHandle.changeAt(lastHeads, (doc) => {
        let currAmIndex = mapPmIndexToAm(step.from);

        // first remove any deleted characters
        // is the case when user presses backspace or selection is not empty and user deletes or inserts characters
        if (step.to - step.from > 0) {
          Automerge.splice(doc, PATH.slice(), currAmIndex, step.to - step.from);
        }

        step.slice.content.forEach((node) => {
          if (!node.isText) {
            throw Error(
              "Error while handling ReplaceStep: only text nodes are supported at the moment",
            );
          }

          if (!node.text || node.text.length === 0) {
            return;
          }

          Automerge.splice(
            doc,
            // splice() mutates path argument
            PATH.slice(),
            currAmIndex,
            0,
            node.text,
          );

          // reconcile the marks in the doc with the marks of the inserted text
          // this is necessary, when:
          // - selection is empty (otherwise we apply the mark in the AddMarkStep)
          // - mark is not implicit, e.g. inserted character should be bolded, but previous characters aren't
          const amMarks = Automerge.marksAt(doc, PATH.slice(), currAmIndex);

          // add missing marks
          for (const textMark of node.marks ?? []) {
            const isMarkInDoc =
              textMark.type.name in amMarks && !!amMarks[textMark.type.name];

            if (!isMarkInDoc) {
              Automerge.mark(
                doc,
                PATH.slice(),
                {
                  start: currAmIndex,
                  end: currAmIndex + node.text.length,
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

            const hasInsertedTextMark = node.marks
              ?.map((m) => m.type.name)
              ?.includes(amMark);

            if (!hasInsertedTextMark) {
              Automerge.unmark(
                doc,
                PATH.slice(),
                {
                  start: currAmIndex,
                  end: currAmIndex + node.text.length,
                  expand: "after",
                },
                amMark,
              );
            }
          }

          currAmIndex += node.text.length;
        });
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
