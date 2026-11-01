import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AppNotification } from '../types';
import { StorageService } from '../services/storage';
import { X, Bell, CheckCheck, Crown, Heart, MessageSquare, Sparkles, Trophy, ArrowRight } from 'lucide-react';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ isOpen, onClose, onNavigateToTab }) => {
  const { currentUser, isOwner } = useAuth();

  if (!isOpen) return null;

  const userNotifs = currentUser ? StorageService.getNotifications(currentUser.id) : [];
  const ownerNotifs = isOwner ? StorageService.getNotifications('owner') : [];

  // Combine and deduplicate
  const allNotifs: AppNotification[] = [...ownerNotifs, ...userNotifs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleMarkAllRead = () => {
    if (currentUser) {
      StorageService.markAllNotificationsAsRead(currentUser.id);
    }
    if (isOwner) {
      StorageService.markAllNotificationsAsRead('owner');
    }
    onClose();
  };

  const handleItemClick = (notif: AppNotification) => {
    StorageService.markNotificationAsRead(notif.id);
    if (notif.type === 'registration_request' && isOwner && onNavigateToTab) {
      onNavigateToTab('owner');
      onClose();
    } else if (notif.type === 'registration_approved') {
      window.location.reload();
    } else if (notif.type === 'level_up' && onNavigateToTab) {
      onNavigateToTab('leaderboard');
      onClose();
    }
  };

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'registration_request':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'registration_approved':
        return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'reaction':
        return <Heart className="w-4 h-4 text-pink-500" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'level_up':
        return <Trophy className="w-4 h-4 text-amber-500" />;
      default:
        return <Bell className="w-4 h-4 text-pink-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 sm:p-6 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl border border-pink-100 overflow-hidden mt-12 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-pink-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-pink-100 text-pink-600">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="font-display font-bold text-slate-800 text-sm">Notifications</h3>
          </div>
          <div className="flex items-center gap-1">
            {allNotifs.length > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-pink-600 hover:text-pink-700 font-bold px-2 py-1 rounded-lg hover:bg-pink-100/50 cursor-pointer flex items-center gap-1"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark Read</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto p-2 divide-y divide-pink-50/80">
          {allNotifs.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="w-12 h-12 rounded-full bg-pink-50 flex items-center justify-center mx-auto mb-2 text-xl">
                🌸
              </div>
              <p className="text-xs font-bold text-slate-700">All caught up!</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No new notifications right now.</p>
            </div>
          ) : (
            allNotifs.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleItemClick(notif)}
                className={`p-3 rounded-2xl transition-all cursor-pointer flex gap-3 items-start my-1 ${
                  !notif.read ? 'bg-pink-50/70 border border-pink-100/80 shadow-xs' : 'hover:bg-slate-50'
                }`}
              >
                <div className="p-2 rounded-xl bg-white shadow-xs shrink-0 mt-0.5">
                  {getIcon(notif.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{notif.title}</h4>
                    {!notif.read && (
                      <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
