import React from 'react';
import { Stat } from '../../../types';

interface StatsCardProps {
  stat: Stat;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stat }) => {
  const trendColor = stat.trend === 'up' ? '#48bb78' : stat.trend === 'down' ? '#f56565' : '#a0aec0';
  const trendIcon = stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→';
  
  return (
    <div className="chakra-stats-card" style={{
      background: 'white',
      borderRadius: '0.5rem',
      padding: '1.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
    }}>
      <div style={{ fontSize: '0.875rem', color: '#718096', marginBottom: '0.5rem', fontWeight: '500' }}>
        {stat.label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: '700', color: '#2d3748', marginBottom: '0.5rem' }}>
        {stat.value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: trendColor }}>
        <span>{trendIcon}</span>
        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
          {Math.abs(stat.change)}%
        </span>
      </div>
    </div>
  );
};