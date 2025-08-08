/**
 * Feedbacker Demo Application
 * Showcases the feedbacker library with various component types
 * Includes mobile viewport support and comprehensive testing scenarios
 */

import React, { useState, useEffect } from 'react';
import { FeedbackProvider, useFeedback, useFeedbackStorage } from '@feedbacker/core';
import { Header } from './components/Header';
import { ButtonGroup } from './components/ButtonGroup';
import { Card } from './components/Card';
import { FormExample } from './components/FormExample';
import { TableExample } from './components/TableExample';
import { ModalExample } from './components/ModalExample';
import { ListExample } from './components/ListExample';
import { NavigationExample } from './components/NavigationExample';
import { StatusPanel } from './components/StatusPanel';
import './styles.css';

interface DemoStats {
  totalFeedbacks: number;
  lastUpdated: string;
  systemStatus: 'initializing' | 'ready' | 'error';
}

const DemoContent: React.FC = () => {
  const { feedbacks, exportFeedback } = useFeedback();
  const { isLoading, error } = useFeedbackStorage();
  const [stats, setStats] = useState<DemoStats>({
    totalFeedbacks: 0,
    lastUpdated: new Date().toISOString(),
    systemStatus: 'initializing'
  });

  useEffect(() => {
    // Update stats when feedbacks change
    setStats({
      totalFeedbacks: feedbacks.length,
      lastUpdated: new Date().toISOString(),
      systemStatus: error ? 'error' : 'ready'
    });
  }, [feedbacks, error]);

  const handleExportMarkdown = async () => {
    try {
      await exportFeedback({ 
        format: 'markdown', 
        includeImages: false, 
        includeMetadata: true 
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleExportZip = async () => {
    try {
      await exportFeedback({ 
        format: 'zip', 
        includeImages: true, 
        includeMetadata: true 
      });
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="demo-app">
      <div className="demo-container">
        {/* Header Section */}
        <Header 
          title="🎯 Feedbacker Demo" 
          subtitle="Zero-configuration React feedback system"
        />

        {/* Status Panel */}
        <StatusPanel 
          stats={stats}
          isLoading={isLoading}
          error={error}
          onExportMarkdown={handleExportMarkdown}
          onExportZip={handleExportZip}
        />

        {/* Demo Sections */}
        <section className="demo-section">
          <h2>Interactive Components</h2>
          <p>Test component selection and feedback on these various UI elements:</p>
          
          {/* Button Group */}
          <div className="component-demo">
            <h3>Button Groups</h3>
            <ButtonGroup />
          </div>

          {/* Cards */}
          <div className="component-demo">
            <h3>Card Components</h3>
            <div className="card-grid">
              <Card 
                title="Product Card"
                content="This card represents a product listing with actions."
                actions={['View', 'Edit', 'Delete']}
              />
              <Card 
                title="User Profile"
                content="A user profile card with personal information."
                actions={['View Profile', 'Send Message']}
              />
              <Card 
                title="Settings Panel"
                content="Configuration options and preferences."
                actions={['Save', 'Reset', 'Cancel']}
              />
            </div>
          </div>

          {/* Form Example */}
          <div className="component-demo">
            <h3>Form Components</h3>
            <FormExample />
          </div>

          {/* Table Example */}
          <div className="component-demo">
            <h3>Data Table</h3>
            <TableExample />
          </div>

          {/* Navigation Example */}
          <div className="component-demo">
            <h3>Navigation Elements</h3>
            <NavigationExample />
          </div>

          {/* List Example */}
          <div className="component-demo">
            <h3>List Components</h3>
            <ListExample />
          </div>

          {/* Modal Example */}
          <div className="component-demo">
            <h3>Modal Dialogs</h3>
            <ModalExample />
          </div>
        </section>

        {/* Usage Instructions */}
        <section className="demo-section instructions">
          <h2>How to Use</h2>
          <div className="instruction-grid">
            <div className="instruction-item">
              <h4>🖱️ Desktop</h4>
              <p>Hover over components to highlight them, then click to provide feedback.</p>
            </div>
            <div className="instruction-item">
              <h4>📱 Mobile</h4>
              <p>Touch and drag to select components. Tap to confirm selection and provide feedback.</p>
            </div>
            <div className="instruction-item">
              <h4>⌨️ Keyboard</h4>
              <p>Press <kbd>Esc</kbd> to exit component selection mode at any time.</p>
            </div>
            <div className="instruction-item">
              <h4>📸 Screenshots</h4>
              <p>Screenshots are automatically captured when providing feedback (requires user permission).</p>
            </div>
            <div className="instruction-item">
              <h4>💾 Storage</h4>
              <p>All feedback is stored locally in your browser. Export options are available.</p>
            </div>
            <div className="instruction-item">
              <h4>🚀 Zero Config</h4>
              <p>No setup required - just wrap your app with FeedbackProvider and you're ready to go!</p>
            </div>
          </div>
        </section>

        {/* Technical Details */}
        <section className="demo-section technical">
          <h2>Technical Implementation</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <h4>Bundle Size</h4>
              <p>ESM: &lt; 50KB gzipped<br />Zero dependencies in core bundle</p>
            </div>
            <div className="tech-item">
              <h4>Performance</h4>
              <p>RequestIdleCallback optimization<br />Debounced interactions</p>
            </div>
            <div className="tech-item">
              <h4>Compatibility</h4>
              <p>React 18+<br />Modern browsers with ES6</p>
            </div>
            <div className="tech-item">
              <h4>Detection</h4>
              <p>React DevTools integration<br />Fiber tree inspection<br />DOM heuristics</p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="demo-footer">
          <p>Built with ❤️ using <strong>@feedbacker/core</strong></p>
          <p>Ready for production use in any React application</p>
        </footer>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <FeedbackProvider
      position="bottom-right"
      primaryColor="#3b82f6"
      enabled={true}
      storageKey="feedbacker-demo"
      onFeedbackSubmit={(feedback) => {
        console.log('[Demo] New feedback submitted:', feedback);
      }}
    >
      <DemoContent />
    </FeedbackProvider>
  );
};