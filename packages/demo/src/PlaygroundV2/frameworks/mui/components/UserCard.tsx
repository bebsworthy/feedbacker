import React from 'react';
import { User } from '../../../types';

interface UserCardProps {
  user: User;
}

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const statusColor = user.status === 'active' ? '#4caf50' : 
                     user.status === 'inactive' ? '#9e9e9e' : '#ff9800';
  
  return (
    <div className="mui-user-card" style={{
      background: 'white',
      borderRadius: '8px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: '#1976d2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.5rem',
        fontWeight: 'bold'
      }}>
        {user.name.split(' ').map(n => n[0]).join('')}
      </div>
      
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem', color: '#212121' }}>
          {user.name}
        </h3>
        <p style={{ margin: '0 0 0.25rem 0', color: '#757575', fontSize: '0.875rem' }}>
          {user.email}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ 
            background: '#e3f2fd', 
            color: '#1976d2', 
            padding: '0.25rem 0.5rem', 
            borderRadius: '4px',
            fontSize: '0.75rem'
          }}>
            {user.role}
          </span>
          <span style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.25rem',
            fontSize: '0.75rem'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: statusColor
            }}></span>
            {user.status}
          </span>
        </div>
      </div>
    </div>
  );
};