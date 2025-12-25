import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const toastConfig: Record<ToastType, { bgClass: string; icon: React.ElementType; textClass: string }> = {
  success: { bgClass: 'bg-green-500', icon: CheckCircle, textClass: 'text-white' },
  error: { bgClass: 'bg-red-500', icon: AlertCircle, textClass: 'text-white' },
  warning: { bgClass: 'bg-yellow-500', icon: AlertTriangle, textClass: 'text-white' },
  info: { bgClass: 'bg-blue-500', icon: Info, textClass: 'text-white' },
};

// Create toast container once at module level
let toastContainer: HTMLElement | null = null;

function getToastContainer(): HTMLElement {
  if (!toastContainer) {
    toastContainer = document.getElementById('toast-root');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-root';
      document.body.appendChild(toastContainer);
    }
    // Apply critical styles directly to ensure visibility regardless of Tailwind loading state on the body
    toastContainer.style.cssText = 'position: fixed; top: 16px; right: 16px; z-index: 9999; pointer-events: none; display: flex; flex-direction: column; gap: 8px;';
  }
  return toastContainer;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const containerRef = useRef<HTMLElement | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Initialize container on mount
  useEffect(() => {
    containerRef.current = getToastContainer();
    setIsReady(true);
    console.log('[ToastProvider] Container ready');
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    console.log('[ToastProvider] showToast called:', message, type);
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, message, type, duration };
    
    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        console.log('[ToastProvider] Removing toast:', id);
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {isReady && containerRef.current && (
        <ToastRenderer toasts={toasts} onClose={hideToast} container={containerRef.current} />
      )}
    </ToastContext.Provider>
  );
}

// Separate component for rendering toasts to avoid re-render issues
function ToastRenderer({ 
  toasts, 
  onClose, 
  container 
}: { 
  toasts: Toast[]; 
  onClose: (id: string) => void; 
  container: HTMLElement;
}) {
  
  if (toasts.length === 0) return null;

  const content = (
    <>
      <style>{`
        @keyframes slideInFromRight {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div className="flex flex-col gap-2 max-w-[380px] pointer-events-auto">
        {toasts.map((toast) => {
          const config = toastConfig[toast.type];
          const Icon = config.icon;
          
          return (
            <div
              key={toast.id}
              className={`
                ${config.bgClass} ${config.textClass}
                px-4 py-3 rounded-lg shadow-xl
                flex items-center gap-3
                border border-white/20
                min-w-[280px]
                animate-[slideInFromRight_0.3s_ease-out_forwards]
              `}
              style={{
                animation: 'slideInFromRight 0.3s ease-out forwards'
              }}
              role="alert"
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1 text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => onClose(toast.id)}
                className="p-1 rounded hover:bg-black/10 transition-colors flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );

  return createPortal(content, container);
}
