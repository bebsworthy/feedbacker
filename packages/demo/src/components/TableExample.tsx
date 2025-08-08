/**
 * Table component for demo application
 */

import React, { useState } from 'react';

interface TableRow {
  id: number;
  name: string;
  status: 'active' | 'inactive' | 'pending';
  email: string;
  role: string;
  lastSeen: string;
}

const sampleData: TableRow[] = [
  { id: 1, name: 'John Doe', status: 'active', email: 'john@example.com', role: 'Admin', lastSeen: '2024-01-15' },
  { id: 2, name: 'Jane Smith', status: 'active', email: 'jane@example.com', role: 'User', lastSeen: '2024-01-14' },
  { id: 3, name: 'Bob Johnson', status: 'inactive', email: 'bob@example.com', role: 'User', lastSeen: '2024-01-10' },
  { id: 4, name: 'Alice Brown', status: 'pending', email: 'alice@example.com', role: 'Moderator', lastSeen: '2024-01-12' },
  { id: 5, name: 'Charlie Wilson', status: 'active', email: 'charlie@example.com', role: 'User', lastSeen: '2024-01-15' }
];

export const TableExample: React.FC = React.memo(() => {
  const [selectedRow, setSelectedRow] = useState<number | null>(null);
  const [sortColumn, setSortColumn] = useState<keyof TableRow>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (column: keyof TableRow) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...sampleData].sort((a, b) => {
    const aVal = a[sortColumn];
    const bVal = b[sortColumn];
    
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'status-active',
      inactive: 'status-inactive',
      pending: 'status-pending'
    };
    return badges[status as keyof typeof badges] || 'status-inactive';
  };

  return (
    <div className="table-container">
      <table className="demo-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('id')} className="sortable">
              ID {sortColumn === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('name')} className="sortable">
              Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('status')} className="sortable">
              Status {sortColumn === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('email')} className="sortable">
              Email {sortColumn === 'email' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('role')} className="sortable">
              Role {sortColumn === 'role' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th onClick={() => handleSort('lastSeen')} className="sortable">
              Last Seen {sortColumn === 'lastSeen' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedData.map(row => (
            <tr 
              key={row.id}
              className={selectedRow === row.id ? 'selected' : ''}
              onClick={() => setSelectedRow(selectedRow === row.id ? null : row.id)}
            >
              <td>{row.id}</td>
              <td><strong>{row.name}</strong></td>
              <td>
                <span className={`status-badge ${getStatusBadge(row.status)}`}>
                  {row.status}
                </span>
              </td>
              <td>{row.email}</td>
              <td>{row.role}</td>
              <td>{row.lastSeen}</td>
              <td>
                <div className="table-actions">
                  <button className="action-btn edit" onClick={(e) => {
                    e.stopPropagation();
                    console.log('Edit user:', row.id);
                  }}>
                    Edit
                  </button>
                  <button className="action-btn delete" onClick={(e) => {
                    e.stopPropagation();
                    console.log('Delete user:', row.id);
                  }}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {selectedRow && (
        <div className="table-selection">
          Selected row: {selectedRow} ({sampleData.find(r => r.id === selectedRow)?.name})
        </div>
      )}
    </div>
  );
});