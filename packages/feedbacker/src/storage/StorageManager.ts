/**
 * StorageManager - Manages localStorage operations with version support,
 * migration functionality, quota detection, corruption recovery, and fallback
 */

import { Feedback, Draft, StorageManager as IStorageManager, StorageInfo, FeedbackStore } from '../types';
import { migrateData } from './migrations';
import { validateStorageData } from '../utils/validation';
import { sanitizeFeedback } from '../utils/sanitize';

// Re-export the interfaces from types for convenience
export type { FeedbackStore, StorageInfo, StorageManager } from '../types';

const STORAGE_VERSION = '1.0.0';
const DEFAULT_STORAGE_KEY = 'feedbacker';
const STORAGE_LIMIT = 5 * 1024 * 1024; // 5MB in bytes
const MAX_FEEDBACKS = 100; // Prevent unlimited growth

export class LocalStorageManager implements IStorageManager {
  private key: string;
  private version: string;
  private inMemoryFallback: FeedbackStore;
  private useMemoryFallback: boolean = false;

  constructor(key: string = DEFAULT_STORAGE_KEY) {
    this.key = key;
    this.version = STORAGE_VERSION;
    this.inMemoryFallback = {
      version: this.version,
      feedbacks: [],
      draft: undefined,
      settings: {}
    };

    // Test localStorage availability
    this.testStorageAvailability();
  }

  /**
   * Test if localStorage is available and functional
   */
  private testStorageAvailability(): void {
    try {
      const testKey = `${this.key}_test`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
    } catch (error) {
      console.warn('[Feedbacker] localStorage not available, using memory fallback:', error);
      this.useMemoryFallback = true;
    }
  }

  /**
   * Save a feedback item
   */
  async save(feedback: Feedback): Promise<void> {
    try {
      // Sanitize the feedback data
      const sanitizedFeedback = sanitizeFeedback(feedback);
      
      const store = await this.getStore();
      
      // Check if updating existing or adding new
      const existingIndex = store.feedbacks.findIndex(f => f.id === sanitizedFeedback.id);
      
      if (existingIndex >= 0) {
        store.feedbacks[existingIndex] = sanitizedFeedback;
      } else {
        // Add new feedback
        store.feedbacks.unshift(sanitizedFeedback);
        
        // Enforce max limit to prevent unlimited growth
        if (store.feedbacks.length > MAX_FEEDBACKS) {
          store.feedbacks = store.feedbacks.slice(0, MAX_FEEDBACKS);
        }
      }

      // Clear draft if it exists
      store.draft = undefined;

      await this.setStore(store);
    } catch (error) {
      console.error('[Feedbacker] Failed to save feedback:', error);
      throw new Error('Failed to save feedback');
    }
  }

  /**
   * Save a draft feedback
   */
  async saveDraft(draft: Draft): Promise<void> {
    try {
      const store = await this.getStore();
      store.draft = draft;
      await this.setStore(store);
    } catch (error) {
      console.error('[Feedbacker] Failed to save draft:', error);
      throw new Error('Failed to save draft');
    }
  }

  /**
   * Get all feedback items
   */
  async getAll(): Promise<Feedback[]> {
    try {
      const store = await this.getStore();
      return store.feedbacks || [];
    } catch (error) {
      console.error('[Feedbacker] Failed to get feedback items:', error);
      return [];
    }
  }

  /**
   * Get draft feedback
   */
  async getDraft(): Promise<Draft | null> {
    try {
      const store = await this.getStore();
      return store.draft || null;
    } catch (error) {
      console.error('[Feedbacker] Failed to get draft:', error);
      return null;
    }
  }

  /**
   * Delete a specific feedback item
   */
  async delete(id: string): Promise<void> {
    try {
      const store = await this.getStore();
      store.feedbacks = store.feedbacks.filter(f => f.id !== id);
      await this.setStore(store);
    } catch (error) {
      console.error('[Feedbacker] Failed to delete feedback:', error);
      throw new Error('Failed to delete feedback');
    }
  }

  /**
   * Clear all feedback data
   */
  async clear(): Promise<void> {
    try {
      const store: FeedbackStore = {
        version: this.version,
        feedbacks: [],
        draft: undefined,
        settings: {}
      };
      await this.setStore(store);
    } catch (error) {
      console.error('[Feedbacker] Failed to clear feedback data:', error);
      throw new Error('Failed to clear feedback data');
    }
  }

  /**
   * Get storage usage information
   */
  getStorageInfo(): StorageInfo {
    try {
      let used = 0;
      let total = 0;

      if (this.useMemoryFallback) {
        // For memory fallback, estimate based on JSON size
        const data = JSON.stringify(this.inMemoryFallback);
        used = new Blob([data]).size;
        total = STORAGE_LIMIT; // Use our limit as reference
      } else {
        // Calculate localStorage usage
        for (let key in localStorage) {
          if (localStorage.hasOwnProperty(key)) {
            used += localStorage[key].length + key.length;
          }
        }
        
        // Use a reasonable estimate for localStorage limit
        // Different browsers have different limits, but 5-10MB is common
        total = STORAGE_LIMIT;
      }

      const available = Math.max(0, total - used);
      const percentage = total > 0 ? (used / total) * 100 : 0;

      return {
        used,
        limit: total,
        available,
        percentage
      };
    } catch (error) {
      console.error('[Feedbacker] Failed to get storage info:', error);
      return {
        used: 0,
        limit: STORAGE_LIMIT,
        available: STORAGE_LIMIT,
        percentage: 0
      };
    }
  }

  /**
   * Cleanup old feedback items if storage is getting full
   */
  async cleanup(): Promise<void> {
    try {
      const storageInfo = this.getStorageInfo();
      
      // If storage is more than 80% full, remove older feedback
      if (storageInfo.percentage > 80) {
        const store = await this.getStore();
        
        // Sort by timestamp and keep only the 50 most recent
        store.feedbacks = store.feedbacks
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 50);

        store.lastCleanup = new Date().toISOString();
        await this.setStore(store);

        console.log('[Feedbacker] Storage cleanup completed, removed old feedback items');
      }
    } catch (error) {
      console.error('[Feedbacker] Failed to cleanup storage:', error);
    }
  }

  /**
   * Get the feedback store from storage
   */
  private async getStore(): Promise<FeedbackStore> {
    try {
      if (this.useMemoryFallback) {
        return { ...this.inMemoryFallback };
      }

      const data = localStorage.getItem(this.key);
      
      if (!data) {
        return this.getDefaultStore();
      }

      let parsedData;
      try {
        parsedData = JSON.parse(data);
      } catch (parseError) {
        console.warn('[Feedbacker] Corrupted data detected, clearing storage');
        await this.handleCorruptedData();
        return this.getDefaultStore();
      }

      // Validate the data structure
      if (!validateStorageData(parsedData)) {
        console.warn('[Feedbacker] Invalid data structure, attempting migration');
        return await this.handleDataMigration(parsedData);
      }

      // Check if migration is needed
      if (parsedData.version !== this.version) {
        return await this.handleDataMigration(parsedData);
      }

      return parsedData;
    } catch (error) {
      console.error('[Feedbacker] Failed to get store:', error);
      return this.getDefaultStore();
    }
  }

  /**
   * Set the feedback store in storage
   */
  private async setStore(store: FeedbackStore): Promise<void> {
    try {
      if (this.useMemoryFallback) {
        this.inMemoryFallback = { ...store };
        return;
      }

      const data = JSON.stringify(store);
      
      // Check if we're approaching storage limits
      if (data.length > STORAGE_LIMIT * 0.9) {
        console.warn('[Feedbacker] Approaching storage limit, triggering cleanup');
        await this.cleanup();
        
        // Re-serialize after cleanup
        const updatedData = JSON.stringify(store);
        if (updatedData.length > STORAGE_LIMIT) {
          throw new Error('Storage limit exceeded even after cleanup');
        }
      }

      localStorage.setItem(this.key, data);
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.message.includes('storage')) {
        console.warn('[Feedbacker] Storage quota exceeded, switching to memory fallback');
        this.useMemoryFallback = true;
        this.inMemoryFallback = { ...store };
      } else {
        throw error;
      }
    }
  }

  /**
   * Get default/empty store
   */
  private getDefaultStore(): FeedbackStore {
    return {
      version: this.version,
      feedbacks: [],
      draft: undefined,
      settings: {}
    };
  }

  /**
   * Handle corrupted data by clearing storage
   */
  private async handleCorruptedData(): Promise<void> {
    try {
      if (!this.useMemoryFallback) {
        localStorage.removeItem(this.key);
      }
      this.inMemoryFallback = this.getDefaultStore();
    } catch (error) {
      console.error('[Feedbacker] Failed to handle corrupted data:', error);
    }
  }

  /**
   * Handle data migration
   */
  private async handleDataMigration(oldData: any): Promise<FeedbackStore> {
    try {
      const migratedData = await migrateData(oldData, this.version);
      
      if (migratedData) {
        await this.setStore(migratedData);
        console.log('[Feedbacker] Data migration completed successfully');
        return migratedData;
      } else {
        console.warn('[Feedbacker] Data migration failed, starting with fresh data');
        return this.getDefaultStore();
      }
    } catch (error) {
      console.error('[Feedbacker] Data migration error:', error);
      return this.getDefaultStore();
    }
  }
}

/**
 * Create a storage manager instance
 */
export const createStorageManager = (key?: string): IStorageManager => {
  return new LocalStorageManager(key);
};