/**
 * Event type definitions for the Feedbacker event bus
 */

export type EventType =
  | 'component:selected'
  | 'modal:open'
  | 'modal:close'
  | 'modal:minimize'
  | 'modal:restore'
  | 'sidebar:open'
  | 'sidebar:close'
  | 'screenshot:capture'
  | 'screenshot:complete'
  | 'draft:save'
  | 'draft:clear'
  | 'draft:restore'
  | 'feedback:submit'
  | 'feedback:export'
  | 'selection:start'
  | 'selection:cancel'
  | 'manager:open'
  | 'export:open'
  | 'clearall:confirm';

export type EventListener<T = any> = (payload: T) => void;
