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
  const [activeCodeTab, setActiveCodeTab] = useState<'install' | 'basic' | 'advanced' | 'extension'>('install');
  const [copiedCode, setCopiedCode] = useState(false);
  const { emit } = useFeedbackEvent();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -100px 0px' });
    document.querySelectorAll('.scroll-fade-in').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

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

  const codeExamples: Record<string, string> = {
    install: `# Install Feedbacker React widget
npm install feedbacker-react

# Install SnapDOM (Recommended - faster screenshots)
npm install @zumer/snapdom

# Or use html2canvas (default)
npm install html2canvas`,
    basic: `import { FeedbackProvider } from 'feedbacker-react';

function App() {
  return (
    <FeedbackProvider
      captureLibrary="snapdom"
    >
      <YourApp />
    </FeedbackProvider>
  );
}`,
    advanced: `<FeedbackProvider
  position="bottom-right"
  primaryColor="#3b82f6"
  captureLibrary="snapdom"
  enabled={true}
  storageKey="feedbacker"
  autoCopy={true}
  autoDownload="markdown"
  onFeedbackSubmit={(feedback) => {
    api.submitFeedback(feedback);
  }}
>
  <YourApp />
</FeedbackProvider>`,
    extension: `# Chrome Extension — no code required!

1. Install from Chrome Web Store (or load unpacked)
2. Click the Feedbacker icon on any website
3. Hover to detect elements, click to capture
4. Type your feedback and submit
5. Open sidebar to view, edit, or export

# Keyboard shortcut
Alt+Shift+F  (Cmd+Shift+F on Mac)

# Settings (via extension popup)
- Button position: top-left / top-right / bottom-left / bottom-right
- Accent color: any color
- Feedback persists across all websites`
  };

  const codeLanguage = activeCodeTab === 'extension' || activeCodeTab === 'install' ? 'bash' : 'jsx';

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="nav">
        <div className="nav-container">
          <a href="#" className="nav-logo">Feedbacker</a>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how-it-works" className="nav-link">How It Works</a>
            <a href="#code" className="nav-link">Get Started</a>
            <a href="https://github.com/bebsworthy/feedbacker" className="nav-link">GitHub</a>
            <button className="btn btn-primary btn-sm" onClick={() => emit('selection:start', {})}>
              Try Widget
            </button>
            <a href="#extension-cta" className="btn btn-chrome btn-sm">
              Chrome Extension
            </a>
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
              Visual Feedback for Developers & Teams
            </div>
            <h1 className="hero-title">
              Capture Feedback on Any Screen
            </h1>
            <p className="hero-subtitle">
              Point at any element, click, and collect contextual feedback with automatic screenshots.
              As a React widget in your app, or a Chrome extension on any website.
            </p>
            <div className="hero-cards">
              <div className="hero-product-card glass scroll-fade-in">
                <div className="hero-product-icon">{'</>'}</div>
                <h3>React Widget</h3>
                <p>Embed in your React app. Detects components, captures screenshots, stores feedback locally.</p>
                <code className="hero-product-code">npm install feedbacker-react</code>
                <a href="#code" className="btn btn-primary btn-sm">Get Started</a>
              </div>
              <div className="hero-product-card glass scroll-fade-in">
                <div className="hero-product-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>
                </div>
                <h3>Chrome Extension</h3>
                <p>Works on any website. No code needed. Select elements, capture feedback, export reports.</p>
                <code className="hero-product-code">Alt+Shift+F to activate</code>
                <a href="#extension-cta" className="btn btn-chrome btn-sm">Add to Chrome</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works — Two Tracks */}
      <section id="how-it-works" className="how-it-works">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">
            Two ways to capture feedback — choose what fits your workflow
          </p>
          <div className="tracks-grid">
            <div className="track scroll-fade-in">
              <div className="track-header">
                <span className="track-badge">React Widget</span>
              </div>
              <div className="steps-grid">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <h3 className="step-title">Wrap Your App</h3>
                  <p className="step-description">
                    Add {'<FeedbackProvider>'} around your app. Zero config needed.
                  </p>
                </div>
                <div className="step-card">
                  <div className="step-number">2</div>
                  <h3 className="step-title">Users Select Components</h3>
                  <p className="step-description">
                    Hover and click any React component. Detected automatically via fiber tree.
                  </p>
                </div>
                <div className="step-card">
                  <div className="step-number">3</div>
                  <h3 className="step-title">Collect Rich Feedback</h3>
                  <p className="step-description">
                    Get feedback with component hierarchy, screenshots, and browser info.
                  </p>
                </div>
              </div>
            </div>
            <div className="track scroll-fade-in">
              <div className="track-header">
                <span className="track-badge track-badge-ext">Chrome Extension</span>
              </div>
              <div className="steps-grid">
                <div className="step-card">
                  <div className="step-number">1</div>
                  <h3 className="step-title">Install Extension</h3>
                  <p className="step-description">
                    Add to Chrome from the Web Store. No code or configuration required.
                  </p>
                </div>
                <div className="step-card">
                  <div className="step-number">2</div>
                  <h3 className="step-title">Click on Any Website</h3>
                  <p className="step-description">
                    Press Alt+Shift+F or click the icon. Works on any page — React, Vue, plain HTML.
                  </p>
                </div>
                <div className="step-card">
                  <div className="step-number">3</div>
                  <h3 className="step-title">Capture & Export</h3>
                  <p className="step-description">
                    Native screenshots, cross-site storage, and export as Markdown or ZIP.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Bento Grid */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Powerful Features</h2>
          <p className="section-subtitle">
            Shared core, tailored for each platform
          </p>
          <div className="features-grid">
            <div className="feature-card large scroll-fade-in">
              <span className="availability-badge badge-both">Both</span>
              <div className="feature-icon">🎯</div>
              <h3 className="feature-title">Smart Element Detection</h3>
              <p className="feature-description">
                Multiple detection strategies: React DevTools, fiber tree inspection, DOM heuristics,
                and semantic HTML analysis. Works on React sites and plain HTML alike.
              </p>
              <div className="feature-demo">
                <code style={{ fontSize: '0.875rem', color: 'var(--brand-violet)' }}>
                  Component: App → Card → Button
                </code>
              </div>
            </div>

            <div className="feature-card scroll-fade-in">
              <span className="availability-badge badge-both">Both</span>
              <div className="feature-icon">📸</div>
              <h3 className="feature-title">Automatic Screenshots</h3>
              <p className="feature-description">
                Widget: SnapDOM or html2canvas. Extension: native browser capture via Chrome API.
              </p>
            </div>

            <div className="feature-card scroll-fade-in">
              <span className="availability-badge badge-ext">Extension</span>
              <div className="feature-icon">🌐</div>
              <h3 className="feature-title">Works on Any Website</h3>
              <p className="feature-description">
                No code integration needed. Activate on any page with a click or keyboard shortcut.
              </p>
            </div>

            <div className="feature-card scroll-fade-in">
              <span className="availability-badge badge-both">Both</span>
              <div className="feature-icon">💾</div>
              <h3 className="feature-title">Persistent Storage</h3>
              <p className="feature-description">
                Widget uses localStorage. Extension uses chrome.storage for cross-site persistence.
              </p>
            </div>

            <div className="feature-card wide scroll-fade-in">
              <span className="availability-badge badge-both">Both</span>
              <div className="feature-icon">📤</div>
              <h3 className="feature-title">Export as Markdown or ZIP</h3>
              <p className="feature-description">
                Download feedback reports with component info, screenshots, browser metadata, and HTML snippets.
                ZIP export includes images as separate files.
              </p>
            </div>

            <div className="feature-card scroll-fade-in">
              <span className="availability-badge badge-both">Both</span>
              <div className="feature-icon">🎨</div>
              <h3 className="feature-title">Customizable Theme</h3>
              <p className="feature-description">
                Accent color, button position, dark mode. Widget via props, extension via popup settings.
              </p>
            </div>

            <div className="feature-card scroll-fade-in">
              <span className="availability-badge badge-ext">Extension</span>
              <div className="feature-icon">🔍</div>
              <h3 className="feature-title">Site Filter</h3>
              <p className="feature-description">
                View feedback for the current site or across all sites. Filter and manage from the sidebar.
              </p>
            </div>

            <div className="feature-card scroll-fade-in">
              <span className="availability-badge badge-both">Both</span>
              <div className="feature-icon">🔒</div>
              <h3 className="feature-title">Privacy First</h3>
              <p className="feature-description">
                No external requests. All data stays in the browser until you export it.
              </p>
            </div>

            <div className="feature-card scroll-fade-in">
              <span className="availability-badge badge-widget">Widget</span>
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">Mobile Ready</h3>
              <p className="feature-description">
                Touch gestures, haptic feedback, and responsive UI for all devices.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Playground V2 */}
      <section id="demo">
        <div className="container" style={{ textAlign: 'center', marginBottom: '-2rem' }}>
          <p className="section-note">
            Using the Chrome extension? Just click the Feedbacker icon on any website — no setup needed.
          </p>
        </div>
      </section>
      <PlaygroundV2 captureLibrary={captureLibrary} setCaptureLibrary={setCaptureLibrary} />

      {/* Code Examples — Two Tabs */}
      <section id="code" className="code-section">
        <div className="container">
          <h2 className="section-title">Get Started</h2>
          <p className="section-subtitle">
            Choose your integration method
          </p>

          <div className="code-tabs">
            <button className={`code-tab ${activeCodeTab === 'install' ? 'active' : ''}`} onClick={() => setActiveCodeTab('install')}>
              Installation
            </button>
            <button className={`code-tab ${activeCodeTab === 'basic' ? 'active' : ''}`} onClick={() => setActiveCodeTab('basic')}>
              Basic Usage
            </button>
            <button className={`code-tab ${activeCodeTab === 'advanced' ? 'active' : ''}`} onClick={() => setActiveCodeTab('advanced')}>
              Advanced
            </button>
            <button className={`code-tab ${activeCodeTab === 'extension' ? 'active' : ''}`} onClick={() => setActiveCodeTab('extension')}>
              Chrome Extension
            </button>
          </div>

          <div className="code-block">
            <div className="code-header">
              <span className="code-lang">{codeLanguage}</span>
              <button className={`code-copy ${copiedCode ? 'copied' : ''}`} onClick={() => handleCopyCode(codeExamples[activeCodeTab])}>
                {copiedCode ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="language-jsx">
              <code
                className={`language-${codeLanguage}`}
                dangerouslySetInnerHTML={{
                  __html: Prism.highlight(
                    codeExamples[activeCodeTab],
                    codeLanguage === 'bash' ? Prism.languages.bash : Prism.languages.jsx,
                    codeLanguage
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
              <div className="stat-label">React Widget</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">166KB</div>
              <div className="stat-label">Extension (prod)</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">100%</div>
              <div className="stat-label">TypeScript</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">Any Site</div>
              <div className="stat-label">Extension Works On</div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="comparison">
        <div className="container">
          <h2 className="section-title">Why Feedbacker?</h2>
          <p className="section-subtitle">
            Compare across feedback approaches
          </p>

          <table className="comparison-table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>React Widget</th>
                <th>Extension</th>
                <th>Generic Forms</th>
                <th>Screenshot Tools</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Component Detection</td>
                <td><span className="check">✓</span></td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="cross">✗</span></td>
              </tr>
              <tr>
                <td>Automatic Screenshots</td>
                <td><span className="check">✓</span></td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="check">✓</span></td>
              </tr>
              <tr>
                <td>Works on Any Website</td>
                <td><span className="cross">✗</span></td>
                <td><span className="check">✓</span></td>
                <td><span className="check">✓</span></td>
                <td><span className="check">✓</span></td>
              </tr>
              <tr>
                <td>Zero Configuration</td>
                <td><span className="check">✓</span></td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="cross">✗</span></td>
              </tr>
              <tr>
                <td>Cross-Site Storage</td>
                <td><span className="cross">✗</span></td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="cross">✗</span></td>
              </tr>
              <tr>
                <td>Export (Markdown/ZIP)</td>
                <td><span className="check">✓</span></td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="check">✓</span></td>
              </tr>
              <tr>
                <td>Mobile Support</td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
              </tr>
              <tr>
                <td>Privacy (No External Requests)</td>
                <td><span className="check">✓</span></td>
                <td><span className="check">✓</span></td>
                <td><span className="cross">✗</span></td>
                <td><span className="cross">✗</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Extension CTA */}
      <section id="extension-cta" className="extension-cta">
        <div className="container">
          <div className="extension-cta-content scroll-fade-in">
            <div className="extension-cta-text">
              <h2>Chrome Extension</h2>
              <p>
                Capture feedback on any website without writing a single line of code.
                Install the extension, press Alt+Shift+F, and start clicking.
              </p>
              <ul className="extension-features-list">
                <li>Works on any website — React, Vue, Angular, plain HTML</li>
                <li>Native browser screenshots via Chrome API</li>
                <li>Feedback persists across all sites</li>
                <li>Filter by current site or view all</li>
                <li>Customizable position and accent color</li>
                <li>Shadow DOM isolation — no style conflicts</li>
              </ul>
              <a href="https://github.com/bebsworthy/feedbacker" className="btn btn-chrome">
                Add to Chrome
              </a>
            </div>
            <div className="extension-cta-visual">
              <div className="extension-preview glass">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--brand-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem' }}>💬</div>
                  <div>
                    <div style={{ fontWeight: 600 }}>Feedbacker</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Click any element</div>
                  </div>
                </div>
                <div style={{ background: 'var(--bg-tertiary)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                  Alt+Shift+F → Select → Capture → Export
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
            <h2 className="cta-title">Ready to Capture Better Feedback?</h2>
            <p className="cta-description">
              Embed in your React app or use on any website with the Chrome extension.
              Zero external requests, maximum insight.
            </p>
            <div className="cta-actions">
              <a href="#code" className="btn btn-primary">
                React Widget →
              </a>
              <a href="#extension-cta" className="btn btn-chrome">
                Chrome Extension →
              </a>
              <a href="https://github.com/bebsworthy/feedbacker" className="btn btn-ghost">
                Star on GitHub
              </a>
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
            <a href="#extension-cta" className="footer-link">Chrome Extension</a>
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">Support</a>
          </div>
          <p className="footer-credits">
            Built with care by developers, for developers<br />
            © 2025 Feedbacker. MIT Licensed.
          </p>
        </div>
      </footer>

      {/* Theme Toggle */}
      <button
        className="theme-toggle"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        aria-label="Toggle theme"
      >
        <span className="theme-icon">{theme === 'light' ? '🌙' : '☀️'}</span>
      </button>
    </div>
  );
};

// Main App with FeedbackProvider
export const App: React.FC = () => {
  const [captureLibrary, setCaptureLibrary] = useState<'html2canvas' | 'snapdom'>('snapdom');
  
  // Simple routing based on pathname
  const isTestPage = window.location.pathname === '/test';
  const isExtTestPage = window.location.pathname === '/test-ext';

  // Extension test page — no FeedbackProvider (extension injects its own UI)
  if (isExtTestPage) {
    return <TestPage />;
  }

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