import React from 'react';
import { AppHeader } from './components/AppHeader';
import { StatsCard } from './components/StatsCard';
import { mockStats } from '../shared/mockData';

export const ChakraUIDemo: React.FC = () => {
  return (
    <div className="chakra-demo" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#f7fafc'
    }}>
      <AppHeader />
      
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <main style={{
          flex: 1,
          padding: '2rem',
          overflow: 'auto'
        }}>
          {/* Dashboard Section */}
          <section style={{ marginBottom: '2rem' }}>
            <h2 style={{ color: '#2d3748', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: '700' }}>
              Dashboard
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
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