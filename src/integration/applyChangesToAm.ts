import { DocHandle } from "@automerge/automerge-repo";
import { DocType } from "../App";
import { next as Automerge } from "@automerge/automerge";
import { Transaction } from "prosemirror-state";
import {
  AddMarkStep,
  RemoveMarkStep,
  ReplaceStep,
} from "prosemirror-transform";
import { PmToAmIndexMapper } from "./mapIndices.ts";

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

export function applyChangesToAm(
  docHandle: DocHandle<DocType>,
  path: Automerge.Prop[],
  lastHeads: Automerge.Heads,
  transaction: Transaction,
) {
  if (transaction.steps.length === 0) {
    return lastHeads;
  }

  return docHandle.changeAt(lastHeads, (doc) => {
    transaction.steps.forEach((step, i) => {
      const docBeforeStep = transaction.docs[i];
      const indexMapper = new PmToAmIndexMapper(docBeforeStep);

      // this path handles pasting and inserting text
      // for each text node:
      // - we insert the corresponding text
      // - reconcile the marks in the doc so that they are consistent with the marks contained in the text node
      if (step instanceof ReplaceStep) {
        let amFromIndex = indexMapper.map(step.from);

        // first remove any deleted characters
        // is the case when user presses backspace or selection is not empty and user deletes or inserts characters
        if (step.to - step.from > 0) {
          // splice() mutates path argument
          Automerge.splice(
            doc,
            path.slice(),
            amFromIndex,
            indexMapper.map(step.to) - indexMapper.map(step.from),
          );
        }

        if (step.slice.openStart === 1 && step.slice.openEnd === 1) {
          Automerge.splitBlock(doc, path.slice(), amFromIndex, {
            type: new Automerge.RawString("paragraph"),
          });
          return;
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

          Automerge.splice(doc, path.slice(), amFromIndex, 0, node.text);

          // reconcile the marks in the doc with the marks of the inserted text
          // this is necessary, when:
          // - selection is empty (otherwise we apply the mark in the AddMarkStep)
          // - mark is not implicit, e.g. inserted character should be bolded, but previous characters aren't
          const amMarks = Automerge.marksAt(doc, path.slice(), amFromIndex);

          // add missing marks
          for (const textMark of node.marks ?? []) {
            const isMarkInDoc =
              textMark.type.name in amMarks && !!amMarks[textMark.type.name];

            if (!isMarkInDoc) {
              Automerge.mark(
                doc,
                path.slice(),
                {
                  start: amFromIndex,
                  // TODO: not sure if this works with blocks
                  end: amFromIndex + node.text.length,
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
                path.slice(),
                {
                  start: amFromIndex,
                  end: amFromIndex + node.text.length,
                  expand: "after",
                },
                amMark,
              );
            }
          }

          amFromIndex += node.text.length;
        });
      }

      if (step instanceof AddMarkStep) {
        const mark = step.mark.type.name;
        const expand = getMarkExpandProperty(mark);

        Automerge.mark(
          doc,
          path.slice(),
          {
            start: indexMapper.map(step.from),
            end: indexMapper.map(step.to),
            expand,
          },
          mark,
          true,
        );
      }

      if (step instanceof RemoveMarkStep) {
        const mark = step.mark.type.name;
        const expand = getMarkExpandProperty(mark);

        Automerge.unmark(
          doc,
          path.slice(),
          {
            start: indexMapper.map(step.from),
            end: indexMapper.map(step.to),
            expand,
          },
          mark,
        );
      }
    });
  });
}
