export class Publisher<T> {
  public subscribers: Record<string, (update: T) => void> = {};

  public subscribe(key: string, callback: (update: T) => void): void {
    this.subscribers[key] = callback;
  }

  public unsubscribe(key: string): void {
    if (this.subscribers[key]) {
      delete this.subscribers[key];
    }
  }

  public publish(sender: string, update: T): void {
    for (const [id, callback] of Object.entries(this.subscribers)) {
      if (id === sender) {
        continue;
      }
      callback(update);
    }
  }
}
