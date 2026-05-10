import React, { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { Toast, ToastType } from '../../types';
import { twMerge } from 'tailwind-merge';

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const { id, message, type, duration = 5000 } = toast;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss]);

  const getToastColors = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'bg-success border-success text-white';
      case 'error':
        return 'bg-danger border-danger text-white';
      case 'info':
        return 'bg-primary border-primary text-white';
      default:
        return 'bg-gray-700 border-gray-700 text-white';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6" />;
      default:
        return <ExclamationTriangleIcon className="h-6 w-6" />;
    }
  };

  return (
    <div
      className={twMerge(
        'flex items-center justify-between p-4 mb-3 rounded-lg shadow-lg transition-all duration-300 ease-in-out transform',
        getToastColors(type)
      )}
      role="alert"
    >
      <div className="flex items-center">
        <div className="mr-3">{getIcon(type)}</div>
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="ml-4 p-1 rounded-md hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-current focus:ring-white"
        aria-label="Dismiss toast"
      >
        <XMarkIcon className="h-5 w-5" />
      </button>
    </div>
  );
};

export default ToastItem;
```

```