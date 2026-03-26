/**
 * StateManager - Plain TypeScript port of FeedbackContext
 * Manages feedback state with event-driven change notifications
 */

import type { Feedback, Draft, StorageManager } from '@feedbacker/core';
import { FeedbackEventEmitter, logger } from '@feedbacker/core';
import type { ComponentInfo } from '@feedbacker/detection';

export class StateManager {
  private _feedbacks: Feedback[] = [];
  private _draft: Draft | null = null;
  private _isActive = false;
  private storage: StorageManager;
  readonly events = new FeedbackEventEmitter();

  constructor(storage: StorageManager) {
    this.storage = storage;
  }

  get feedbacks(): Feedback[] {
    return this._feedbacks;
  }

  get draft(): Draft | null {
    return this._draft;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  async init(): Promise<void> {
    try {
      this._feedbacks = await this.storage.getAll();
      this._draft = await this.storage.getDraft();
    } catch (error) {
      logger.error('Failed to initialize state:', error);
    }
  }

  async addFeedback(feedback: Feedback): Promise<void> {
    try {
      await this.storage.save(feedback);
      this._feedbacks = await this.storage.getAll();
      this._draft = null;
      this.events.emit('feedback:submit', feedback);
    } catch (error) {
      logger.error('Failed to add feedback:', error);
      throw error;
    }
  }

  async deleteFeedback(id: string): Promise<void> {
    try {
      await this.storage.delete(id);
      this._feedbacks = await this.storage.getAll();
    } catch (error) {
      logger.error('Failed to delete feedback:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      await this.storage.clear();
      this._feedbacks = [];
      this._draft = null;
    } catch (error) {
      logger.error('Failed to clear all:', error);
      throw error;
    }
  }

  async saveDraft(componentInfo: ComponentInfo, comment: string, screenshot?: string): Promise<void> {
    const now = new Date().toISOString();
    const draft: Draft = {
      componentInfo,
      comment,
      screenshot,
      createdAt: this._draft?.createdAt || now,
      updatedAt: now
    };

    try {
      await this.storage.saveDraft(draft);
      this._draft = draft;
      this.events.emit('draft:save', draft);
    } catch (error) {
      logger.error('Failed to save draft:', error);
    }
  }

  async clearDraft(): Promise<void> {
    this._draft = null;
    try {
      // Save store without draft
      const feedbacks = await this.storage.getAll();
      // Re-save each to ensure draft is cleared
      await this.storage.clear();
      for (const f of feedbacks) {
        await this.storage.save(f);
      }
      this.events.emit('draft:clear');
    } catch (error) {
      logger.error('Failed to clear draft:', error);
    }
  }

  setActive(active: boolean): void {
    this._isActive = active;
    if (active) {
      this.events.emit('selection:start');
    } else {
      this.events.emit('selection:cancel');
    }
  }
}
