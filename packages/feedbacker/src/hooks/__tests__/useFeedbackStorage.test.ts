import { renderHook, act, waitFor } from '@testing-library/react';
import { useFeedbackStorage } from '../useFeedbackStorage';
import type { Feedback, Draft } from '../../types';

// Mock storage manager
const mockGetAll = jest.fn<Promise<Feedback[]>, []>();
const mockGetDraft = jest.fn<Promise<Draft | null>, []>();
const mockSave = jest.fn<Promise<void>, [Feedback]>();
const mockSaveDraft = jest.fn<Promise<void>, [Draft]>();
const mockDelete = jest.fn<Promise<void>, [string]>();
const mockClear = jest.fn<Promise<void>, []>();
const mockCleanup = jest.fn<Promise<void>, []>();
const mockGetStorageInfo = jest.fn(() => ({
  used: 0,
  limit: 5000000,
  available: 5000000,
  percentage: 0
}));

jest.mock('../../storage/StorageManager', () => ({
  createStorageManager: jest.fn(() => ({
    getAll: mockGetAll,
    getDraft: mockGetDraft,
    save: mockSave,
    saveDraft: mockSaveDraft,
    delete: mockDelete,
    clear: mockClear,
    cleanup: mockCleanup,
    getStorageInfo: mockGetStorageInfo
  }))
}));

// Mock context
const mockAddFeedback = jest.fn();
const mockLoadFeedbackFromStorage = jest.fn();
const mockSaveDraftContext = jest.fn();
const mockClearDraft = jest.fn();
const mockSetContextError = jest.fn();
let mockFeedbacks: Feedback[] = [];
let mockDraft: Draft | null = null;

jest.mock('../../context/FeedbackContext', () => ({
  useFeedbackContext: () => ({
    feedbacks: mockFeedbacks,
    draft: mockDraft,
    addFeedback: mockAddFeedback,
    loadFeedbackFromStorage: mockLoadFeedbackFromStorage,
    saveDraft: mockSaveDraftContext,
    clearDraft: mockClearDraft,
    setError: mockSetContextError
  })
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }
}));

const makeFeedback = (id = 'fb-1'): Feedback => ({
  id,
  componentName: 'Button',
  componentPath: ['App', 'Button'],
  comment: 'Test',
  url: 'http://localhost',
  timestamp: '2026-01-01T00:00:00.000Z',
  browserInfo: { userAgent: 'test', viewport: { width: 1024, height: 768 } }
});

describe('useFeedbackStorage', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockFeedbacks = [];
    mockDraft = null;
    mockGetAll.mockResolvedValue([]);
    mockGetDraft.mockResolvedValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should start with isLoading true and set it to false after initial load', async () => {
    // Protects against: UI showing stale data while storage is still loading
    mockGetAll.mockResolvedValue([]);
    mockGetDraft.mockResolvedValue(null);

    const { result } = renderHook(() => useFeedbackStorage('test-key'));

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should load stored feedbacks into context on mount', async () => {
    // Protects against: previously saved feedbacks not restored on page reload
    const stored = [makeFeedback('stored-1'), makeFeedback('stored-2')];
    mockGetAll.mockResolvedValue(stored);
    mockGetDraft.mockResolvedValue(null);

    renderHook(() => useFeedbackStorage());

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(mockLoadFeedbackFromStorage).toHaveBeenCalledTimes(2);
    expect(mockLoadFeedbackFromStorage).toHaveBeenCalledWith(stored[0]);
    expect(mockLoadFeedbackFromStorage).toHaveBeenCalledWith(stored[1]);
  });

  it('should restore a stored draft on mount', async () => {
    // Protects against: user losing in-progress feedback after page refresh
    const draft: Draft = {
      componentInfo: {
        componentName: 'Input',
        componentPath: ['App', 'Input'],
        element: null as any
      },
      comment: 'WIP feedback',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z'
    };
    mockGetAll.mockResolvedValue([]);
    mockGetDraft.mockResolvedValue(draft);

    renderHook(() => useFeedbackStorage());

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(mockSaveDraftContext).toHaveBeenCalledWith(
      draft.componentInfo,
      draft.comment,
      draft.screenshot
    );
  });

  it('should set error state when initial load fails', async () => {
    // Protects against: silent failures hiding storage corruption from the user
    const storageError = new Error('IndexedDB unavailable');
    mockGetAll.mockRejectedValue(storageError);

    let hookResult: { current: ReturnType<typeof useFeedbackStorage> };

    await act(async () => {
      const rendered = renderHook(() => useFeedbackStorage());
      hookResult = rendered.result;
      // Flush the microtask queue so the rejected promise settles
      await Promise.resolve();
      // Advance timers to flush debounced effects
      jest.runAllTimers();
      await Promise.resolve();
    });

    expect(hookResult!.current.error).toBeInstanceOf(Error);
    expect(hookResult!.current.error!.message).toBe('IndexedDB unavailable');
    expect(mockSetContextError).toHaveBeenCalledWith(storageError);
  });

  it('should debounce saving feedbacks to storage', async () => {
    // Protects against: excessive storage writes on rapid feedback changes
    mockFeedbacks = [makeFeedback('fb-1')];

    renderHook(() => useFeedbackStorage());

    // Before timer fires, save should not have been called (beyond the initial load effect)
    expect(mockSave).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(500);
      await jest.runAllTimersAsync();
    });

    expect(mockSave).toHaveBeenCalledWith(mockFeedbacks[0]);
  });

  it('should expose a refresh function that reloads from storage', async () => {
    // Protects against: stale UI state when external process modifies storage
    mockGetAll.mockResolvedValue([]);
    mockGetDraft.mockResolvedValue(null);

    const { result } = renderHook(() => useFeedbackStorage());

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    // Now setup for refresh
    const refreshedFeedback = makeFeedback('refreshed');
    mockGetAll.mockResolvedValue([refreshedFeedback]);

    await act(async () => {
      await result.current.refresh();
    });

    expect(mockAddFeedback).toHaveBeenCalledWith(refreshedFeedback);
  });

  it('should return feedbacks array from context', async () => {
    // Protects against: hook returning wrong data source instead of context feedbacks
    mockFeedbacks = [makeFeedback('ctx-1')];

    const { result } = renderHook(() => useFeedbackStorage());

    await act(async () => {
      await jest.runAllTimersAsync();
    });

    expect(result.current.feedbacks).toBe(mockFeedbacks);
    expect(result.current.feedbacks).toHaveLength(1);
    expect(result.current.feedbacks[0].id).toBe('ctx-1');
  });
});
