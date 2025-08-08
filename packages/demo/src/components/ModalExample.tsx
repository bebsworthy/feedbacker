/**
 * Modal component for demo application
 */

import React, { useState } from 'react';

export const ModalExample: React.FC = React.memo(() => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<'info' | 'confirm' | 'form'>('info');

  const openModal = (type: 'info' | 'confirm' | 'form') => {
    setModalType(type);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  const handleConfirm = () => {
    console.log('Action confirmed');
    closeModal();
  };

  const renderModalContent = () => {
    switch (modalType) {
      case 'info':
        return (
          <div className="modal-content">
            <h3>Information Modal</h3>
            <p>This is an information modal that provides details about a feature or process.</p>
            <p>Users can select this modal or its components to provide feedback.</p>
            <div className="modal-actions">
              <button onClick={closeModal} className="btn btn-primary">Got it</button>
            </div>
          </div>
        );
      
      case 'confirm':
        return (
          <div className="modal-content">
            <h3>Confirm Action</h3>
            <p>Are you sure you want to proceed with this action? This cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={handleConfirm} className="btn btn-danger">Confirm</button>
              <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
            </div>
          </div>
        );
      
      case 'form':
        return (
          <div className="modal-content">
            <h3>Settings Form</h3>
            <form onSubmit={(e) => { e.preventDefault(); closeModal(); }}>
              <div className="form-group">
                <label htmlFor="setting1">Setting 1</label>
                <input type="text" id="setting1" defaultValue="Default value" />
              </div>
              <div className="form-group">
                <label htmlFor="setting2">Setting 2</label>
                <select id="setting2" defaultValue="option1">
                  <option value="option1">Option 1</option>
                  <option value="option2">Option 2</option>
                  <option value="option3">Option 3</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" onClick={closeModal} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="modal-demo">
      <div className="modal-triggers">
        <button onClick={() => openModal('info')} className="btn btn-primary">
          Open Info Modal
        </button>
        <button onClick={() => openModal('confirm')} className="btn btn-warning">
          Open Confirm Modal
        </button>
        <button onClick={() => openModal('form')} className="btn btn-success">
          Open Form Modal
        </button>
      </div>

      {isOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal} aria-label="Close modal">
              ×
            </button>
            {renderModalContent()}
          </div>
        </div>
      )}
    </div>
  );
});