import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { NotificationDropdown } from './NotificationDropdown';
import {
  Heart,
  Globe,
  Bell,
  LogOut,
  User,
  Activity,
  Menu,
  X,
  Stethoscope,
  Shield,
  Flame,
  CalendarCheck
} from 'lucide-react';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const { activeAlerts } = useSocket();
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-200 uppercase">Admin</span>;
      case 'doctor':
        return <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 uppercase">Doctor</span>;
      case 'donor':
        return <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 uppercase">Donor</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 uppercase">Patient</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
            >
              <Menu className="w-5 h-5" />
            </button>

            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-blue-700 flex items-center justify-center text-white shadow-md shadow-sky-500/20 group-hover:scale-105 transition">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                  MEDCARE <span className="text-sky-600">HOSPITAL</span>
                  <span className="bg-sky-100 text-sky-700 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">PORTAL</span>
                </span>
                <p className="text-[10px] text-slate-500 hidden sm:block">Clinical Triage, Outpatient & Diagnostics</p>
              </div>
            </a>
          </div>

          {/* Center: Live Emergency Ticker if active */}
          {activeAlerts && activeAlerts.length > 0 && (
            <div className="hidden md:flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-full border border-red-200 text-xs animate-pulse">
              <Flame className="w-3.5 h-3.5 text-red-600" />
              <span className="font-bold">CRITICAL:</span>
              <span className="truncate max-w-xs">{activeAlerts[0].title}</span>
            </div>
          )}

          {/* Right: Language switch + Notifications + User */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition"
              title="Switch language between English and Tamil"
            >
              <Globe className="w-3.5 h-3.5 text-sky-600" />
              <span>{language === 'en' ? 'தமிழ் (TA)' : 'English (EN)'}</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                {activeAlerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-white animate-ping"></span>
                )}
              </button>

              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>

            {/* User Profile / Login Button */}
            {user ? (
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
                <div className="hidden sm:block text-right">
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-end gap-1.5">
                    <span>{user.name}</span>
                    {getRoleBadge(user.role)}
                  </div>
                  <div className="text-[11px] text-slate-500">{user.email}</div>
                </div>

                <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-sm shadow-xs">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a
                  href="/login"
                  className="text-xs font-semibold text-slate-700 hover:text-sky-600 px-3 py-1.5 rounded-lg"
                >
                  {t('navLogin')}
                </a>
                <a
                  href="/register"
                  className="text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 px-3.5 py-1.5 rounded-lg shadow-sm transition"
                >
                  {t('navRegister')}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
