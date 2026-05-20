import { EventEmitter } from "node:events";

/**
 * In-process event bus. Producers publish domain events; subscribers can
 * enqueue BullMQ jobs without coupling sockets to workers.
 * Swap for Kafka by implementing the same publish/subscribe interface.
 */
class EventBus extends EventEmitter {
  publish(eventType, payload) {
    this.emit(eventType, payload);
    this.emit("*", { eventType, payload });
  }

  subscribe(eventType, handler) {
    this.on(eventType, handler);
    return () => this.off(eventType, handler);
  }
}

export const eventBus = new EventBus();
