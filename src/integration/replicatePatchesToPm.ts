import { EditorState } from "prosemirror-state";
import { next as Automerge } from "@automerge/automerge";
import { EditorSchema } from "../Editor.tsx";

export function replicatePatchesToPm(
  state: EditorState,
  patches: Automerge.Patch[],
) {
  const tr = state.tr;
  patches.forEach((patch) => {
    if (patch.action === "splice") {
      const index = patch.path[1] + 1;
      tr.insertText(patch.value, index);
      if (patch.marks) {
        Object.entries(patch.marks).forEach(([mark, value]) => {
          if (mark && !!value) {
            tr.addMark(index, index + 1, EditorSchema.mark(mark));
          }
        });
      }
    }
    if (patch.action === "del") {
      const index = patch.path[1] + 1;
      tr.delete(index, index + (patch.length ?? 1));
    }
    if (patch.action === "mark") {
      patch.marks.forEach((mark: Automerge.Mark) => {
        if (mark.value) {
          tr.addMark(
            mark.start + 1,
            mark.end + 1,
            EditorSchema.mark(mark.name),
          );
        } else {
          tr.removeMark(
            mark.start + 1,
            mark.end + 1,
            EditorSchema.mark(mark.name),
          );
        }
      });
    }
  });

  return tr;
}
