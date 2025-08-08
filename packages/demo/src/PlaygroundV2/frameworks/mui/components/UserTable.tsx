import React from 'react';
import { User } from '../../../types';

interface UserTableProps {
  users: User[];
}

export const UserTable: React.FC<UserTableProps> = ({ users }) => {
  return (
    <div className="mui-user-table" style={{
      background: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
      overflow: 'hidden'
    }}>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr style={{ background: '#f5f5f5' }}>
            <th style={{ padding: '1rem', textAlign: 'left', color: '#757575', fontSize: '0.875rem' }}>
              Name
            </th>
            <th style={{ padding: '1rem', textAlign: 'left', color: '#757575', fontSize: '0.875rem' }}>
              Email
            </th>
            <th style={{ padding: '1rem', textAlign: 'left', color: '#757575', fontSize: '0.875rem' }}>
              Role
            </th>
            <th style={{ padding: '1rem', textAlign: 'left', color: '#757575', fontSize: '0.875rem' }}>
              Status
            </th>
            <th style={{ padding: '1rem', textAlign: 'left', color: '#757575', fontSize: '0.875rem' }}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const statusColor = user.status === 'active' ? '#4caf50' : 
                               user.status === 'inactive' ? '#9e9e9e' : '#ff9800';
            
            return (
              <tr key={user.id} style={{ borderTop: '1px solid #e0e0e0' }}>
                <td style={{ padding: '1rem', color: '#212121' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: '#1976d2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.875rem'
                    }}>
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    {user.name}
                  </div>
                </td>
                <td style={{ padding: '1rem', color: '#757575' }}>{user.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    background: '#e3f2fd',
                    color: '#1976d2',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    {user.role}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <span style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: statusColor
                    }}></span>
                    {user.status}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button style={{
                    background: 'transparent',
                    border: '1px solid #1976d2',
                    color: '#1976d2',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.875rem'
                  }}>
                    Edit
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};