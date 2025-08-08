/**
 * Card component for demo application
 */

import React, { useState } from 'react';

interface CardProps {
  title: string;
  content: string;
  actions: string[];
}

export const Card: React.FC<CardProps> = React.memo(({ title, content, actions }) => {
  const [expandedAction, setExpandedAction] = useState<string | null>(null);

  const handleActionClick = (action: string) => {
    setExpandedAction(expandedAction === action ? null : action);
  };

  return (
    <div className="demo-card">
      <div className="card-header">
        <h4>{title}</h4>
        <div className="card-badge">Interactive</div>
      </div>
      
      <div className="card-content">
        <p>{content}</p>
        {expandedAction && (
          <div className="action-details">
            <strong>{expandedAction}</strong> action details would appear here.
          </div>
        )}
      </div>
      
      <div className="card-actions">
        {actions.map(action => (
          <button
            key={action}
            className={`card-action ${expandedAction === action ? 'active' : ''}`}
            onClick={() => handleActionClick(action)}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
});