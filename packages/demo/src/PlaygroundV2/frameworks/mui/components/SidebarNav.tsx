import React from 'react';
import { navigationItems } from '../../shared/mockData';

export const SidebarNav: React.FC = () => {
  return (
    <nav className="mui-sidebar-nav" style={{
      width: '240px',
      background: '#f5f5f5',
      borderRight: '1px solid #e0e0e0',
      padding: '1rem 0'
    }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {navigationItems.map((item) => (
          <li key={item.id}>
            <button
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontSize: '0.95rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#e3f2fd'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};