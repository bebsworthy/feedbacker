import React from 'react';

export const AppHeader: React.FC = () => {
  return (
    <header className="chakra-app-header" style={{
      background: 'white',
      borderBottom: '1px solid #e2e8f0',
      padding: '0 2rem',
      height: '4rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: '600', color: '#319795' }}>
          ⚡ Chakra UI Demo
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Search..." 
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '0.375rem',
            border: '1px solid #e2e8f0',
            width: '200px',
            fontSize: '0.875rem',
            background: '#f7fafc'
          }}
        />
        <button style={{
          background: '#319795',
          border: 'none',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          User Menu
        </button>
      </div>
    </header>
  );
};