import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  icon,
  noPadding = false
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalMarkup = (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
    >
      <div className={`bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto animate-fade-in border border-gray-100`}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && <div className="flex-shrink-0 text-gray-500">{icon}</div>}
              <div>
                <h2 className="text-[15px] font-bold text-gray-900">{title}</h2>
                {subtitle && <p className="text-[12px] text-gray-500 mt-0.5">{subtitle}</p>}
              </div>
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 flex-shrink-0"
                type="button"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <div className={noPadding ? '' : 'p-6'}>{children}</div>
      </div>
    </div>
  );

  return createPortal(modalMarkup, document.body);
};

export default Modal;
