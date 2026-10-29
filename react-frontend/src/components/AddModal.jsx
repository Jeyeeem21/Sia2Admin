import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const AddModal = ({ isOpen, onClose, title, fields, onSubmit }) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Initialize form with default values only when modal opens
      const initialData = {};
      fields.forEach(field => {
        initialData[field.key] = field.defaultValue || '';
      });
      setFormData(initialData);
      setErrors({});
    }
  }, [isOpen]); // Remove 'fields' from dependencies to prevent re-initialization

  const handleChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    // Clear error for this field
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  const handleFileChange = (key, file) => {
    if (file) {
      // Convert file to base64 for preview and storage
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [key]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    const newErrors = {};
    fields.forEach(field => {
      if (field.required && !formData[field.key]) {
        newErrors[field.key] = `${field.label} is required`;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit(formData);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map((field, index) => {
            // Handle hidden fields
            if (field.type === 'hidden') {
              return (
                <input
                  key={index}
                  type="hidden"
                  value={formData[field.key] || field.defaultValue || ''}
                />
              );
            }

            return (
              <div key={index} className={field.fullWidth ? 'md:col-span-2' : ''}>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-0.5">*</span>}
                </label>
                
                {field.type === 'select' ? (
                <select
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none ${
                    errors[field.key] ? 'border-red-400' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select {field.label}</option>
                  {field.options?.map((option, i) => (
                    <option key={i} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  rows={field.rows || 3}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none ${
                    errors[field.key] ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder={field.placeholder}
                />
              ) : field.type === 'file' ? (
                <div>
                  <input
                    type="file"
                    accept={field.accept || 'image/*'}
                    onChange={(e) => handleFileChange(field.key, e.target.files[0])}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none ${
                      errors[field.key] ? 'border-red-400' : 'border-gray-300'
                    }`}
                  />
                  {formData[field.key] && (
                    <div className="mt-2">
                      <img src={formData[field.key]} alt="Preview" className="h-24 w-24 object-cover rounded-lg border border-gray-200" />
                    </div>
                  )}
                </div>
              ) : (
                <input
                  type={field.type || 'text'}
                  value={formData[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:outline-none ${
                    errors[field.key] ? 'border-red-400' : 'border-gray-300'
                  }`}
                  placeholder={field.placeholder}
                />
              )}
              
              {errors[field.key] && (
                <p className="text-red-500 text-xs mt-1">{errors[field.key]}</p>
              )}
            </div>
          );
          })}
        </div>

        <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Add
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddModal;
