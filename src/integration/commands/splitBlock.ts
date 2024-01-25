import { Command } from "prosemirror-state";

export type SplitBlockMeta = {
  action: "splitBlock";
  from: number;
  type: string;
};

export const splitBlock: Command = (state, dispatch) => {
  let tr = state.tr;

  const { $from, $to } = state.selection;

  if (!state.selection.empty) {
    tr = tr.delete($from.pos, $to.pos);
  }

  const type =
    $from.node($from.depth - 1).type.name === "list_item"
      ? "li"
      : $from.parent.type.name;
  const splitBlockMeta: SplitBlockMeta = {
    action: "splitBlock",
    from: $from.pos,
    type: type,
  };
  tr = tr.setMeta("_blocks", splitBlockMeta);

  if (dispatch) {
    dispatch(tr);
  }
  return true;
};
