import React from 'react';
import Modal from './Modal';

const ViewModal = ({ isOpen, onClose, title, data, fields }) => {
  if (!data) return null;
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div key={index} className="flex flex-col gap-1 pb-3 border-b border-gray-100 last:border-0">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              {field.label}
            </span>
            <div className="text-sm text-gray-900">
              {field.type === 'file' && data[field.key] ? (
                <img src={data[field.key]} alt={field.label} className="h-32 w-32 object-cover rounded-lg border border-gray-200" />
              ) : field.render ? (
                field.render(data[field.key])
              ) : (
                data[field.key] || 'N/A'
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-200">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default ViewModal;
