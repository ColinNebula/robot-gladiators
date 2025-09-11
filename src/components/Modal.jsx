import React, { useState } from 'react';

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {title && <h2>{title}</h2>}
        {children}
      </div>
    </div>
  );
};

export const NameInputModal = ({ isOpen, onSubmit, onClose }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Welcome to Nebula Wars!">
      <form onSubmit={handleSubmit}>
        <p>What is your robot's name?</p>
        <input
          type="text"
          className="input-field"
          placeholder="Enter robot name..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <div className="controls">
          <button type="submit" className="btn" disabled={!name.trim()}>
            Start Game
          </button>
        </div>
      </form>
    </Modal>
  );
};

export const ConfirmModal = ({ isOpen, onConfirm, onCancel, title, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
      <p>{message}</p>
      <div className="controls">
        <button className="btn btn-success" onClick={onConfirm}>
          Yes
        </button>
        <button className="btn btn-danger" onClick={onCancel}>
          No
        </button>
      </div>
    </Modal>
  );
};

export const AlertModal = ({ isOpen, onClose, title, message }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p>{message}</p>
      <div className="controls">
        <button className="btn" onClick={onClose}>
          OK
        </button>
      </div>
    </Modal>
  );
};

export default Modal;