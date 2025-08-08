/**
 * FeedbackManager - Full-screen feedback management interface
 * Groups feedback by day with card-based layout
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Feedback } from '../../types';
import { XMarkIcon, ArrowDownTrayIcon, TrashIcon, PencilIcon } from '../../icons';
import { ConfirmDialog } from './ConfirmDialog';
import { ExportDialog } from './ExportDialog';
import { FeedbackCard } from './FeedbackCard';
import { useFeedbackContext } from '../../context/FeedbackContext';
import '../../styles/feedbacker.css';

interface FeedbackManagerProps {
  isOpen: boolean;
  feedbacks: Feedback[];
  onClose: () => void;
  onDeleteFeedback: (id: string) => void;
  onEditFeedback: (feedback: Feedback) => void;
  onClearAll: () => void;
  onExport: (format: 'markdown' | 'zip', feedbacks?: Feedback[]) => void;
}

interface DayGroup {
  date: string;
  displayDate: string;
  feedbacks: Feedback[];
}

export const FeedbackManager: React.FC<FeedbackManagerProps> = ({
  isOpen,
  feedbacks,
  onClose,
  onDeleteFeedback,
  onEditFeedback,
  onClearAll,
  onExport
}) => {
  // Get context for settings
  const { autoCopy, autoDownload, setAutoCopy, setAutoDownload } = useFeedbackContext();
  const [showSettings, setShowSettings] = useState(false);
  const [localAutoDownloadFormat, setLocalAutoDownloadFormat] = useState<'markdown' | 'zip'>(
    autoDownload === 'zip' ? 'zip' : 'markdown'
  );
  
  // Update local format when autoDownload changes
  useEffect(() => {
    if (autoDownload && autoDownload !== true && autoDownload !== false) {
      setLocalAutoDownloadFormat(autoDownload);
    }
  }, [autoDownload]);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [exportDialog, setExportDialog] = useState<{
    isOpen: boolean;
    feedbacks: Feedback[];
  } | null>(null);

  // Group feedbacks by day
  const groupedFeedbacks = useMemo(() => {
    const groups: { [key: string]: DayGroup } = {};
    
    feedbacks.forEach(feedback => {
      const date = new Date(feedback.timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          displayDate: date.toLocaleDateString('en-US', { 
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }),
          feedbacks: []
        };
      }
      
      groups[dateKey].feedbacks.push(feedback);
    });
    
    // Sort by date (newest first)
    return Object.values(groups).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [feedbacks]);

  const handleDeleteDay = useCallback((dayGroup: DayGroup) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Day Feedback',
      message: `Are you sure you want to delete all ${dayGroup.feedbacks.length} feedback items from ${dayGroup.displayDate}?`,
      onConfirm: () => {
        dayGroup.feedbacks.forEach(f => onDeleteFeedback(f.id));
        setConfirmDialog(null);
      }
    });
  }, [onDeleteFeedback]);

  const handleExportDay = useCallback((dayGroup: DayGroup) => {
    setExportDialog({
      isOpen: true,
      feedbacks: dayGroup.feedbacks
    });
  }, []);

  const handleCopyFeedback = useCallback((feedback: Feedback) => {
    // Generate markdown format for single feedback
    let markdown = `## ${feedback.componentName}\n\n`;
    
    // Feedback Comment
    markdown += `### Feedback\n${feedback.comment}\n\n`;
    
    // Component Information
    markdown += `### Component Information\n`;
    markdown += `- **Component:** ${feedback.componentName}\n`;
    markdown += `- **Path:** ${feedback.componentPath.join(' > ')}\n`;
    markdown += `- **URL:** ${feedback.url}\n`;
    markdown += `- **Timestamp:** ${feedback.timestamp}\n\n`;
    
    // Browser Information
    markdown += `### Browser Information\n`;
    if (feedback.browserInfo.platform) {
      markdown += `- **Platform:** ${feedback.browserInfo.platform}\n`;
    }
    markdown += `- **Viewport:** ${feedback.browserInfo.viewport.width} x ${feedback.browserInfo.viewport.height}\n`;
    markdown += `- **User Agent:** ${feedback.browserInfo.userAgent}\n`;
    
    // HTML Snippet (if available)
    if (feedback.htmlSnippet) {
      markdown += `\n### HTML Snippet\n`;
      markdown += '```html\n';
      markdown += feedback.htmlSnippet;
      markdown += '\n```\n';
    }
    
    // Metadata (if available)
    if (feedback.metadata && Object.keys(feedback.metadata).length > 0) {
      markdown += `\n### Additional Metadata\n`;
      markdown += '```json\n';
      markdown += JSON.stringify(feedback.metadata, null, 2);
      markdown += '\n```\n';
    }
    
    navigator.clipboard.writeText(markdown).then(() => {
      console.log('[Feedbacker] Feedback copied to clipboard as markdown');
    }).catch(err => {
      console.error('[Feedbacker] Failed to copy feedback:', err);
    });
  }, []);

  if (!isOpen) return null;

  return (
    <div className="feedbacker-root">
      {/* Full screen overlay */}
      <div 
        className="feedbacker-manager-overlay"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#f9fafb',
          zIndex: 99999,
          overflowY: 'auto'
        }}
      >
        {/* Header */}
        <div 
          className="feedbacker-manager-header"
          style={{
            position: 'sticky',
            top: 0,
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 1
          }}
        >
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
            Feedback Manager
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              style={{
                padding: '8px 16px',
                backgroundColor: showSettings ? '#e0e7ff' : '#ffffff',
                color: showSettings ? '#4f46e5' : '#6b7280',
                border: '1px solid #e5e7eb',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              ⚙️ Settings
            </button>
            <span style={{ fontSize: '14px', color: '#6b7280' }}>
              {feedbacks.length} {feedbacks.length === 1 ? 'item' : 'items'}
            </span>
            {feedbacks.length > 0 && (
              <>
                <button
                  onClick={() => setExportDialog({ isOpen: true, feedbacks })}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <ArrowDownTrayIcon size={16} />
                  Export All
                </button>
                <button
                  onClick={() => {
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Clear All Feedback',
                      message: `Are you sure you want to delete all ${feedbacks.length} feedback items?`,
                      onConfirm: () => {
                        onClearAll();
                        setConfirmDialog(null);
                      }
                    });
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#ef4444',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <TrashIcon size={16} />
                  Clear All
                </button>
              </>
            )}
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '6px',
                border: '1px solid #e5e7eb',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <XMarkIcon size={20} color="#6b7280" />
            </button>
          </div>
        </div>

        {/* Settings Section */}
        {showSettings && (
          <div style={{
            backgroundColor: '#f3f4f6',
            borderBottom: '1px solid #e5e7eb',
            padding: '20px 24px'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: '#374151' }}>
              Auto Actions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Auto-copy toggle */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    📋 Auto-copy to clipboard
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Automatically copy markdown to clipboard when feedback is captured
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoCopy}
                  onChange={(e) => setAutoCopy(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                />
              </label>
              
              {/* Auto-download toggle */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                cursor: 'pointer'
              }}>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                    💾 Auto-download feedback
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                    Automatically download feedback when captured
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={!!autoDownload}
                  onChange={(e) => setAutoDownload(e.target.checked ? localAutoDownloadFormat : false)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer'
                  }}
                />
              </label>
              
              {/* Download format selector */}
              {autoDownload && (
                <div style={{
                  marginLeft: '32px',
                  padding: '12px 16px',
                  backgroundColor: '#ffffff',
                  borderRadius: '8px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    Download format:
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="downloadFormat"
                        value="markdown"
                        checked={localAutoDownloadFormat === 'markdown'}
                        onChange={(e) => {
                          setLocalAutoDownloadFormat('markdown');
                          setAutoDownload('markdown');
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#4b5563' }}>Markdown</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="downloadFormat"
                        value="zip"
                        checked={localAutoDownloadFormat === 'zip'}
                        onChange={(e) => {
                          setLocalAutoDownloadFormat('zip');
                          setAutoDownload('zip');
                        }}
                      />
                      <span style={{ fontSize: '13px', color: '#4b5563' }}>ZIP (with images)</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Content */}
        <div style={{ padding: '24px' }}>
          {groupedFeedbacks.length === 0 ? (
            <div style={{ 
              textAlign: 'center',
              padding: '60px 20px',
              color: '#6b7280'
            }}>
              <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>No feedback yet</p>
              <p style={{ fontSize: '14px', margin: 0 }}>Click the feedback button to start collecting feedback</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {groupedFeedbacks.map(dayGroup => (
                <div key={dayGroup.date}>
                  {/* Day header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      {dayGroup.displayDate}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleExportDay(dayGroup)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ffffff',
                          color: '#3b82f6',
                          border: '1px solid #3b82f6',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <ArrowDownTrayIcon size={14} />
                        Export
                      </button>
                      <button
                        onClick={() => handleDeleteDay(dayGroup)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ffffff',
                          color: '#ef4444',
                          border: '1px solid #ef4444',
                          borderRadius: '4px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <TrashIcon size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {/* Divider */}
                  <div style={{
                    height: '1px',
                    backgroundColor: '#e5e7eb',
                    marginBottom: '16px'
                  }} />
                  
                  {/* Cards grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '16px'
                  }}>
                    {dayGroup.feedbacks.map(feedback => (
                      <FeedbackCard
                        key={feedback.id}
                        feedback={feedback}
                        onEdit={() => onEditFeedback(feedback)}
                        onCopy={() => handleCopyFeedback(feedback)}
                        onDelete={() => {
                          setConfirmDialog({
                            isOpen: true,
                            title: 'Delete Feedback',
                            message: `Are you sure you want to delete this feedback?`,
                            onConfirm: () => {
                              onDeleteFeedback(feedback.id);
                              setConfirmDialog(null);
                            }
                          });
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          isDanger={true}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}

      {/* Export Dialog */}
      {exportDialog && (
        <ExportDialog
          isOpen={exportDialog.isOpen}
          onExport={(format) => {
            onExport(format, exportDialog.feedbacks);
            setExportDialog(null);
          }}
          onCancel={() => setExportDialog(null)}
        />
      )}
    </div>
  );
};