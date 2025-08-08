/**
 * Status panel component for demo application
 */

import React from 'react';

interface DemoStats {
  totalFeedbacks: number;
  lastUpdated: string;
  systemStatus: 'initializing' | 'ready' | 'error';
}

interface StatusPanelProps {
  stats: DemoStats;
  isLoading: boolean;
  error: Error | null;
  onExportMarkdown: () => void;
  onExportZip: () => void;
}

export const StatusPanel: React.FC<StatusPanelProps> = React.memo(({
  stats,
  isLoading,
  error,
  onExportMarkdown,
  onExportZip
}) => {
  const getStatusColor = () => {
    if (error || stats.systemStatus === 'error') return 'status-error';
    if (isLoading || stats.systemStatus === 'initializing') return 'status-loading';
    return 'status-ready';
  };

  const getStatusIcon = () => {
    if (error || stats.systemStatus === 'error') return '❌';
    if (isLoading || stats.systemStatus === 'initializing') return '⏳';
    return '✅';
  };

  const getStatusText = () => {
    if (error) return `Error: ${error.message}`;
    if (stats.systemStatus === 'initializing') return 'Initializing system...';
    if (isLoading) return 'Loading feedback data...';
    return 'Ready for feedback collection';
  };

  return (
    <div className={`status-panel ${getStatusColor()}`}>
      <div className="status-header">
        <h2>{getStatusIcon()} Feedbacker Status</h2>
      </div>
      
      <div className="status-content">
        <div className="status-grid">
          <div className="status-item">
            <span className="status-label">System Status:</span>
            <span className="status-value">{getStatusText()}</span>
          </div>
          
          <div className="status-item">
            <span className="status-label">Total Feedback:</span>
            <span className="status-value">{stats.totalFeedbacks} items</span>
          </div>
          
          <div className="status-item">
            <span className="status-label">Storage:</span>
            <span className="status-value">
              {isLoading ? 'Loading...' : 'localStorage (persistent)'}
            </span>
          </div>
          
          <div className="status-item">
            <span className="status-label">Last Updated:</span>
            <span className="status-value">
              {new Date(stats.lastUpdated).toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        <div className="status-features">
          <h3>Active Features</h3>
          <ul className="feature-list">
            <li>✅ Zero-configuration initialization</li>
            <li>✅ Component detection and highlighting</li>
            <li>✅ Screenshot capture (with user permission)</li>
            <li>✅ Local storage persistence</li>
            <li>✅ Mobile touch interactions</li>
            <li>✅ Keyboard navigation (ESC to exit)</li>
            <li>✅ Performance optimizations (requestIdleCallback)</li>
            <li>✅ Export functionality (Markdown & ZIP)</li>
          </ul>
        </div>
        
        {stats.totalFeedbacks > 0 && (
          <div className="export-actions">
            <h3>Export Options</h3>
            <div className="export-buttons">
              <button 
                onClick={onExportMarkdown}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                📄 Export as Markdown
              </button>
              <button 
                onClick={onExportZip}
                className="btn btn-secondary"
                disabled={isLoading}
              >
                📦 Export as ZIP (with images)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});