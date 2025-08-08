/**
 * Button group component for demo application
 */

import React, { useState } from 'react';

export const ButtonGroup: React.FC = React.memo(() => {
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  const buttons = [
    { id: 'primary', label: 'Primary Action', variant: 'primary' },
    { id: 'secondary', label: 'Secondary Action', variant: 'secondary' },
    { id: 'success', label: 'Success Action', variant: 'success' },
    { id: 'warning', label: 'Warning Action', variant: 'warning' },
    { id: 'danger', label: 'Danger Action', variant: 'danger' }
  ];

  const handleClick = (id: string) => {
    setSelectedAction(id);
    setTimeout(() => setSelectedAction(null), 1000);
  };

  return (
    <div className="button-group">
      {buttons.map(button => (
        <button
          key={button.id}
          className={`btn btn-${button.variant} ${selectedAction === button.id ? 'active' : ''}`}
          onClick={() => handleClick(button.id)}
        >
          {button.label}
          {selectedAction === button.id && ' ✓'}
        </button>
      ))}
    </div>
  );
});