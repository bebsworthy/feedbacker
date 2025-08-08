import React from 'react';
import { AppHeader } from './components/AppHeader';
import { SidebarNav } from './components/SidebarNav';
import { StatsCard } from './components/StatsCard';
import { UserCard } from './components/UserCard';
import { UserTable } from './components/UserTable';
import { mockStats, mockUsers } from '../shared/mockData';

export const MUIDemo: React.FC = () => {
  return (
    <div className="mui-demo" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#fafafa'
    }}>
      <AppHeader />
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <SidebarNav />
        
        <main style={{
          flex: 1,
          padding: '2rem',
          overflow: 'auto'
        }}>
          {/* Dashboard Section */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#212121', marginBottom: '1rem' }}>Dashboard</h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              {mockStats.map((stat, index) => (
                <StatsCard key={index} stat={stat} />
              ))}
            </div>
          </section>
          
          {/* User Management Section */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#212121', marginBottom: '1rem' }}>User Management</h2>
            <div style={{ marginBottom: '1.5rem' }}>
              <UserCard user={mockUsers[0]} />
            </div>
            <UserTable users={mockUsers} />
          </section>
        </main>
      </div>
    </div>
  );
};