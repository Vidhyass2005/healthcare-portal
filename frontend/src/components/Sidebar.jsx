import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LayoutDashboard,
  CalendarPlus,
  Clock,
  Heart,
  FlaskConical,
  FileText,
  Users,
  BarChart3,
  Stethoscope,
  ShieldAlert,
  Award,
  ChevronRight
} from 'lucide-react';

export const Sidebar = ({ currentPath = '/', onNavigate, isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const getNavLinks = () => {
    if (!user) {
      return [
        { path: '/', label: t('navDashboard'), icon: LayoutDashboard },
        { path: '/book-appointment', label: t('navBookAppt'), icon: CalendarPlus },
        { path: '/queue-tracker', label: t('navQueueTracker'), icon: Clock },
        { path: '/blood-bank', label: t('navBloodBank'), icon: Heart },
        { path: '/lab-tests', label: t('navLabTests'), icon: FlaskConical }
      ];
    }

    if (user.role === 'doctor') {
      return [
        { path: '/doctor-dashboard', label: t('navDashboard'), icon: LayoutDashboard },
        { path: '/doctor-dashboard?tab=queue', label: t('navDoctorQueue'), icon: Clock, badge: 'Live' },
        { path: '/blood-bank', label: t('emergencyBloodAlert'), icon: Heart },
        { path: '/lab-tests', label: t('navLabTests'), icon: FlaskConical }
      ];
    }

    if (user.role === 'admin') {
      return [
        { path: '/admin-dashboard', label: t('navDashboard'), icon: LayoutDashboard },
        { path: '/admin-dashboard?tab=analytics', label: t('navAnalytics'), icon: BarChart3 },
        { path: '/blood-bank', label: t('bloodInventory'), icon: Heart },
        { path: '/admin-dashboard?tab=users', label: t('navManageUsers'), icon: Users },
        { path: '/lab-tests', label: t('navLabTests'), icon: FlaskConical }
      ];
    }

    if (user.role === 'donor') {
      return [
        { path: '/donor-dashboard', label: t('navDashboard'), icon: LayoutDashboard },
        { path: '/blood-bank', label: t('emergencyBloodAlert'), icon: Heart, badge: 'Alerts' },
        { path: '/donor-dashboard?tab=certificate', label: t('downloadCertificate'), icon: Award }
      ];
    }

    // Default: Patient
    return [
      { path: '/patient-dashboard', label: t('navDashboard'), icon: LayoutDashboard },
      { path: '/book-appointment', label: t('navBookAppt'), icon: CalendarPlus },
      { path: '/queue-tracker', label: t('navQueueTracker'), icon: Clock },
      { path: '/blood-bank', label: t('navBloodBank'), icon: Heart },
      { path: '/lab-tests', label: t('navLabTests'), icon: FlaskConical }
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Hospital Branding Card */}
        <div className="p-4 border-b border-slate-100">
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-100 rounded-xl p-3">
            <div className="flex items-center gap-2 text-sky-800 font-bold text-xs">
              <Stethoscope className="w-4 h-4 text-sky-600" />
              <span>MEDCARE HOSPITAL</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Active Triage Engine: <span className="font-semibold text-emerald-600">Online 🟢</span>
            </p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = currentPath === link.path || (link.path !== '/' && currentPath.startsWith(link.path.split('?')[0]));

            return (
              <button
                key={link.path}
                onClick={() => {
                  onNavigate(link.path);
                  if (onClose) onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{link.label}</span>
                </div>

                {link.badge ? (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                    isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                  }`}>
                    {link.badge}
                  </span>
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 ${isActive ? 'opacity-100 text-white' : 'text-slate-400'}`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* Emergency Hotline Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-rose-700 font-bold text-xs">
            <ShieldAlert className="w-4 h-4" />
            <span>Emergency Dispatch</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">24x7 Ambulance: <strong className="text-slate-800">108 / 1066</strong></p>
        </div>
      </aside>
    </>
  );
};
