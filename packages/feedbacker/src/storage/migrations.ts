/**
 * Data migration utilities for handling version changes in stored data
 */

import { FeedbackStore } from './StorageManager';
import { Feedback, Draft, BrowserInfo } from '../types';
import logger from '../utils/logger';

export interface MigrationResult {
  success: boolean;
  data?: FeedbackStore;
  error?: string;
}

type MigrationFunction = (data: any) => FeedbackStore | null;

/**
 * Migration registry mapping version patterns to migration functions
 */
const migrations: Record<string, MigrationFunction> = {
  '0.1.0': migrateFrom_0_1_0,
  '0.2.0': migrateFrom_0_2_0,
  legacy: migrateLegacyData
};

/**
 * Main migration function that handles data migration between versions
 */
export async function migrateData(
  oldData: any,
  targetVersion: string
): Promise<FeedbackStore | null> {
  try {
    if (!oldData) {
      return null;
    }

    // If no version is present, try legacy migration
    if (!oldData.version) {
      logger.info('No version found, attempting legacy migration');
      return migrations.legacy(oldData);
    }

    const sourceVersion = oldData.version;

    // If versions match, no migration needed (but validate structure)
    if (sourceVersion === targetVersion) {
      return validateAndNormalize(oldData);
    }

    // Determine which migration to use
    const migrationKey = getMigrationKey(sourceVersion);
    const migrationFn = migrations[migrationKey];

    if (!migrationFn) {
      logger.warn(`No migration available for version ${sourceVersion}`);
      return null;
    }

    logger.info(`Migrating data from ${sourceVersion} to ${targetVersion}`);
    const migratedData = migrationFn(oldData);

    if (migratedData) {
      // Update version to target
      migratedData.version = targetVersion;
      return validateAndNormalize(migratedData);
    }

    return null;
  } catch (error) {
    logger.error('Migration error:', error);
    return null;
  }
}

/**
 * Get migration key based on source version
 */
function getMigrationKey(version: string): string {
  if (version.startsWith('0.1.')) {
    return '0.1.0';
  }
  if (version.startsWith('0.2.')) {
    return '0.2.0';
  }
  return 'legacy';
}

/**
 * Validate and normalize the data structure
 */
function validateAndNormalize(data: any): FeedbackStore | null {
  try {
    const store: FeedbackStore = {
      version: data.version || '1.0.0',
      feedbacks: [],
      draft: undefined,
      settings: data.settings || {}
    };

    // Validate and normalize feedbacks
    if (Array.isArray(data.feedbacks)) {
      store.feedbacks = data.feedbacks
        .map(normalizeFeedback)
        .filter((f: Feedback | null): f is Feedback => f !== null);
    }

    // Validate and normalize draft
    if (data.draft && typeof data.draft === 'object') {
      const draft = normalizeDraft(data.draft);
      store.draft = draft || undefined;
    }

    return store;
  } catch (error) {
    logger.error('Data normalization error:', error);
    return null;
  }
}

/**
 * Normalize a feedback object
 */
function normalizeFeedback(feedback: any): Feedback | null {
  try {
    if (!feedback || typeof feedback !== 'object') {
      return null;
    }

    // Required fields
    if (!feedback.id || !feedback.componentName || !feedback.comment || !feedback.timestamp) {
      return null;
    }

    const normalized: Feedback = {
      id: String(feedback.id),
      componentName: String(feedback.componentName),
      componentPath: Array.isArray(feedback.componentPath) ? feedback.componentPath : [],
      comment: String(feedback.comment),
      screenshot: feedback.screenshot ? String(feedback.screenshot) : undefined,
      url: feedback.url ? String(feedback.url) : window.location.href,
      timestamp: String(feedback.timestamp),
      browserInfo: normalizeBrowserInfo(feedback.browserInfo),
      metadata: feedback.metadata && typeof feedback.metadata === 'object' ? feedback.metadata : {}
    };

    return normalized;
  } catch (error) {
    logger.warn('Failed to normalize feedback:', error);
    return null;
  }
}

/**
 * Normalize a draft object
 */
function normalizeDraft(draft: any): Draft | null {
  try {
    if (!draft || typeof draft !== 'object') {
      return null;
    }

    if (!draft.componentInfo || !draft.comment) {
      return null;
    }

    return {
      componentInfo: {
        name: String(draft.componentInfo.name || 'Unknown'),
        path: Array.isArray(draft.componentInfo.path) ? draft.componentInfo.path : [],
        element: draft.componentInfo.element, // Keep as-is, will be revalidated when used
        props: draft.componentInfo.props || {},
        fiber: draft.componentInfo.fiber
      },
      comment: String(draft.comment),
      screenshot: draft.screenshot ? String(draft.screenshot) : undefined,
      createdAt: String(draft.createdAt || new Date().toISOString()),
      updatedAt: String(draft.updatedAt || new Date().toISOString())
    };
  } catch (error) {
    logger.warn('Failed to normalize draft:', error);
    return null;
  }
}

/**
 * Normalize browser info
 */
function normalizeBrowserInfo(browserInfo: any): BrowserInfo {
  const defaultInfo: BrowserInfo = {
    userAgent: navigator.userAgent || 'Unknown',
    viewport: {
      width: window.innerWidth || 1024,
      height: window.innerHeight || 768
    },
    platform: navigator.platform || 'Unknown'
  };

  if (!browserInfo || typeof browserInfo !== 'object') {
    return defaultInfo;
  }

  return {
    userAgent: String(browserInfo.userAgent || defaultInfo.userAgent),
    viewport: {
      width: Number(browserInfo.viewport?.width) || defaultInfo.viewport.width,
      height: Number(browserInfo.viewport?.height) || defaultInfo.viewport.height
    },
    platform: String(browserInfo.platform || defaultInfo.platform)
  };
}

/**
 * Migration from version 0.1.x
 * Handles early version with basic structure
 */
function migrateFrom_0_1_0(data: any): FeedbackStore | null {
  try {
    return {
      version: '1.0.0',
      feedbacks: Array.isArray(data.items)
        ? data.items
            .map((item: any) => ({
              id: item.id || generateId(),
              componentName: item.component || 'Unknown',
              componentPath: [],
              comment: item.text || item.comment || '',
              screenshot: item.image,
              url: item.url || window.location.href,
              timestamp: item.date || item.timestamp || new Date().toISOString(),
              browserInfo: {
                userAgent: navigator.userAgent,
                viewport: { width: window.innerWidth, height: window.innerHeight },
                platform: navigator.platform
              }
            }))
            .filter((f: any) => f.comment)
        : [],
      settings: data.config || {}
    };
  } catch (error) {
    logger.error('0.1.0 migration failed:', error);
    return null;
  }
}

/**
 * Migration from version 0.2.x
 * Handles intermediate version with improved structure
 */
function migrateFrom_0_2_0(data: any): FeedbackStore | null {
  try {
    return {
      version: '1.0.0',
      feedbacks: Array.isArray(data.feedbacks)
        ? data.feedbacks.map((feedback: any) => ({
            ...feedback,
            id: feedback.id || generateId(),
            componentPath: feedback.componentPath || [],
            browserInfo: feedback.browserInfo || {
              userAgent: navigator.userAgent,
              viewport: { width: window.innerWidth, height: window.innerHeight },
              platform: navigator.platform
            }
          }))
        : [],
      draft: data.currentDraft
        ? {
            componentInfo: data.currentDraft.component || {
              name: 'Unknown',
              path: [],
              element: null
            },
            comment: data.currentDraft.comment || '',
            screenshot: data.currentDraft.screenshot,
            createdAt: data.currentDraft.created || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        : undefined,
      settings: data.settings || {}
    };
  } catch (error) {
    logger.error('0.2.0 migration failed:', error);
    return null;
  }
}

/**
 * Migration for legacy data (pre-versioning)
 * Handles various legacy formats
 */
function migrateLegacyData(data: any): FeedbackStore | null {
  try {
    // Handle array of feedback items (oldest format)
    if (Array.isArray(data)) {
      return {
        version: '1.0.0',
        feedbacks: data
          .map((item: any) => ({
            id: item.id || generateId(),
            componentName: item.componentName || item.component || 'Unknown',
            componentPath: item.path || [],
            comment: item.comment || item.text || '',
            screenshot: item.screenshot || item.image,
            url: item.url || window.location.href,
            timestamp: item.timestamp || item.date || new Date().toISOString(),
            browserInfo: {
              userAgent: navigator.userAgent,
              viewport: { width: window.innerWidth, height: window.innerHeight },
              platform: navigator.platform
            }
          }))
          .filter((f: any) => f.comment),
        settings: {}
      };
    }

    // Handle object with unknown structure
    if (data && typeof data === 'object') {
      const feedbacks = data.feedbacks || data.items || data.list || [];
      return {
        version: '1.0.0',
        feedbacks: Array.isArray(feedbacks)
          ? feedbacks
              .map(normalizeFeedback)
              .filter((f: Feedback | null): f is Feedback => f !== null)
          : [],
        settings: data.settings || data.config || {}
      };
    }

    return null;
  } catch (error) {
    logger.error('Legacy migration failed:', error);
    return null;
  }
}

/**
 * Generate a unique ID for feedback items
 */
function generateId(): string {
  return `fb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if migration is needed
 */
export function needsMigration(data: any, currentVersion: string): boolean {
  if (!data) {
    return false;
  }

  // No version means legacy data
  if (!data.version) {
    return true;
  }

  // Different version means migration needed
  return data.version !== currentVersion;
}

/**
 * Get migration info for a given data structure
 */
export function getMigrationInfo(data: any, currentVersion: string) {
  return {
    hasData: !!data,
    sourceVersion: data?.version || 'legacy',
    targetVersion: currentVersion,
    needsMigration: needsMigration(data, currentVersion),
    migrationAvailable: !!getMigrationKey(data?.version || 'legacy')
  };
}
