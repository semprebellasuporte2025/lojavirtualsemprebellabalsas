import { type FC, useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number; // Duração em milissegundos (padrão: 3000ms = 3s)
}

const typeStyles: Record<NonNullable<ToastProps['type']>, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-pink-50 border-pink-200 text-pink-800',
};

const typeIcon: Record<NonNullable<ToastProps['type']>, string> = {
  success: 'ri-checkbox-circle-line',
  error: 'ri-error-warning-line',
  info: 'ri-information-line',
};

const Toast: FC<ToastProps> = ({ message, type = 'info', onClose, duration = 3000 }) => {
  const styles = typeStyles[type];
  const icon = typeIcon[type];

  useEffect(() => {
    // Fechar automaticamente após a duração especificada
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`fixed top-4 right-4 z-50`}> 
      <div className={`flex items-start gap-3 px-4 py-3 rounded-lg shadow-md border ${styles} max-w-sm`}> 
        <i className={`${icon} text-xl flex-shrink-0`}></i>
        <div className="flex-1">
          <p className="font-medium">{message}</p>
        </div>
        <button
          type="button"
          aria-label="Fechar"
          onClick={onClose}
          className="ml-2 text-current hover:opacity-75 cursor-pointer"
        >
          <i className="ri-close-line text-lg"></i>
        </button>
      </div>
    </div>
  );
};

export default Toast;