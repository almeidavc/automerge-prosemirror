import React from "react";
import { EditorView } from "prosemirror-view";
import { Repo } from "@automerge/automerge-repo";
import { DocType } from "../../src/App.tsx";
import { Editor } from "../../src/Editor.tsx";
import { Span } from "../../src/integration/tmp.ts";

export const PM_EDITOR = ".ProseMirror[contenteditable]";

export function setupEditor(ref?: React.RefObject<EditorView>) {
  const repo = new Repo({
    network: [],
  });
  const docHandle = repo.create<DocType>();
  docHandle.change((doc) => {
    doc.text = "";
  });
  cy.mount(
    <Editor
      viewRef={ref}
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
