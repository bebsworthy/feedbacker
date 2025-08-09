/**
 * Simple test page for E2E testing
 * Provides predictable elements for testing Feedbacker
 */

import React from 'react';

export const TestPage: React.FC = () => {
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h1 data-testid="page-title">E2E Test Page</h1>
      
      <div style={{ marginTop: '30px' }}>
        <h2>Test Components</h2>
        
        {/* Simple button for testing */}
        <button 
          data-testid="test-button"
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '20px'
          }}
        >
          Test Button
        </button>
        
        {/* Card component for testing */}
        <div 
          data-testid="test-card"
          className="test-card"
          style={{
            marginTop: '30px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#ffffff'
          }}
        >
          <h3>Test Card</h3>
          <p>This is a test card component for E2E testing.</p>
        </div>
        
        {/* Form for testing */}
        <form 
          data-testid="test-form"
          style={{
            marginTop: '30px',
            padding: '20px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            backgroundColor: '#f9fafb'
          }}
        >
          <label htmlFor="test-input" style={{ display: 'block', marginBottom: '8px' }}>
            Test Input:
          </label>
          <input 
            id="test-input"
            data-testid="test-input"
            type="text"
            placeholder="Type something..."
            style={{
              padding: '8px',
              width: '100%',
              maxWidth: '300px',
              border: '1px solid #d1d5db',
              borderRadius: '4px'
            }}
          />
        </form>
        
        {/* List for testing */}
        <ul 
          data-testid="test-list"
          style={{
            marginTop: '30px',
            padding: '0',
            listStyle: 'none'
          }}
        >
          <li style={{ padding: '10px', backgroundColor: '#f3f4f6', marginBottom: '4px' }}>
            List Item 1
          </li>
          <li style={{ padding: '10px', backgroundColor: '#f3f4f6', marginBottom: '4px' }}>
            List Item 2
          </li>
          <li style={{ padding: '10px', backgroundColor: '#f3f4f6', marginBottom: '4px' }}>
            List Item 3
          </li>
        </ul>
      </div>
    </div>
  );
};