import { Command } from "prosemirror-state";

export type SplitBlockMeta = {
  action: "splitBlock";
  from: number;
  type: string;
};

export const splitBlock: Command = (state, dispatch) => {
  // TODO: handle non-empty selection
  if (!state.selection.empty) {
    return false;
  }

  const { $from } = state.selection;

  const type =
    $from.node($from.depth - 1).type.name === "list_item"
      ? "li"
      : $from.parent.type.name;

  const splitBlockMeta: SplitBlockMeta = {
    action: "splitBlock",
    from: $from.pos,
    type: type,
  };
  const tr = state.tr.setMeta("_blocks", splitBlockMeta);

  if (dispatch) {
    dispatch(tr);
  }

  return true;
};
