import { createContext, useContext } from 'react';

interface ToastContextType {
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  showError: (message: string) => {
    // Simple fallback: log to console
    console.error('Toast error:', message);
  },
});

export const useToast = () => useContext(ToastContext);

export default ToastContext;
