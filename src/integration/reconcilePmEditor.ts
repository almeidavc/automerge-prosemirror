import { EditorState } from "prosemirror-state";
import { next as Automerge } from "@automerge/automerge";
import { EditorSchema } from "../Editor.tsx";
import { EditorView } from "prosemirror-view";
import { DocType } from "../App.tsx";
import { AmToPmIndexMapper } from "./mapIndices.ts";
import { Span } from "./tmp.ts";

interface AmChange<T> {
  doc: Automerge.Doc<T>;
  patches: Automerge.Patch[];
}

function mapPatchesToPmTransaction(
  state: EditorState,
  patches: Automerge.Patch[],
  lastSpans: Span[],
) {
  const tr = state.tr;
  const indexMapper = new AmToPmIndexMapper(lastSpans);

  patches.forEach((patch) => {
    // patches resulting from splitBlock call
    if (patch.action === "insert" || patch.action === "put") {
      if (patch.action === "put") {
        return;
      }
      const pmIndex = indexMapper.map(patch.path[1]);
      tr.split(pmIndex);
    }

    if (patch.action === "splice") {
      const pmIndex = indexMapper.map(patch.path[1]);
      tr.insertText(patch.value, pmIndex);
      if (patch.marks) {
        Object.entries(patch.marks).forEach(([mark, value]) => {
          if (!!value) {
            tr.addMark(pmIndex, pmIndex + 1, EditorSchema.mark(mark));
          } else {
            tr.removeMark(pmIndex, pmIndex + 1, EditorSchema.mark(mark));
          }
        });
      }
    }

    if (patch.action === "del") {
      const pmFromIndex = indexMapper.map(patch.path[1]);
      const pmToIndex = indexMapper.map(patch.path[1] + (patch.length ?? 1));
      tr.delete(pmFromIndex, pmToIndex);
    }

    if (patch.action === "mark") {
      patch.marks.forEach((mark: Automerge.Mark) => {
        if (mark.value) {
          tr.addMark(
            indexMapper.map(mark.start),
            indexMapper.map(mark.end),
            EditorSchema.mark(mark.name),
          );
        } else {
          tr.removeMark(
            indexMapper.map(mark.start),
            indexMapper.map(mark.end),
            EditorSchema.mark(mark.name),
          );
        }
      });
    }
  });

  return tr;
}

export function reconcilePmEditor(
  view: EditorView,
  state: EditorState,
  change: AmChange<DocType>,
  lastSpans: Span[],
  path: Automerge.Prop[],
) {
  const reconcileTransaction = mapPatchesToPmTransaction(
    state,
    change.patches,
    lastSpans,
  );

  console.log("reconcile transaction", reconcileTransaction);

  // update lastHeads and lastSpans
  const newHeads = Automerge.getHeads(change.doc);
  reconcileTransaction.setMeta("newHeads", newHeads);
  reconcileTransaction.setMeta(
    "newSpans",
    Automerge.spans(change.doc, path.slice()),
  );

  const newState = state.apply(reconcileTransaction);
  view.updateState(newState);
}
