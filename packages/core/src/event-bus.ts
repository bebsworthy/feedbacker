/**
 * FeedbackEventEmitter - Framework-agnostic event bus for Feedbacker
 * Provides pub/sub pattern for component interactions
 */

import { EventType, EventListener } from './event-types';
import logger from './logger';

export class FeedbackEventEmitter {
  private listeners: Map<EventType, Set<EventListener>> = new Map();
  private onceListeners: Map<EventType, Set<EventListener>> = new Map();

  emit(type: EventType, payload?: any): void {
    // Regular listeners
    const typeListeners = this.listeners.get(type);
    if (typeListeners) {
      typeListeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          logger.error(`Event listener error for ${type}:`, error);
        }
      });
    }

    // Once listeners
    const onceTypeListeners = this.onceListeners.get(type);
    if (onceTypeListeners) {
      onceTypeListeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (error) {
          logger.error(`Once event listener error for ${type}:`, error);
        }
      });

      // Clear once listeners after execution
      this.onceListeners.delete(type);
    }
  }

  on<T = any>(type: EventType, listener: EventListener<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const typeListeners = this.listeners.get(type)!;
    typeListeners.add(listener);

    // Return cleanup function
    return () => {
      typeListeners.delete(listener);
      if (typeListeners.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  once<T = any>(type: EventType, listener: EventListener<T>): () => void {
    if (!this.onceListeners.has(type)) {
      this.onceListeners.set(type, new Set());
    }

    const onceTypeListeners = this.onceListeners.get(type)!;
    onceTypeListeners.add(listener);

    // Return cleanup function
    return () => {
      onceTypeListeners.delete(listener);
      if (onceTypeListeners.size === 0) {
        this.onceListeners.delete(type);
      }
    };
  }

  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }
}
