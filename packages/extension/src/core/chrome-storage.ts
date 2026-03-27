/**
 * ChromeStorageManager - Implements StorageManager interface over chrome.storage.local
 * Cross-domain, 10MB default, syncs between extension contexts
 */

import type { Feedback, Draft, StorageManager, StorageInfo, FeedbackStore } from '@feedbacker/core';
import { sanitizeFeedback, sanitizeDraft, validateStorageData, migrateData, logger } from '@feedbacker/core';

const STORAGE_VERSION = '3.0';
const DEFAULT_STORAGE_KEY = 'feedbacker-store';
const STORAGE_LIMIT = 10 * 1024 * 1024; // 10MB chrome.storage.local default
const MAX_FEEDBACKS = 100;

export class ChromeStorageManager implements StorageManager {
  private key: string;
  private version: string;

  constructor(key: string = DEFAULT_STORAGE_KEY) {
    this.key = key;
    this.version = STORAGE_VERSION;
  }

  async save(feedback: Feedback): Promise<void> {
    try {
      const sanitizedFeedback = sanitizeFeedback(feedback);
      const store = await this.getStore();

      const existingIndex = store.feedbacks.findIndex((f) => f.id === sanitizedFeedback.id);

      if (existingIndex >= 0) {
        store.feedbacks[existingIndex] = sanitizedFeedback;
      } else {
        store.feedbacks.unshift(sanitizedFeedback);
        if (store.feedbacks.length > MAX_FEEDBACKS) {
          store.feedbacks = store.feedbacks.slice(0, MAX_FEEDBACKS);
        }
      }

      store.draft = undefined;
      await this.setStore(store);
    } catch (error) {
      logger.error('Failed to save feedback:', error);
      throw new Error('Failed to save feedback');
    }
  }

  async saveDraft(draft: Draft): Promise<void> {
    try {
      const store = await this.getStore();
      store.draft = sanitizeDraft(draft);
      await this.setStore(store);
    } catch (error) {
      logger.error('Failed to save draft:', error);
      throw new Error('Failed to save draft');
    }
  }

  async getAll(): Promise<Feedback[]> {
    try {
      const store = await this.getStore();
      return store.feedbacks || [];
    } catch (error) {
      logger.error('Failed to get feedback items:', error);
      return [];
    }
  }

  async getDraft(): Promise<Draft | null> {
    try {
      const store = await this.getStore();
      return store.draft || null;
    } catch (error) {
      logger.error('Failed to get draft:', error);
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const store = await this.getStore();
      store.feedbacks = store.feedbacks.filter((f) => f.id !== id);
      await this.setStore(store);
    } catch (error) {
      logger.error('Failed to delete feedback:', error);
      throw new Error('Failed to delete feedback');
    }
  }

  async clear(): Promise<void> {
    try {
      await this.setStore(this.getDefaultStore());
    } catch (error) {
      logger.error('Failed to clear feedback data:', error);
      throw new Error('Failed to clear feedback data');
    }
  }

  getStorageInfo(): StorageInfo {
    // chrome.storage.local doesn't have a sync API for size,
    // so we return defaults; actual size checked async in cleanup
    return {
      used: 0,
      limit: STORAGE_LIMIT,
      available: STORAGE_LIMIT,
      percentage: 0
    };
  }

  async cleanup(): Promise<void> {
    try {
      const store = await this.getStore();

      // Keep only the 50 most recent
      if (store.feedbacks.length > 50) {
        store.feedbacks = store.feedbacks
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 50);

        store.lastCleanup = new Date().toISOString();
        await this.setStore(store);
        logger.info('Storage cleanup completed');
      }
    } catch (error) {
      logger.error('Failed to cleanup storage:', error);
    }
  }

  private async getStore(): Promise<FeedbackStore> {
    try {
      const result = await chrome.storage.local.get(this.key);
      const data = result[this.key];

      if (!data) {
        return this.getDefaultStore();
      }

      if (!validateStorageData(data)) {
        logger.warn('Invalid data structure, attempting migration');
        const migrated = await migrateData(data, this.version);
        if (migrated) {
          await this.setStore(migrated);
          return migrated;
        }
        return this.getDefaultStore();
      }

      if (data.version !== this.version) {
        const migrated = await migrateData(data, this.version);
        if (migrated) {
          await this.setStore(migrated);
          return migrated;
        }
        return this.getDefaultStore();
      }

      return data;
    } catch (error) {
      logger.error('Failed to get store:', error);
      return this.getDefaultStore();
    }
  }

  private async setStore(store: FeedbackStore): Promise<void> {
    await chrome.storage.local.set({ [this.key]: store });
  }

  private getDefaultStore(): FeedbackStore {
    return {
      version: this.version,
      feedbacks: [],
      draft: undefined,
      settings: {}
    };
  }
}

export const createChromeStorageManager = (key?: string): StorageManager => {
  return new ChromeStorageManager(key);
};
