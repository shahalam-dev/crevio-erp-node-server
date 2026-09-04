export interface Event<T = any> {
  name: string;
  data: T;
  timestamp?: Date;
}

export abstract class BaseEventEmitter {
  private listeners: Map<string, Array<(data: any) => Promise<void>>> = new Map();

  on<T>(eventName: string, handler: (data: T) => Promise<void>): void {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(handler);
  }

  async emit<T>(event: Event<T>): Promise<void> {
    const handlers = this.listeners.get(event.name) || [];
    const promises = handlers.map(handler => handler(event.data));
    await Promise.all(promises);
  }

  removeAllListeners(eventName?: string): void {
    if (eventName) {
      this.listeners.delete(eventName);
    } else {
      this.listeners.clear();
    }
  }
}
