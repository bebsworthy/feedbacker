import React from 'react';
import { Stat } from '../../../types';

interface StatsCardProps {
  stat: Stat;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stat }) => {
  const trendColor = stat.trend === 'up' ? '#4caf50' : stat.trend === 'down' ? '#f44336' : '#9e9e9e';
  const trendIcon = stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→';
  
  return (
    <div className="mui-stats-card" style={{
      background: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)';
    }}>
      <div style={{ fontSize: '0.875rem', color: '#757575', marginBottom: '0.5rem' }}>
        {stat.label}
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#212121', marginBottom: '0.5rem' }}>
        {stat.value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: trendColor }}>
        <span>{trendIcon}</span>
        <span style={{ fontSize: '0.875rem' }}>
          {Math.abs(stat.change)}%
        </span>
      </div>
    </div>
  );
};