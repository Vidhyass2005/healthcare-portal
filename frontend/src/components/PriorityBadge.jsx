import React from 'react';
import { AlertTriangle, Clock, CheckCircle, Flame } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const PriorityBadge = ({ level = 'Low', score = 0, isEmergency = false, showScore = true, size = 'md' }) => {
  const { t } = useLanguage();
  const normalizedLevel = (level || 'Low').toLowerCase();

  if (isEmergency || normalizedLevel === 'high') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border shadow-sm ${
        isEmergency ? 'bg-red-600 text-white border-red-700 pulse-emergency' : 'bg-red-50 text-red-700 border-red-200'
      } ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'}`}>
        {isEmergency ? <Flame className="w-3.5 h-3.5 animate-bounce" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
        <span>{isEmergency ? t('priorityEmergency') : t('priorityHigh')}</span>
        {showScore && <span className={`text-xs px-1.5 py-0.2 rounded-full ${isEmergency ? 'bg-red-800 text-white' : 'bg-red-100 text-red-800'}`}>Score: {score}</span>}
      </span>
    );
  }

  if (normalizedLevel === 'moderate' || normalizedLevel === 'medium') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-amber-50 text-amber-800 border-amber-200 shadow-sm ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      }`}>
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span>{t('priorityModerate')}</span>
        {showScore && <span className="text-xs px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900">Score: {score}</span>}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm ${
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
    }`}>
      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
      <span>{t('priorityLow')}</span>
      {showScore && <span className="text-xs px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">Score: {score}</span>}
    </span>
  );
};
