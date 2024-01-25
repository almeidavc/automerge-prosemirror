import { Command } from "prosemirror-state";

export type UpdateBlockMeta = {
  action: "updateBlock";
  // start points to the position after the block's start tag
  start: number;
  prop: string;
  value: string;
};

export const toggleBulletList: Command = (state, dispatch) => {
  // TODO: handle non-empty selection
  if (!state.selection.empty) {
    return false;
  }

  const { $from } = state.selection;

  const updateBlockMeta: UpdateBlockMeta = {
    action: "updateBlock",
    start: $from.start(),
    prop: "type",
    value:
      $from.node($from.depth - 1).type.name !== "list_item"
        ? "li"
        : "paragraph",
  };

  const tr = state.tr.setMeta("_blocks", updateBlockMeta);

  if (dispatch) {
    dispatch(tr);
  }

  return true;
};
