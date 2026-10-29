import { X } from 'lucide-react';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning' // 'warning', 'danger', 'info'
}) => {
  if (!isOpen) return null;

  const typeStyles = {
    warning: {
      icon: '⚠️',
      confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white',
      iconBg: 'bg-amber-100',
      iconText: 'text-amber-600'
    },
    danger: {
      icon: '🚪',
      confirmBtn: 'bg-rose-500 hover:bg-rose-600 text-white',
      iconBg: 'bg-rose-100',
      iconText: 'text-rose-600'
    },
    info: {
      icon: 'ℹ️',
      confirmBtn: 'bg-blue-500 hover:bg-blue-600 text-white',
      iconBg: 'bg-blue-100',
      iconText: 'text-blue-600'
    }
  };

  const currentStyle = typeStyles[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className={`w-14 h-14 rounded-full ${currentStyle.iconBg} flex items-center justify-center mb-4`}>
            <span className="text-3xl">{currentStyle.icon}</span>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {title}
          </h3>

          {/* Message */}
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2.5 rounded-lg transition-colors text-sm font-medium ${currentStyle.confirmBtn}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
