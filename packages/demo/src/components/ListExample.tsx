/**
 * List component for demo application
 */

import React, { useState } from 'react';

interface ListItem {
  id: number;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

const sampleItems: ListItem[] = [
  { id: 1, title: 'Complete user testing', description: 'Conduct usability tests with 10 users', completed: false, priority: 'high' },
  { id: 2, title: 'Update documentation', description: 'Review and update API documentation', completed: true, priority: 'medium' },
  { id: 3, title: 'Fix responsive layout', description: 'Address mobile layout issues in dashboard', completed: false, priority: 'high' },
  { id: 4, title: 'Implement dark mode', description: 'Add dark theme option to user preferences', completed: false, priority: 'low' },
  { id: 5, title: 'Performance optimization', description: 'Optimize bundle size and loading times', completed: true, priority: 'medium' },
];

export const ListExample: React.FC = React.memo(() => {
  const [items, setItems] = useState<ListItem[]>(sampleItems);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [newItem, setNewItem] = useState('');

  const toggleComplete = (id: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const deleteItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addItem = () => {
    if (newItem.trim()) {
      const newId = Math.max(...items.map(item => item.id)) + 1;
      setItems([...items, {
        id: newId,
        title: newItem.trim(),
        description: 'New item added via demo interface',
        completed: false,
        priority: 'medium'
      }]);
      setNewItem('');
    }
  };

  const filteredItems = items.filter(item => {
    switch (filter) {
      case 'completed':
        return item.completed;
      case 'pending':
        return !item.completed;
      default:
        return true;
    }
  });

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'priority-low',
      medium: 'priority-medium',
      high: 'priority-high'
    };
    return colors[priority as keyof typeof colors] || 'priority-medium';
  };

  return (
    <div className="list-demo">
      {/* Add new item */}
      <div className="list-add">
        <input
          type="text"
          placeholder="Add new task..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addItem()}
        />
        <button onClick={addItem} className="btn btn-primary">Add</button>
      </div>

      {/* Filter controls */}
      <div className="list-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All ({items.length})
        </button>
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          Pending ({items.filter(item => !item.completed).length})
        </button>
        <button
          className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({items.filter(item => item.completed).length})
        </button>
      </div>

      {/* List items */}
      <div className="list-container">
        {filteredItems.length === 0 ? (
          <div className="list-empty">
            No items match the current filter.
          </div>
        ) : (
          filteredItems.map(item => (
            <div key={item.id} className={`list-item ${item.completed ? 'completed' : ''}`}>
              <div className="list-item-header">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleComplete(item.id)}
                  />
                  <span className="checkmark"></span>
                  <span className={`list-title ${item.completed ? 'strikethrough' : ''}`}>
                    {item.title}
                  </span>
                </label>
                <div className="list-item-meta">
                  <span className={`priority-badge ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="delete-btn"
                    aria-label="Delete item"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="list-description">
                {item.description}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
});