import { EditorState, Plugin } from "prosemirror-state";
import { DocType } from "../App.tsx";
import { Doc } from "@automerge/automerge";
import * as Automerge from "@automerge/automerge";

export type AutomergePlugin = Plugin<AutomergePluginState>;

interface AutomergePluginState {
  lastHeads: Automerge.Heads;
}

export function getLastHeads(plugin: AutomergePlugin, state: EditorState) {
  return plugin.getState(state)?.lastHeads;
}

export function automergePlugin(doc: Doc<DocType>) {
  return new Plugin<AutomergePluginState>({
    state: {
      init() {
        return {
          lastHeads: Automerge.getHeads(doc),
        };
      },
      apply(tr, value) {
        if (tr.getMeta("newHeads")) {
          return { lastHeads: tr.getMeta("newHeads") };
        }
        return value;
      },
      toJSON(value) {
        return value;
      },
    },
  });
}
