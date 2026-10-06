import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import {
  Bell,
  Check,
  CheckCheck,
  Flame,
  Calendar,
  Activity,
  X,
  FileText,
  Pill,
  Users,
  Star,
  Clock,
  Accessibility,
  AlertTriangle
} from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export const NotificationDropdown = ({ isOpen, onClose, onUnreadCountChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [loading, setLoading] = useState(false);
  const { activeAlerts } = useSocket();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getMy();
      const list = res.data.notifications || [];
      setNotifications(list);
      const count = list.filter(n => !n.isRead).length;
      if (onUnreadCountChange) onUnreadCountChange(count);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen || (activeAlerts && activeAlerts.length > 0)) {
      fetchNotifications();
    }
  }, [isOpen, activeAlerts]);

  const handleMarkRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markRead(id);
      const updated = notifications.map(n => n._id === id ? { ...n, isRead: true } : n);
      setNotifications(updated);
      const count = updated.filter(n => !n.isRead).length;
      if (onUnreadCountChange) onUnreadCountChange(count);
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      const updated = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updated);
      if (onUnreadCountChange) onUnreadCountChange(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const filteredNotifications = activeTab === 'unread'
    ? notifications.filter(n => !n.isRead)
    : notifications;

  // Role-tailored title & subtitle
  const getRoleHeaderInfo = () => {
    switch (user?.role) {
      case 'doctor':
        return {
          title: 'Doctor Clinical Alerts',
          subtitle: 'OPD Queue, Appointments & Emergencies',
          badge: 'Doctor OPD',
          badgeColor: 'bg-blue-100 text-blue-700 border-blue-200'
        };
      case 'admin':
        return {
          title: 'Operations Desk Alerts',
          subtitle: 'Facility Assistance, Diagnostics & Feedback',
          badge: 'Admin Control',
          badgeColor: 'bg-purple-100 text-purple-700 border-purple-200'
        };
      default:
        return {
          title: 'Patient Health Alerts',
          subtitle: 'Visits, Digital Prescriptions & Diagnostic Reports',
          badge: 'Patient Portal',
          badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-200'
        };
    }
  };

  const headerInfo = getRoleHeaderInfo();

  // Type icon selector
  const renderTypeIcon = (type, priority) => {
    switch (type) {
      case 'emergency_alert':
      case 'emergency':
        return (
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-2xs animate-pulse">
            <Flame className="w-4 h-4" />
          </div>
        );
      case 'facility_assistance':
        return (
          <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Accessibility className="w-4 h-4" />
          </div>
        );
      case 'queue_alert':
        return (
          <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-4 h-4" />
          </div>
        );
      case 'prescription_ready':
        return (
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Pill className="w-4 h-4" />
          </div>
        );
      case 'lab_report_ready':
        return (
          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Activity className="w-4 h-4" />
          </div>
        );
      case 'feedback_alert':
        return (
          <div className="w-8 h-8 rounded-lg bg-yellow-100 text-yellow-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Star className="w-4 h-4 fill-yellow-500" />
          </div>
        );
      case 'appointment_update':
        return (
          <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Calendar className="w-4 h-4" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 shadow-2xs">
            <Bell className="w-4 h-4" />
          </div>
        );
    }
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="absolute right-0 mt-2.5 w-84 sm:w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-0 z-50 animate-in fade-in slide-in-from-top-2 overflow-hidden">
      {/* Header with role identity */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-sky-50/40 border-b border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm">{headerInfo.title}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${headerInfo.badgeColor}`}>
                  {headerInfo.badge}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">{headerInfo.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/60 transition cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher & Mark All Read */}
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/60">
          <div className="flex items-center gap-1 bg-slate-200/60 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-md font-semibold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-md font-semibold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 px-2 py-1 rounded-md transition flex items-center gap-1 cursor-pointer"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 bg-white">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading alerts...</div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2">
              <Check className="w-5 h-5 text-slate-400" />
            </div>
            <p className="text-xs font-semibold text-slate-700">All caught up!</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeTab === 'unread' ? 'No unread notifications right now.' : 'No notifications for your account yet.'}
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => {
            const isHighPriority = n.priority === 'high' || n.priority === 'emergency';
            return (
              <div
                key={n._id}
                onClick={() => !n.isRead && handleMarkRead(n._id)}
                className={`p-3.5 text-xs transition-colors cursor-pointer flex gap-3 items-start border-l-4 ${
                  !n.isRead
                    ? isHighPriority
                      ? 'bg-red-50/50 hover:bg-red-50/80 border-l-red-500'
                      : 'bg-sky-50/50 hover:bg-sky-50/80 border-l-sky-500'
                    : 'hover:bg-slate-50 border-l-transparent'
                }`}
              >
                {renderTypeIcon(n.type, n.priority)}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`font-bold ${!n.isRead ? 'text-slate-900' : 'text-slate-700'}`}>
                        {n.title}
                      </span>
                      {isHighPriority && (
                        <span className="bg-red-100 text-red-700 font-extrabold text-[9px] px-1.5 py-0.2 rounded uppercase">
                          Urgent
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                      {formatTimestamp(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-slate-600 mt-1 leading-relaxed text-[11px] break-words">
                    {n.message}
                  </p>

                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                    <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                      {n.type?.replace(/_/g, ' ') || 'General'}
                    </span>

                    {!n.isRead && (
                      <button
                        onClick={(e) => handleMarkRead(n._id, e)}
                        className="text-[10px] font-bold text-sky-600 hover:text-sky-800 hover:bg-sky-100 px-2 py-0.5 rounded transition flex items-center gap-1 cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark read</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
        <span className="text-[10px] text-slate-400">
          MEDCARE HOSPITAL • Real-time clinical notifications active
        </span>
      </div>
    </div>
  );
};
