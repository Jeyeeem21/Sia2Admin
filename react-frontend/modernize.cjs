const fs = require('fs');
const base = 'c:/laragon/www/SIA/react-frontend/src';

// ─────────────── 1. REWRITE Modal.jsx (fix encoding corruption) ───────────────
const modal = `import React from 'react';
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
      <div className={\`bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.12)] \${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto animate-fade-in border border-gray-100\`}>
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
`;
fs.writeFileSync(base+'/components/Modal.jsx', modal, 'utf8');
console.log('✓ Modal.jsx rewritten');

// ─────────────── 2. Emeraldify helper ───────────────
function emeraldify(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  c = c.replace(/indigo/g, 'emerald');
  fs.writeFileSync(filePath, c, 'utf8');
}

// ─────────────── 3. Emeraldify all shared components ───────────────
const components = ['FormField.jsx','DataTable.jsx','Pagination.jsx','FormModal.jsx','AddModal.jsx','EditModal.jsx','MobileBottomNav.jsx','LoadingStates.jsx','ConfirmModal.jsx','DeleteModal.jsx','ViewModal.jsx'];
components.forEach(f => { emeraldify(base+'/components/'+f); console.log('✓ '+f); });

// ─────────────── 4. Page modernizer (emeraldify + card upgrades) ───────────────
function modernizePage(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  c = c.replace(/indigo/g, 'emerald');
  // Modern stats cards
  c = c.replace(/bg-white rounded-xl p-5 border border-gray-200"/g,
    'bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300"');
  // Modern table container
  c = c.replace(/bg-white rounded-xl shadow-md overflow-hidden"/g,
    'bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden"');
  // Modern search/filter bar
  c = c.replace(/bg-white rounded-xl shadow-md p-6"/g,
    'bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 p-5"');
  c = c.replace(/bg-white rounded-xl shadow-md p-4"/g,
    'bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04)] border border-gray-100 p-5"');
  // Header buttons → emerald + active:scale
  c = c.replace(/px-4 py-2\.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"/g,
    'px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-[0.97] transition-all text-[13px] font-semibold flex items-center gap-2"');
  fs.writeFileSync(filePath, c, 'utf8');
}

const pages = ['Categories.jsx','Products.jsx','Customers.jsx','Invoices.jsx','Inventory.jsx'];
pages.forEach(f => { modernizePage(base+'/pages/'+f); console.log('✓ '+f); });

console.log('\nAll shared components + pages done!');
