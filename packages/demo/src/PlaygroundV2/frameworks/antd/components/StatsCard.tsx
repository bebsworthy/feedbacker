import React from 'react';
import { Stat } from '../../../types';

interface StatsCardProps {
  stat: Stat;
}

export const StatsCard: React.FC<StatsCardProps> = ({ stat }) => {
  const trendColor = stat.trend === 'up' ? '#52c41a' : stat.trend === 'down' ? '#ff4d4f' : '#8c8c8c';
  const trendIcon = stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '→';
  
  return (
    <div className="antd-stats-card" style={{
      background: 'white',
      borderRadius: '2px',
      padding: '20px 24px',
      border: '1px solid #f0f0f0',
      transition: 'all 0.3s'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.09)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = 'none';
    }}>
      <div style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.45)', marginBottom: '8px' }}>
        {stat.label}
      </div>
      <div style={{ fontSize: '30px', fontWeight: '500', color: 'rgba(0, 0, 0, 0.85)', marginBottom: '8px' }}>
        {stat.value}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: trendColor }}>
        <span>{trendIcon}</span>
        <span style={{ fontSize: '14px' }}>
          {Math.abs(stat.change)}%
        </span>
      </div>
    </div>
  );
};