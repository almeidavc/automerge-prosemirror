import { EditorState } from "prosemirror-state";
import { next as Automerge } from "@automerge/automerge";
import { EditorSchema } from "../schema.ts";
import { EditorView } from "prosemirror-view";
import { DocType } from "../App.tsx";
import { AmToPmIndexMapper } from "./mapIndices.ts";
import { Span, PatchValue } from "./tmp.ts";
import { AutomergePlugin, getLastSpans } from "./plugin.ts";
import { Fragment, Slice } from "prosemirror-model";
import { ReplaceAroundStep } from "prosemirror-transform";

type ExtendedPatch = Automerge.Patch | SplitBlockPatch;

interface SplitBlockPatch {
  action: "splitBlock";
  path: Automerge.Prop[];
  value: PatchValue;
  conflict?: boolean;
}

interface AmChange<T> {
  doc: Automerge.Doc<T>;
  patches: Automerge.Patch[];
}

export function reconcilePmEditor(
  view: EditorView,
  plugin: AutomergePlugin,
  change: AmChange<DocType>,
  path: Automerge.Prop[],
) {
  console.log("patches", change.patches);

  const reconcileTransaction = mapPatchesToPmTransaction(
    view.state,
    change.patches,
    getLastSpans(plugin, view.state),
  );

  console.log("reconcileTransaction", reconcileTransaction);

  // update lastHeads and lastSpans
  const newHeads = Automerge.getHeads(change.doc);
  reconcileTransaction.setMeta("newHeads", newHeads);
  reconcileTransaction.setMeta(
    "newSpans",
    Automerge.spans(change.doc, path.slice()),
  );

  const newState = view.state.apply(reconcileTransaction);
  view.updateState(newState);
}

function mapPatchesToPmTransaction(
  state: EditorState,
  patches: Automerge.Patch[],
  lastSpans: Span[],
) {
  const tr = state.tr;
  const indexMapper = new AmToPmIndexMapper(lastSpans);

  // TODO: Can we make the assumption that splitBlock always results in insert patches DIRECTLY followed by put patches?
  // TODO: Can it be the case that insert patch and put patch are interleaved with other patches?
  // merge "insert" patches followed by "put" patches into a single "splitBlock" patch to be able to
  // distinguish create block and update block operations
  const extPatches: ExtendedPatch[] = [];
  for (let i = 0; i < patches.length; i++) {
    if (
      i >= 1 &&
      patches[i - 1].action === "insert" &&
      patches[i].action === "put"
    ) {
      extPatches[i - 1] = {
        ...patches[i],
        action: "splitBlock",
      };
    } else {
      extPatches.push(patches[i]);
    }
  }

  extPatches.forEach((patch) => {
    if (patch.action === "splitBlock") {
      const pmIndex = indexMapper.map(patch.path[1]);
      const blockType = patch.value;
      const splitDepth = blockType === "li" ? 2 : 1;
      tr.split(pmIndex, splitDepth);
    }

    // handle updateBlock operations
    if (patch.action === "put") {
      const amIndex = patch.path[1];
      const prop = patch.path[2];
      if (prop !== "type") {
        // TODO: handle later
        return;
      }

      const start = indexMapper.map(amIndex + 1);
      // resolvedPos points into the position right after the block start tag
      const resolvedPos = state.doc.resolve(start);

      const parentNode = resolvedPos.node(resolvedPos.depth - 1);
      const indexInParent = resolvedPos.index(resolvedPos.depth - 1);
      const previousNode = parentNode.maybeChild(indexInParent - 1);
      const nextNode = parentNode.maybeChild(indexInParent + 1);

      if (patch.value === "li") {
        if (previousNode?.type.name !== "ul" && nextNode?.type.name !== "ul") {
          tr.step(
            new ReplaceAroundStep(
              resolvedPos.before(),
              resolvedPos.after(),
              resolvedPos.before(),
              resolvedPos.after(),
              new Slice(
                Fragment.from([
                  EditorSchema.node("bullet_list", null, [
                    EditorSchema.node("list_item"),
                  ]),
                ]),
                0,
                0,
              ),
              2,
              true,
            ),
          );
        }
      }

      // assuming we only have two blocks li and p
      if (patch.value === "paragraph") {
        tr.step(
          new ReplaceAroundStep(
            resolvedPos.before() - 2,
            resolvedPos.after() + 2,
            resolvedPos.before(),
            resolvedPos.after(),
            Slice.empty,
            0,
            true,
          ),
        );
      }
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
