
import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Notification } from '../types';

interface Props {
  notifications: Notification[];
  removeNotification: (id: string) => void;
}

export const NotificationToast: React.FC<Props> = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-full max-w-sm px-4">
      {notifications.map((notif) => (
        <Toast key={notif.id} notification={notif} onDismiss={() => removeNotification(notif.id)} />
      ))}
    </div>
  );
};

const Toast: React.FC<{ notification: Notification; onDismiss: () => void }> = ({ notification, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, notification.duration || 3000);
    return () => clearTimeout(timer);
  }, [notification, onDismiss]);

  const bgColors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
    warning: 'bg-orange-500'
  };

  const Icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle
  };

  const Icon = Icons[notification.type];

  return (
    <div className={`${bgColors[notification.type]} text-white px-4 py-3 rounded-lg shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-5 fade-in duration-300`}>
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        <span className="font-medium text-sm">{notification.message}</span>
      </div>
      <button onClick={onDismiss} className="ml-4 hover:opacity-75">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
