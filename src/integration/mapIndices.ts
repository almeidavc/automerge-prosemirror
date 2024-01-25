import { Node } from "prosemirror-model";
import { Span } from "./tmp.ts";

// These classes map indices at which insertion of characters is valid.
// ProseMirror indices between end and start tags, for example, are not handled.

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
    let numberOfCharacters = 0;
    let numberOfBlockBoundaries = 0;
    this.#pmDoc.nodesBetween(0, index, (node, pos) => {
      switch (node.type.name) {
        case "text":
          numberOfCharacters +=
            pos + node.nodeSize > index ? index - pos : node.nodeSize;
          break;
        case "bullet_list":
        case "list_item":
          break;
        default:
          numberOfBlockBoundaries += 1;
      }
    });
    return numberOfBlockBoundaries + numberOfCharacters;
  }
}

export class AmToPmIndexMapper {
  readonly #amSpans;

  // TODO: take doc, and path as parameters instead of spans
  constructor(amSpans: Span[]) {
    this.#amSpans = amSpans;
  }

  map(index: number) {
    let currIndex = 0;
    let numberOfTags = 0;
    let numberOfCharacters = 0;
    let prevBlock: Span;
    let nextSpanIdx = 0;
    while (currIndex < index) {
      const nextSpan = this.#amSpans[nextSpanIdx];

      if (nextSpan.type === "block") {
        if (prevBlock) {
          // close previous block
          // if next block is a list item, we only need to close li and p nodes
          // otherwise close also ul node
          numberOfTags +=
            prevBlock.value.type === "li" && nextSpan.value.type === "li"
              ? 2
              : prevBlock.value.type === "li"
                ? 3
                : 1;
        }

        currIndex += 1;

        // open next block
        numberOfTags +=
          prevBlock &&
          nextSpan.value.type === "li" &&
          prevBlock.value.type === "li"
            ? 2
            : nextSpan.value.type === "li"
              ? 3
              : 1;

        prevBlock = nextSpan;
      }

      if (nextSpan.type === "text") {
        if (currIndex + nextSpan.value.length > index) {
          numberOfCharacters += index - currIndex;
          currIndex = index;
        } else {
          numberOfCharacters += nextSpan.value.length;
          currIndex += nextSpan.value.length;
        }
      }

      nextSpanIdx += 1;
    }

    return numberOfCharacters + numberOfTags;
  }
}
