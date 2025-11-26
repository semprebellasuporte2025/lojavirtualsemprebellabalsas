
import { useState, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  duration?: number;
}

interface ToastContextType {
  toast: ToastState;
  showToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function useToastState() {
  const [toast, setToast] = useState<ToastState>({
    message: '',
    type: 'success',
    isVisible: false,
    duration: undefined,
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', duration?: number) => {
    setToast({ message, type, isVisible: true, duration });
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return { toast, showToast, hideToast };
}

export { ToastContext };
export type { ToastContextType, ToastState };
