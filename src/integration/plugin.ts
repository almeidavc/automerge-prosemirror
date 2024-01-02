import { EditorState, Plugin } from "prosemirror-state";
import { DocType } from "../App.tsx";
import { Doc } from "@automerge/automerge";
import { next as Automerge } from "@automerge/automerge";
import { Span } from "./tmp.ts";

export type AutomergePlugin = Plugin<AutomergePluginState>;

interface AutomergePluginState {
  lastHeads: Automerge.Heads;
  // at the moment we have to pass spans, because this doesn't work as intended:
  // const docAtLastHeads = Automerge.view(doc, lastHeads)
  // const spans = Automerge.spans(docAtLastHeads, path)
  lastSpans: Span[];
}

export function getLastHeads(plugin: AutomergePlugin, state: EditorState) {
  return plugin.getState(state)!.lastHeads;
}

export function getLastSpans(plugin: AutomergePlugin, state: EditorState) {
  return plugin.getState(state)!.lastSpans;
}

export function automergePlugin(doc: Doc<DocType>, path: Automerge.Prop[]) {
  return new Plugin<AutomergePluginState>({
    state: {
      init() {
        return {
          lastHeads: Automerge.getHeads(doc),
          lastSpans: Automerge.spans(doc, path.slice()),
        };
      },
      apply(tr, value) {
        return {
          lastHeads: tr.getMeta("newHeads") || value.lastHeads,
          lastSpans: tr.getMeta("newSpans") || value.lastSpans,
        };
      },
      toJSON(value) {
        return value;
      },
    },
  });
}
