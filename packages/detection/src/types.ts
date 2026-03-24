/**
 * Type definitions for @feedbacker/detection
 */

export interface ComponentInfo {
  name: string;
  path: string[];
  element: HTMLElement;
  htmlSnippet?: string | undefined;
  props?: Record<string, unknown> | undefined;
  fiber?: unknown | undefined;
}
