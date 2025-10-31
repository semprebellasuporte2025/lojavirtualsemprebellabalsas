
import { ReactNode } from 'react';
import { ToastContext, useToastState } from '../../hooks/useToast';
import Toast from '../base/Toast';

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const { toast, showToast, hideToast } = useToastState();

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
      {toast.isVisible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </ToastContext.Provider>
  );
}
