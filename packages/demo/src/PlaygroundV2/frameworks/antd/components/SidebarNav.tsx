import React from 'react';
import { navigationItems } from '../../shared/mockData';

export const SidebarNav: React.FC = () => {
  return (
    <nav className="antd-sidebar-nav" style={{
      width: '200px',
      background: 'white',
      borderRight: '1px solid #f0f0f0',
      paddingTop: '8px'
    }}>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {navigationItems.map((item) => (
          <li key={item.id}>
            <button
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.3s',
                fontSize: '14px',
                color: 'rgba(0, 0, 0, 0.85)',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e6f7ff';
                e.currentTarget.style.color = '#1890ff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'rgba(0, 0, 0, 0.85)';
              }}
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