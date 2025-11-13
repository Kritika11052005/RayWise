import React from 'react';
import { Bell, X, Check, AlertCircle, Info, Sparkles } from 'lucide-react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type Notification = {
  _id: Id<'notifications'>;
  _creationTime: number;
  userId: Id<'users'>;
  title: string;
  message: string;
  type: 'analysis_complete' | 'new_incentive' | 'system_update';
  read: boolean;
  createdAt: number;
  link?: string;
};

const NotificationPanel: React.FC = () => {
  const notifications = useQuery(api.notifications.getUserNotifications) ?? [];
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);
  const deleteNotification = useMutation(api.notifications.deleteNotification);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'analysis_complete':
        return <Check className="w-5 h-5 text-green-400" />;
      case 'new_incentive':
        return <Sparkles className="w-5 h-5 text-yellow-400" />;
      case 'system_update':
        return <Info className="w-5 h-5 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'analysis_complete':
        return 'bg-green-500/10 border-green-500/30';
      case 'new_incentive':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'system_update':
        return 'bg-blue-500/10 border-blue-500/30';
      default:
        return 'bg-slate-500/10 border-slate-500/30';
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead({ notificationId: notification._id });
    }
    
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: Id<'notifications'>) => {
    e.stopPropagation();
    await deleteNotification({ notificationId });
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead({});
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow-lg border border-border">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-foreground flex items-center">
              <Bell className="w-4 h-4 mr-2 text-yellow-400" />
              Notifications
            </h3>
          </div>
        </div>
        <div className="p-8 text-center">
          <Bell className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-30" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow-lg border border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground flex items-center">
            <Bell className="w-4 h-4 mr-2 text-yellow-400" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-orange-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <div className="space-y-2 p-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`relative p-3 rounded-lg border ${getNotificationColor(notification.type)} ${
                notification.read ? 'opacity-60' : ''
              } ${notification.link ? 'cursor-pointer hover:bg-muted/50' : ''} transition-all`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getNotificationIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground">
                      {notification.title}
                    </h4>
                    <button
                      onClick={(e) => handleDelete(e, notification._id)}
                      className="flex-shrink-0 p-1 hover:bg-red-500/20 rounded transition-colors"
                      aria-label="Delete notification"
                    >
                      <X className="w-3 h-3 text-muted-foreground hover:text-red-400" />
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    {notification.link && (
                      <span className="text-xs text-orange-400 hover:text-orange-300">
                        View →
                      </span>
                    )}
                  </div>
                </div>

                {!notification.read && (
                  <div className="absolute top-3 right-3 w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;