import React from 'react';
import ReactDOM from 'react-dom';
import Button from './ui/Button';

const Modal = ({ isOpen, onClose, title, children, onSubmit, submitText = 'Save', showFooter = true, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className={`bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full p-6 mx-4 animate-fade-in-up`}>
        <div className="flex justify-between items-center mb-4 pb-2 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <Button variant="ghost" onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1">
            <span className="sr-only">Close</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>
        <div className="modal-body overflow-y-auto max-h-[70vh] mb-4">
          {children}
        </div>
        {showFooter && (
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            {onSubmit && (
              <Button onClick={onSubmit}>
                {submitText}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>,
    document.getElementById('modal-root') || document.body
  );
};

export default Modal;