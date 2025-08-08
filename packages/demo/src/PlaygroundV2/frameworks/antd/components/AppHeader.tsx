import React from 'react';

export const AppHeader: React.FC = () => {
  return (
    <header className="antd-app-header" style={{
      background: 'white',
      borderBottom: '1px solid #f0f0f0',
      padding: '0 24px',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: '500', color: '#1890ff' }}>
          🐜 Ant Design Demo
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <input 
          type="text" 
          placeholder="Search..." 
          style={{
            padding: '4px 11px',
            borderRadius: '2px',
            border: '1px solid #d9d9d9',
            width: '200px',
            fontSize: '14px'
          }}
        />
        <button style={{
          background: '#1890ff',
          border: 'none',
          color: 'white',
          padding: '4px 15px',
          borderRadius: '2px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          User Menu
        </button>
      </div>
    </header>
  );
};