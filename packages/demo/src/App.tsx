/**
 * Feedbacker Landing Page
 * Modern developer-focused landing page with live demo
 */

import React, { useState, useEffect, useRef } from 'react';
import { FeedbackProvider, useFeedbackEvent } from 'feedbacker-react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-bash';
import './styles.css';

// Demo Components
import { ButtonGroup } from './components/ButtonGroup';
import { Card } from './components/Card';
import { FormExample } from './components/FormExample';
import { TableExample } from './components/TableExample';
import { ListExample } from './components/ListExample';
import { PlaygroundV2 } from './PlaygroundV2/PlaygroundV2';
import { TestPage } from './TestPage';

interface LandingPageProps {
  captureLibrary: 'html2canvas' | 'snapdom';
  setCaptureLibrary: (library: 'html2canvas' | 'snapdom') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ captureLibrary, setCaptureLibrary }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [activeCodeTab, setActiveCodeTab] = useState<'install' | 'basic' | 'advanced'>('install');
  const [copiedCode, setCopiedCode] = useState(false);
  const { emit } = useFeedbackEvent();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Add scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    document.querySelectorAll('.scroll-fade-in').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Add particles to hero
  useEffect(() => {
    const particlesContainer = document.querySelector('.hero-particles');
    if (particlesContainer) {
      for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 20}s`;
        particle.style.animationDuration = `${20 + Math.random() * 10}s`;
        particlesContainer.appendChild(particle);
      }
    }
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const codeExamples = {
    install: `# Install Feedbacker
npm install feedbacker-react

# Install SnapDOM (Recommended - faster screenshots)
npm install @zumer/snapdom

# Or use html2canvas (default, loaded from CDN if not installed)
npm install html2canvas`,
    basic: `import { FeedbackProvider } from 'feedbacker-react';

function App() {
  return (
    <FeedbackProvider 
      captureLibrary="snapdom" // Use SnapDOM for 2x faster screenshots
    >
      <YourApp />
    </FeedbackProvider>
  );
}`,
    advanced: `<FeedbackProvider
  // Position: "top-left" | "top-right" | "bottom-left" | "bottom-right"
  position="bottom-right"
  
  // Theme color for UI elements
  primaryColor="#3b82f6"
  
  // Screenshot library: "snapdom" | "html2canvas"
  captureLibrary="snapdom"
  
  // Enable/disable the feedback system
  enabled={true}
  
  // Storage key for localStorage
  storageKey="feedbacker"
  
  // Auto-copy feedback to clipboard
  autoCopy={true}
  
  // Auto-download: false | true | "markdown" | "zip"
  autoDownload="markdown"
  
  // Handle feedback submission
  onFeedbackSubmit={(feedback) => {
    // Send to your backend
    api.submitFeedback(feedback);
  }}
>
  <YourApp />
</FeedbackProvider>`
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <a href="#" className="nav-logo">
            🎯 Feedbacker
          </a>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#demo" className="nav-link">Demo</a>
            <a href="#code" className="nav-link">Code</a>
            <a href="https://github.com/bebsworthy/feedbacker" className="nav-link">GitHub</a>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                emit('selection:start', {});
              }}
            >
              Try It Live
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-background">
          <div className="hero-gradient"></div>
          <div className="hero-particles"></div>
        </div>
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">
              ✨ Zero Configuration Required
            </div>
            <h1 className="hero-title">
              Component-Level Feedback in Seconds
            </h1>
            <p className="hero-subtitle">
              The React feedback widget that actually understands your components. 
              Point, click, and collect contextual feedback with automatic screenshots.
            </p>
            <div className="hero-actions">
              <button 
                className="btn btn-primary"
                onClick={() => {
                  emit('selection:start', {});
                }}
              >
                🚀 Try It Live
              </button>
              <a href="#installation" className="btn btn-secondary">
                📦 Get Started
              </a>
              <a href="https://github.com/bebsworthy/feedbacker" className="btn btn-ghost">
                ⭐ Star on GitHub
              </a>
            </div>
            <div className="hero-demo">
              <div className="live-demo-card glass">
                <p style={{ marginBottom: '1rem', fontSize: '0.875rem', opacity: 0.8 }}>
                  👆 Click "Try It Live" then select any component on this page
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{'<50KB'}</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Bundle Size</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>Pluggable</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Capture Library</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>2min</div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.7 }}>Setup Time</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Three simple steps to start collecting meaningful feedback
          </p>
          <div className="steps-grid">
            <div className="step-card scroll-fade-in">
              <div className="step-number">1</div>
              <h3 className="step-title">Wrap Your App</h3>
              <p className="step-description">
                Add FeedbackProvider around your app. That's it. No configuration needed.
              </p>
              <div className="step-arrow">→</div>
            </div>
            <div className="step-card scroll-fade-in">
              <div className="step-number">2</div>
              <h3 className="step-title">Users Select Components</h3>
              <p className="step-description">
                Users hover and click on any React component. We detect it automatically.
              </p>
              <div className="step-arrow">→</div>
            </div>
            <div className="step-card scroll-fade-in">
              <div className="step-number">3</div>
              <h3 className="step-title">Collect Rich Feedback</h3>
              <p className="step-description">
                Get feedback with component context, screenshots, and browser info.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-subtitle">
            Everything you need for better feedback collection
          </p>
          <div className="features-grid">
            <div className="feature-card large scroll-fade-in">
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Smart Component Detection</h3>
              <p className="feature-description">
                Automatically detects React components using multiple strategies including React DevTools integration, 
                Fiber tree inspection, and intelligent DOM heuristics.
              </p>
              <div className="feature-demo">
                <code style={{ fontSize: '0.875rem', color: 'var(--brand-violet)' }}>
                  Component: App → Card → Button
                </code>
              </div>
            </div>
            
            <div className="feature-card scroll-fade-in">
              <div className="feature-icon">📸</div>
              <h3 className="feature-title">Pluggable Screenshots</h3>
              <p className="feature-description">
                Choose between SnapDOM (2x faster) or html2canvas. Custom adapters supported.
              </p>
            </div>

            <div className="feature-card scroll-fade-in">
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">Mobile Ready</h3>
              <p className="feature-description">
                Touch gestures, haptic feedback, and responsive UI for all devices.
              </p>
            </div>

            <div className="feature-card scroll-fade-in">
              <div className="feature-icon">💾</div>
              <h3 className="feature-title">Local Storage</h3>
              <p className="feature-description">
                All feedback stored locally with automatic cleanup and export options.
              </p>
            </div>

            <div className="feature-card wide scroll-fade-in">
              <div className="feature-icon">🚀</div>
              <h3 className="feature-title">Performance First</h3>
              <p className="feature-description">
                RequestIdleCallback optimization, debounced interactions, and React.memo throughout. 
                Zero performance impact when inactive.
              </p>
            </div>

            <div className="feature-card scroll-fade-in">
              <div className="feature-icon">🎨</div>
              <h3 className="feature-title">Fully Customizable</h3>
              <p className="feature-description">
                Theme colors, positioning, and complete control over the UI.
              </p>
            </div>

            <div className="feature-card scroll-fade-in">
              <div className="feature-icon">📤</div>
              <h3 className="feature-title">Export Options</h3>
              <p className="feature-description">
                Export as Markdown or ZIP with images and metadata included.
              </p>
            </div>

            <div className="feature-card scroll-fade-in">
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Privacy First</h3>
              <p className="feature-description">
                No external requests. All data stays in the browser until you export.
              </p>
            </div>

            <div className="feature-card scroll-fade-in">
              <div className="feature-icon">🔌</div>
              <h3 className="feature-title">Pluggable Architecture</h3>
              <p className="feature-description">
                Swap capture libraries or implement custom adapters for your needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Playground V2 */}
      <PlaygroundV2 captureLibrary={captureLibrary} setCaptureLibrary={setCaptureLibrary} />

      {/* Code Examples */}
      <section id="code" className="code-section">
        <div className="container">
          <h2 className="section-title">Quick Start</h2>
          <p className="section-subtitle">
            Get up and running in under 2 minutes
          </p>
          
          <div className="code-tabs">
            <button 
              className={`code-tab ${activeCodeTab === 'install' ? 'active' : ''}`}
              onClick={() => setActiveCodeTab('install')}
            >
              Installation
            </button>
            <button 
              className={`code-tab ${activeCodeTab === 'basic' ? 'active' : ''}`}
              onClick={() => setActiveCodeTab('basic')}
            >
              Basic Usage
            </button>
            <button 
              className={`code-tab ${activeCodeTab === 'advanced' ? 'active' : ''}`}
              onClick={() => setActiveCodeTab('advanced')}
            >
              Advanced
            </button>
          </div>
          
          <div className="code-block">
            <div className="code-header">
              <span className="code-lang">
                {activeCodeTab === 'install' ? 'bash' : 'jsx'}
              </span>
              <button 
                className={`code-copy ${copiedCode ? 'copied' : ''}`}
                onClick={() => handleCopyCode(codeExamples[activeCodeTab])}
              >
                {copiedCode ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="language-jsx">
              <code 
                className={activeCodeTab === 'install' ? 'language-bash' : 'language-jsx'}
                dangerouslySetInnerHTML={{ 
                  __html: Prism.highlight(
                    codeExamples[activeCodeTab], 
                    activeCodeTab === 'install' ? Prism.languages.bash : Prism.languages.jsx,
                    activeCodeTab === 'install' ? 'bash' : 'jsx'
                  )
                }}
              />
            </pre>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-number">{'<50KB'}</div>
              <div className="stat-label">Gzipped Size</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">Pluggable</div>
              <div className="stat-label">Capture Library</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100%</div>
              <div className="stat-label">TypeScript</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">2min</div>
              <div className="stat-label">Setup Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="comparison">
        <div className="container">
          <h2 className="section-title">Why Feedbacker?</h2>
          <p className="section-subtitle">
            Compare with traditional feedback methods
          </p>
          
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Feedbacker</th>
                <th>Generic Forms</th>
                <th>Screenshot Tools</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Component Detection</td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="cross">✗</span></td>
              </tr>
              <tr>
                <td>Automatic Screenshots</td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="check">✓</span></td>
              </tr>
              <tr>
                <td>Zero Configuration</td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="cross">✗</span></td>
              </tr>
              <tr>
                <td>React Integration</td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="cross">✗</span></td>
              </tr>
              <tr>
                <td>Mobile Support</td>
                <td><span className="check">✓</span></td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
              </tr>
              <tr>
                <td>Local Storage</td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="cross">✗</span></td>
              </tr>
              <tr>
                <td>Pluggable Capture Libraries</td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="cross">✗</span></td>
              </tr>
              <tr>
                <td>Export Options</td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="check">✓</span></td>
              </tr>
              <tr>
                <td>Minimal Dependencies</td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="cross">✗</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Installation Section */}
      <section id="installation" className="installation">
        <div className="container">
          <h2 className="section-title">Get Started Today</h2>
          <p className="section-subtitle">
            Join developers who are collecting better feedback
          </p>
          
          <div className="install-grid">
            <div className="install-content">
              <h3>1. Install the package</h3>
              <p>Add Feedbacker to your React project with npm or yarn.</p>
              
              <h3>2. Wrap your app</h3>
              <p>Import and wrap your app with the FeedbackProvider component.</p>
              
              <h3>3. Start collecting</h3>
              <p>That's it! Your users can now provide component-level feedback.</p>
              
              <div style={{ marginTop: '2rem' }}>
                <a href="https://github.com/bebsworthy/feedbacker" className="btn btn-primary">
                  View Documentation →
                </a>
              </div>
            </div>
            
            <div>
              <div className="terminal">
                <div className="terminal-header">
                  <span className="terminal-dot red"></span>
                  <span className="terminal-dot yellow"></span>
                  <span className="terminal-dot green"></span>
                </div>
                <div className="terminal-content">
                  <div>
                    <span className="terminal-prompt">$</span> <span dangerouslySetInnerHTML={{ __html: Prism.highlight('npm install feedbacker-react', Prism.languages.bash, 'bash') }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Improve Your Feedback?</h2>
            <p className="cta-description">
              Start collecting meaningful, contextual feedback from your users today.
              Zero configuration, maximum insight.
            </p>
            <div className="cta-actions">
              <a href="https://github.com/bebsworthy/feedbacker" className="btn btn-primary">
                Get Started Free →
              </a>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  emit('selection:start', {});
                }}
              >
                Try Demo Again
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-links">
            <a href="https://github.com/bebsworthy/feedbacker" className="footer-link">GitHub</a>
            <a href="https://npmjs.com/package/feedbacker-react" className="footer-link">NPM</a>
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">Examples</a>
            <a href="#" className="footer-link">Support</a>
          </div>
          <p className="footer-credits">
            Built with ❤️ by developers, for developers<br />
            © 2024 Feedbacker. MIT Licensed.
          </p>
        </div>
      </footer>

      {/* Theme Toggle */}
      <button 
        className="theme-toggle"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        aria-label="Toggle theme"
      >
        <span className="theme-icon">
          {theme === 'light' ? '🌙' : '☀️'}
        </span>
      </button>
    </div>
  );
};

// Main App with FeedbackProvider
export const App: React.FC = () => {
  const [captureLibrary, setCaptureLibrary] = useState<'html2canvas' | 'snapdom'>('snapdom');
  
  // Simple routing based on pathname
  const isTestPage = window.location.pathname === '/test';
  
  return (
    <FeedbackProvider
      // Position of the feedback button on the screen
      // Options: "top-left" | "top-right" | "bottom-left" | "bottom-right"
      // Default: "bottom-right"
      position="bottom-right"
      
      // Primary color for the feedback UI (buttons, highlights, etc.)
      // Accepts any valid CSS color value
      // Default: "#3b82f6" (blue)
      primaryColor="#6366f1"
      
      // Enable or disable the entire feedback system
      // Set to false to completely disable feedback collection
      // Default: true
      enabled={true}
      
      // Local storage key for persisting feedback data
      // Change this to avoid conflicts with other instances
      // Default: "feedbacker"
      storageKey="feedbacker-demo"
      
      // Screenshot capture library to use
      // Options: "html2canvas" | "snapdom"
      // Default: "html2canvas" (but we're using snapdom for better performance)
      captureLibrary={captureLibrary}
      
      // Automatically copy feedback to clipboard when captured
      // Copies the markdown version of the feedback
      // Default: false
      // autoCopy={true}
      
      // Automatically download feedback when captured
      // Options: false | true | "markdown" | "zip"
      // - false: No auto-download (default)
      // - true: Auto-download as markdown
      // - "markdown": Download as .md file with text content
      // - "zip": Download as .zip file including screenshots
      // Default: false
      // autoDownload="markdown"
      
      // Callback function triggered when feedback is submitted
      // Receives the complete feedback object
      // Use this to send feedback to your backend, analytics, etc.
      onFeedbackSubmit={(feedback) => {
        console.log('[Demo] New feedback submitted:', feedback);
        // Show a nice notification
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
          z-index: 10000;
          animation: slideInUp 0.3s ease-out;
        `;
        notification.textContent = '✅ Feedback submitted successfully!';
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.animation = 'slideOutDown 0.3s ease-out';
          setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
      }}
    >
      {isTestPage ? (
        <TestPage />
      ) : (
        <LandingPage captureLibrary={captureLibrary} setCaptureLibrary={setCaptureLibrary} />
      )}
    </FeedbackProvider>
  );
};