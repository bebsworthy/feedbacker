import React from 'react';
import { AppHeader } from './components/AppHeader';
import { SidebarNav } from './components/SidebarNav';
import { StatsCard } from './components/StatsCard';
import { mockStats } from '../shared/mockData';

export const AntDesignDemo: React.FC = () => {
  return (
    <div className="antd-demo" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f0f2f5'
    }}>
      <AppHeader />
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <SidebarNav />
        
        <main style={{
          flex: 1,
          padding: '24px',
          overflow: 'auto'
        }}>
          {/* Dashboard Section */}
          <section style={{ marginBottom: '24px' }}>
            <h2 style={{ color: 'rgba(0, 0, 0, 0.85)', marginBottom: '16px', fontSize: '20px' }}>
              Dashboard
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              {mockStats.map((stat, index) => (
                <StatsCard key={index} stat={stat} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};