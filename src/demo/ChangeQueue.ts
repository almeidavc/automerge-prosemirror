import { next as Automerge } from "@automerge/automerge";

export class ChangeQueue {
  public changes: Automerge.Change[] = [];

  enqueue(change: Automerge.Change[]) {
    this.changes.push(change);
  }

  flush() {
    const changes = this.changes;
    this.changes = [];
    return changes;
  }
}
