import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

const DeleteModal = ({ isOpen, onClose, title, message, itemName, onConfirm }) => {
  const handleDelete = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-3">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        
        <h3 className="text-base font-semibold text-gray-900 mb-1">
          {message || 'Are you sure?'}
        </h3>
        
        {itemName && (
          <p className="text-sm text-gray-500">
            You are about to delete <strong className="text-gray-700">{itemName}</strong>. 
            This action cannot be undone.
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2.5 mt-6">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
};

export default DeleteModal;
