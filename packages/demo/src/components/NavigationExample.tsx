/**
 * Navigation component for demo application
 */

import React, { useState } from 'react';

export const NavigationExample: React.FC = React.memo(() => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'reports', label: 'Reports', icon: '📈' },
  ];

  const dropdownItems = [
    { id: 'profile', label: 'My Profile', icon: '👤' },
    { id: 'account', label: 'Account Settings', icon: '🔧' },
    { id: 'billing', label: 'Billing', icon: '💳' },
    { id: 'help', label: 'Help & Support', icon: '❓' },
    { id: 'logout', label: 'Sign Out', icon: '🚪' },
  ];

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Demo', href: '/demo' },
    { label: 'Components', href: '/demo/components' },
    { label: 'Navigation', href: null }
  ];

  const toggleDropdown = (dropdownId: string) => {
    setActiveDropdown(activeDropdown === dropdownId ? null : dropdownId);
  };

  return (
    <div className="navigation-demo">
      {/* Breadcrumb Navigation */}
      <nav className="breadcrumb">
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <span className="breadcrumb-separator">›</span>}
            {crumb.href ? (
              <a href={crumb.href} className="breadcrumb-link">
                {crumb.label}
              </a>
            ) : (
              <span className="breadcrumb-current">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Main Navigation Tabs */}
      <nav className="tab-navigation">
        <div className="tab-list">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
            </button>
          ))}
        </div>
        
        {/* User Dropdown */}
        <div className="nav-user">
          <button
            className="user-menu-trigger"
            onClick={() => toggleDropdown('user')}
          >
            <div className="user-avatar">JD</div>
            <span className="user-name">John Doe</span>
            <span className={`dropdown-arrow ${activeDropdown === 'user' ? 'open' : ''}`}>
              ▼
            </span>
          </button>
          
          {activeDropdown === 'user' && (
            <div className="dropdown-menu">
              {dropdownItems.map(item => (
                <button
                  key={item.id}
                  className="dropdown-item"
                  onClick={() => {
                    console.log('Selected:', item.label);
                    setActiveDropdown(null);
                  }}
                >
                  <span className="dropdown-icon">{item.icon}</span>
                  <span className="dropdown-label">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Tab Content */}
      <div className="tab-content">
        <div className="tab-panel">
          <h3>{tabs.find(t => t.id === activeTab)?.icon} {tabs.find(t => t.id === activeTab)?.label} Content</h3>
          <p>This is the content panel for the {activeTab} tab. Users can provide feedback on this content area.</p>
          
          {activeTab === 'dashboard' && (
            <div className="dashboard-widgets">
              <div className="widget">
                <h4>Quick Stats</h4>
                <div className="stat-grid">
                  <div className="stat-item">
                    <span className="stat-value">42</span>
                    <span className="stat-label">Active Users</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">128</span>
                    <span className="stat-label">Total Feedback</span>
                  </div>
                </div>
              </div>
              
              <div className="widget">
                <h4>Recent Activity</h4>
                <ul className="activity-list">
                  <li>User provided feedback on Button component</li>
                  <li>New form submission received</li>
                  <li>Dashboard widget updated</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});