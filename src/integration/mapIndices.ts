import { Node } from "prosemirror-model";
import { Span } from "./tmp.ts";

// IMPORTANT: create new instances of this class, when the doc changes, to ensure that indices are mapped correctly
// at the moment, index mappings only depend on the number of blocks, but it's best to always create a new instance
// with the updated doc, when any kind of change to the doc is made

export class PmToAmIndexMapper {
  readonly #pmDoc;

  constructor(pmDoc: Node) {
    this.#pmDoc = pmDoc;
  }

  // we are only handling flat top-level blocks for now
  // subtract one for each preceding block, since in Automerge, blocks don't have end tags
  map(index: number) {
    const resolvedPos = this.#pmDoc.resolve(index);
    const precedingBlocksCount = resolvedPos.index(0);
    return index - precedingBlocksCount;
  }
}

export class AmToPmIndexMapper {
  readonly #amSpans;

  // TODO: take doc, and path as parameters instead of spans
  constructor(amSpans: Span[]) {
    this.#amSpans = amSpans;
  }

  map(index: number) {
    const spans = this.#amSpans;
    let precedingBlocksCount = -1;

    let currIndex = 0;
    for (const span of spans) {
      if (span.type === "block") {
        precedingBlocksCount += 1;
      }

      currIndex +=
        span.type === "text"
          ? span.value.length
          : span.type === "block"
            ? 1
            : 0;

      if (currIndex >= index) {
        break;
      }
    }

    return index + precedingBlocksCount;
  }
}
