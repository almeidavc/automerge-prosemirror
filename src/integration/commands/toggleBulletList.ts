import { Command } from "prosemirror-state";

export type UpdateBlockMeta = {
  action: "updateBlock";
  // start points to the position after the block's start tag
  start: number;
  prop: string;
  value: string;
};

export const toggleBulletList: Command = (state, dispatch) => {
  // TODO: toggle multiple blocks if selection spans over multiple blocks
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

// the backspace key maps to this command
export const convertEmptyBulletList: Command = (state, dispatch) => {
  const { $from } = state.selection;
  const node = $from.node($from.depth);
  const parentNode = $from.node($from.depth - 1);
  if (node.content.size === 0 && parentNode.type.name === "list_item") {
    const updateBlockMeta: UpdateBlockMeta = {
      action: "updateBlock",
      start: $from.start(),
      prop: "type",
      value: "paragraph",
    };
    const tr = state.tr.setMeta("_blocks", updateBlockMeta);
    if (dispatch) {
      dispatch(tr);
    }
    return true;
  }
  return false;
};
