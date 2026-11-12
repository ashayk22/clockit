import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import './notificationToast.css';

export type NotificationKind = 'success' | 'error' | 'warning' | 'info';

export interface NotificationAction {
  label: string;
  onClick?: () => void;
  href?: string;
}

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  message: string;
  title?: string;
  action?: NotificationAction;
  duration?: number;
  exiting?: boolean;
}

export interface NotificationOptions {
  kind?: NotificationKind;
  title?: string;
  action?: NotificationAction;
  duration?: number;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  notify: (message: string, options?: NotificationOptions) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// Global listeners for imperative toast() calls outside React component lifecycle
type ToastListener = (item: NotificationItem) => void;
type DismissListener = (id: string) => void;

const addListeners = new Set<ToastListener>();
const dismissListeners = new Set<DismissListener>();

let toastCounter = 0;

/**
 * Imperative toast API adhering to Watermelon Alert 4 specification.
 * For use anywhere in the application (event handlers, services, components).
 */
export const toast = (message: string, options?: NotificationOptions): string => {
  const id = `toast-${++toastCounter}-${Date.now().toString(36)}`;
  const item: NotificationItem = {
    id,
    message,
    kind: options?.kind || 'success',
    title: options?.title,
    action: options?.action,
    duration: options?.duration !== undefined ? options.duration : 4000,
  };
  addListeners.forEach((listener) => listener(item));
  return id;
};

toast.success = (message: string, options?: Omit<NotificationOptions, 'kind'>) =>
  toast(message, { ...options, kind: 'success' });

toast.info = (message: string, options?: Omit<NotificationOptions, 'kind'>) =>
  toast(message, { ...options, kind: 'info' });

toast.warning = (message: string, options?: Omit<NotificationOptions, 'kind'>) =>
  toast(message, { ...options, kind: 'warning' });

toast.error = (message: string, options?: Omit<NotificationOptions, 'kind'>) =>
  toast(message, { ...options, kind: 'error' });

toast.dismiss = (id: string) => {
  dismissListeners.forEach((listener) => listener(id));
};

/**
 * Visual Icon per notification kind
 */
const KindIcon: React.FC<{ kind: NotificationKind }> = ({ kind }) => {
  switch (kind) {
    case 'success':
      return <CheckCircle2 size={18} className="clockit-toast-icon" strokeWidth={2.2} />;
    case 'info':
      return <Info size={18} className="clockit-toast-icon" strokeWidth={2.2} />;
    case 'warning':
      return <AlertTriangle size={18} className="clockit-toast-icon" strokeWidth={2.2} />;
    case 'error':
      return <AlertCircle size={18} className="clockit-toast-icon" strokeWidth={2.2} />;
  }
};

/**
 * Single Watermelon Alert 4 Toast Item
 */
export const NotificationToastItem: React.FC<{
  item: NotificationItem;
  onDismiss: (id: string) => void;
}> = ({ item, onDismiss }) => {
  const { id, kind, message, title, action, duration = 4000, exiting } = item;

  useEffect(() => {
    if (duration <= 0) return;
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`clockit-toast-item variant-${kind} ${exiting ? 'is-exiting' : ''}`}
    >
      <KindIcon kind={kind} />

      <div className="clockit-toast-content">
        {title && <span className="clockit-toast-title">{title}</span>}
        <span className="clockit-toast-msg">{message}</span>
      </div>

      {action && (
        <>
          {action.href ? (
            <a
              href={action.href}
              className="clockit-toast-action"
              onClick={action.onClick}
              target="_blank"
              rel="noreferrer"
            >
              {action.label}
            </a>
          ) : (
            <button
              type="button"
              className="clockit-toast-action"
              onClick={() => {
                action.onClick?.();
                onDismiss(id);
              }}
            >
              {action.label}
            </button>
          )}
        </>
      )}

      <button
        type="button"
        className="clockit-toast-close"
        onClick={() => onDismiss(id)}
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
};

/**
 * Provider wrapping the application to manage and present transient notifications
 */
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const dismiss = useCallback((id: string) => {
    // Trigger exit animation first
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, exiting: true } : item))
    );
    // Remove after exit animation completes
    setTimeout(() => {
      setNotifications((prev) => prev.filter((item) => item.id !== id));
    }, 220);
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const notify = useCallback((message: string, options?: NotificationOptions) => {
    return toast(message, options);
  }, []);

  useEffect(() => {
    const handleAdd = (item: NotificationItem) => {
      setNotifications((prev) => [item, ...prev].slice(0, 4)); // Stack up to 4 recent toasts
    };

    const handleDismiss = (id: string) => {
      dismiss(id);
    };

    addListeners.add(handleAdd);
    dismissListeners.add(handleDismiss);

    return () => {
      addListeners.delete(handleAdd);
      dismissListeners.delete(handleDismiss);
    };
  }, [dismiss]);

  return (
    <NotificationContext.Provider value={{ notifications, notify, dismiss, dismissAll }}>
      {children}
      {notifications.length > 0 && (
        <div className="clockit-toast-container">
          {notifications.map((item) => (
            <NotificationToastItem key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export function useNotification(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
