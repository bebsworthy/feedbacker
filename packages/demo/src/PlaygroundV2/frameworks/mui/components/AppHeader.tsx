import React from 'react';

export const AppHeader: React.FC = () => {
  return (
    <header className="mui-app-header" style={{
      background: '#1976d2',
      color: 'white',
      padding: '1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>📱 MUI Demo</span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Search..." 
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: 'none',
            background: 'rgba(255,255,255,0.2)',
            color: 'white'
          }}
        />
        <button style={{
          background: 'transparent',
          border: '1px solid white',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          User Menu
        </button>
      </div>
    </header>
  );
};