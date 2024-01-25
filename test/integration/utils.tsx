import React from "react";
import { EditorView } from "prosemirror-view";
import { Repo } from "@automerge/automerge-repo";
import { DocType } from "../../src/App.tsx";
import { Editor } from "../../src/Editor.tsx";
import { Span } from "../../src/integration/tmp.ts";
import { initDoc } from "../../src/integration/initDoc.ts";
import { next as Automerge } from "@automerge/automerge";
import { Node } from "prosemirror-model";

export const PM_EDITOR = ".ProseMirror[contenteditable]";

export function mountEditor(
  ref?: React.RefObject<EditorView>,
  pmDoc?: Node,
  amDoc?: Automerge.Doc<DocType>,
) {
  const repo = new Repo({ network: [] });
  const docHandle = repo.create<DocType>();

  if (amDoc) {
    docHandle.update(() => amDoc);
  } else {
    initDoc(docHandle);
  }

  cy.mount(
    <Editor
      viewRef={ref}
      initialPmDoc={pmDoc}
      docHandle={docHandle}
      path={["text"]}
      sync={{
        subscribeToChanges: (handler) => {
          docHandle.on("change", handler);
        },
        unsubscribe: (handler) => {
          docHandle?.removeListener("change", handler);
        },
      }}
    />,
  );

  return docHandle;
}

// The intended way for removing a mark using the Automerge API is to set the mark's value to null
// This function removes marks with the value null, so that inactive marks -- marks that were never present and marks
// that were added but then removed -- have a single representation
export function assertAmSpans(actual: Span[], expected: Span[]) {
  const actualPatched = actual.map((span) => {
    const activeMarks = Object.entries(span.marks || {}).filter(
      ([, v]) => v !== null,
    );

    if (activeMarks.length) {
      return {
        ...span,
        marks: Object.fromEntries(activeMarks),
      };
    }

    const spanWithoutMarks = { ...span };
    delete spanWithoutMarks.marks;
    return spanWithoutMarks;
  });

  expect(actualPatched).to.deep.equal(expected);
}
