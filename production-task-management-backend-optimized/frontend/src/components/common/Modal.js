```javascript
import React from 'react';
import ReactDOM from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 relative">
        <div className="flex justify-between items-center pb-3 border-b border-gray-200 mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 text-gray-600">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.getElementById('modal-root') // This assumes you have a <div id="modal-root"> in public/index.html
  );
};

export default Modal;
```