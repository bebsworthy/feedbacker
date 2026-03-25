import { renderHook, act } from '@testing-library/react';
import { useFeedback } from '../useFeedback';
import type { Feedback, ExportOptions, Draft } from '../../types';

// Mock context
const mockAddFeedback = jest.fn();
const mockDeleteFeedback = jest.fn();
const mockClearAllFeedbacks = jest.fn();
const mockSetError = jest.fn();
const mockFeedbacks: Feedback[] = [];
const mockDraft: Draft | null = null;

jest.mock('../../context/FeedbackContext', () => ({
  useFeedbackContext: () => ({
    feedbacks: mockFeedbacks,
    draft: mockDraft,
    addFeedback: mockAddFeedback,
    deleteFeedback: mockDeleteFeedback,
    clearAllFeedbacks: mockClearAllFeedbacks,
    setError: mockSetError
  })
}));

// Mock exporters
jest.mock('../../export/MarkdownExporter', () => ({
  MarkdownExporter: {
    exportAsMarkdown: jest.fn(() => '# Feedback Report')
  }
}));

jest.mock('../../export/ZipExporter', () => ({
  ZipExporter: {
    exportAsZip: jest.fn(() => Promise.resolve(new Blob(['zip'])))
  }
}));

// Mock logger
jest.mock('../../utils/logger', () => ({
  __esModule: true,
  default: { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }
}));

const makeFeedback = (overrides: Partial<Feedback> = {}): Feedback => ({
  id: 'fb-1',
  componentName: 'Button',
  componentPath: ['App', 'Form', 'Button'],
  comment: 'Needs padding',
  url: 'http://localhost',
  timestamp: '2026-01-01T00:00:00.000Z',
  browserInfo: { userAgent: 'test', viewport: { width: 1024, height: 768 } },
  ...overrides
});

describe('useFeedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return the expected API shape', () => {
    // Protects against: missing or renamed public API members
    const { result } = renderHook(() => useFeedback());

    expect(Array.isArray(result.current.feedbacks)).toBe(true);
    expect(typeof result.current.addFeedback).toBe('function');
    expect(typeof result.current.deleteFeedback).toBe('function');
    expect(typeof result.current.clearAll).toBe('function');
    expect(typeof result.current.exportFeedback).toBe('function');
    expect(result.current).toHaveProperty('draft');
  });

  it('should delegate addFeedback to context', () => {
    // Protects against: addFeedback not forwarding to context provider
    const { result } = renderHook(() => useFeedback());
    const feedback = makeFeedback();

    act(() => {
      result.current.addFeedback(feedback);
    });

    expect(mockAddFeedback).toHaveBeenCalledTimes(1);
    expect(mockAddFeedback).toHaveBeenCalledWith(feedback);
  });

  it('should delegate deleteFeedback to context', () => {
    // Protects against: deleteFeedback not forwarding the correct id
    const { result } = renderHook(() => useFeedback());

    act(() => {
      result.current.deleteFeedback('fb-1');
    });

    expect(mockDeleteFeedback).toHaveBeenCalledTimes(1);
    expect(mockDeleteFeedback).toHaveBeenCalledWith('fb-1');
  });

  it('should delegate clearAll to context clearAllFeedbacks', () => {
    // Protects against: clearAll not invoking the context clear method
    const { result } = renderHook(() => useFeedback());

    act(() => {
      result.current.clearAll();
    });

    expect(mockClearAllFeedbacks).toHaveBeenCalledTimes(1);
  });

  it('should call setError when addFeedback throws', () => {
    // Protects against: unhandled exceptions from context silently swallowed
    mockAddFeedback.mockImplementationOnce(() => {
      throw new Error('storage full');
    });

    const { result } = renderHook(() => useFeedback());

    act(() => {
      result.current.addFeedback(makeFeedback());
    });

    expect(mockSetError).toHaveBeenCalledTimes(1);
    expect(mockSetError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(mockSetError.mock.calls[0][0].message).toBe('storage full');
  });

  it('should throw when exporting with no feedbacks', async () => {
    // Protects against: empty export producing a corrupt file instead of an error
    const { result } = renderHook(() => useFeedback());
    const options: ExportOptions = {
      format: 'markdown',
      includeImages: false,
      includeMetadata: false
    };

    await expect(
      act(async () => {
        await result.current.exportFeedback(options);
      })
    ).rejects.toThrow('No feedback to export');
  });
});
