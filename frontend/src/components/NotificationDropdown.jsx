import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { Bell, Check, CheckCheck, Flame, Calendar, Activity, X } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export const NotificationDropdown = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const { activeAlerts } = useSocket();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getMy();
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, activeAlerts]);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-sky-600" />
          <span className="font-semibold text-slate-800 text-sm">Notifications</span>
          <span className="bg-sky-100 text-sky-700 text-xs px-2 py-0.5 rounded-full font-bold">
            {notifications.filter(n => !n.isRead).length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-slate-500 hover:text-sky-600 flex items-center gap-1"
            title="Mark all as read"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark read</span>
          </button>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
        {loading ? (
          <div className="p-4 text-center text-xs text-slate-400">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">No new notifications</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n._id}
              className={`p-3 text-xs transition-colors hover:bg-slate-50 flex gap-2.5 items-start ${
                !n.isRead ? 'bg-sky-50/50' : ''
              }`}
            >
              <div className="mt-0.5">
                {n.type === 'emergency_blood' ? (
                  <Flame className="w-4 h-4 text-red-600 animate-pulse" />
                ) : n.type === 'appointment_update' ? (
                  <Calendar className="w-4 h-4 text-sky-600" />
                ) : (
                  <Activity className="w-4 h-4 text-emerald-600" />
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-slate-800">{n.title}</div>
                <div className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
              {!n.isRead && (
                <button
                  onClick={() => handleMarkRead(n._id)}
                  className="text-slate-400 hover:text-sky-600 p-1"
                  title="Mark as read"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
