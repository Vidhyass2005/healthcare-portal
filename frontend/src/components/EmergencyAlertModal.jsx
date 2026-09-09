import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Flame, X, Heart, Hospital, MapPin, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const EmergencyAlertModal = () => {
  const { activeAlerts, dismissAlert } = useSocket();
  const { t } = useLanguage();

  if (!activeAlerts || activeAlerts.length === 0) return null;

  const currentAlert = activeAlerts[0];

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-red-900/95 text-white rounded-2xl shadow-2xl border-2 border-red-500 p-5 backdrop-blur-md overflow-hidden relative">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-600/30 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-lg pulse-emergency flex-shrink-0">
              <Flame className="w-6 h-6 text-white animate-bounce" />
            </div>
            <div>
              <span className="bg-red-500/40 text-red-200 uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-400/40">
                CRITICAL BROADCAST
              </span>
              <h4 className="font-bold text-base text-white mt-0.5 leading-snug">
                {currentAlert.title}
              </h4>
            </div>
          </div>
          <button
            onClick={() => dismissAlert(0)}
            className="text-red-200 hover:text-white p-1 rounded-lg hover:bg-red-800/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-red-100 text-xs mt-3 leading-relaxed">
          {currentAlert.message}
        </p>

        {currentAlert.data && (
          <div className="mt-3 bg-red-950/60 rounded-xl p-3 border border-red-800/80 text-xs space-y-1.5 text-red-200">
            {currentAlert.data.hospitalName && (
              <div className="flex items-center gap-2">
                <Hospital className="w-3.5 h-3.5 text-red-400" />
                <span><strong>Hospital:</strong> {currentAlert.data.hospitalName}</span>
              </div>
            )}
            {currentAlert.data.city && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-red-400" />
                <span><strong>Location:</strong> {currentAlert.data.city}</span>
              </div>
            )}
            {currentAlert.data.bloodGroup && (
              <div className="flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-red-400" />
                <span><strong>Group Required:</strong> <span className="font-bold text-white bg-red-700 px-1.5 py-0.2 rounded">{currentAlert.data.bloodGroup}</span> ({currentAlert.data.unitsRequired || 1} units)</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            onClick={() => dismissAlert(0)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-800/70 hover:bg-red-800 text-red-100 transition"
          >
            Dismiss
          </button>
          <a
            href="/blood-bank"
            onClick={() => dismissAlert(0)}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-white text-red-900 hover:bg-red-50 shadow-md transition flex items-center gap-1.5"
          >
            <Heart className="w-3.5 h-3.5 fill-red-600 text-red-600" />
            <span>Respond / Pledge</span>
          </a>
        </div>
      </div>
    </div>
  );
};
