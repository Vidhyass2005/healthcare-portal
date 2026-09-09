import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Stethoscope,
  Shield,
  User,
  Heart,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  KeyRound,
  CheckCircle2
} from 'lucide-react';

export const LoginPage = ({ onNavigate, initialRole = 'patient' }) => {
  const { login } = useAuth();
  const { t } = useLanguage();

  const [activeRole, setActiveRole] = useState(initialRole); // 'patient' | 'doctor' | 'donor' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick fill demo helper for each role
  const handleSelectRole = (r) => {
    setActiveRole(r);
    setError('');
    if (r === 'admin') {
      setEmail('admin@hospital.com');
      setPassword('Admin@123');
    } else if (r === 'doctor') {
      setEmail('priya.cardio@hospital.com');
      setPassword('Doctor@123');
    } else if (r === 'donor') {
      setEmail('anand.donor@gmail.com');
      setPassword('Donor@123');
    } else {
      setEmail('ramesh@gmail.com');
      setPassword('Patient@123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedIn = await login(email, password);
      // Navigate based on role
      if (loggedIn.role === 'admin') onNavigate('/admin-dashboard');
      else if (loggedIn.role === 'doctor') onNavigate('/doctor-dashboard');
      else if (loggedIn.role === 'donor') onNavigate('/donor-dashboard');
      else onNavigate('/patient-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleTheme = () => {
    switch (activeRole) {
      case 'doctor':
        return {
          title: 'Doctor Portal Sign In',
          subtitle: 'Access patient appointments, clinical priority queue & prescriptions',
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          btnColor: 'bg-blue-600 hover:bg-blue-500',
          icon: Stethoscope,
          regText: 'New Doctor? Register Clinical Profile'
        };
      case 'donor':
        return {
          title: 'Blood Donor Sign In',
          subtitle: 'Track 90-day eligibility, emergency blood alerts & certificates',
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          btnColor: 'bg-rose-600 hover:bg-rose-500',
          icon: Heart,
          regText: 'New Donor? Register as Life Saver'
        };
      case 'admin':
        return {
          title: 'Hospital Admin Login',
          subtitle: 'Master control: analytics, blood bank inventory & hospital staff management',
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          btnColor: 'bg-purple-700 hover:bg-purple-600',
          icon: Shield,
          regText: null
        };
      default:
        return {
          title: 'Patient Portal Sign In',
          subtitle: 'Book outpatient appointments, lab tests & view live queue status',
          badgeColor: 'bg-sky-50 text-sky-700 border-sky-200',
          btnColor: 'bg-sky-600 hover:bg-sky-500',
          icon: User,
          regText: 'New Patient? Create Free Account'
        };
    }
  };

  const theme = getRoleTheme();
  const IconComponent = theme.icon;

  return (
    <div className="max-w-lg w-full mx-auto py-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        {/* Hospital Branding Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
            🏥 MEDCARE HOSPITAL
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">{theme.title}</h2>
          <p className="text-xs text-slate-500">{theme.subtitle}</p>
        </div>

        {/* 4-Role Selector Tabs */}
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1.5 text-center">Select Login Persona:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Patient */}
            <button
              type="button"
              onClick={() => handleSelectRole('patient')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                activeRole === 'patient'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Patient</span>
            </button>

            {/* Doctor */}
            <button
              type="button"
              onClick={() => handleSelectRole('doctor')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                activeRole === 'doctor'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span>Doctor</span>
            </button>

            {/* Blood Donor */}
            <button
              type="button"
              onClick={() => handleSelectRole('donor')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                activeRole === 'donor'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Blood Donor</span>
            </button>

            {/* Admin (Single Master Admin) */}
            <button
              type="button"
              onClick={() => handleSelectRole('admin')}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                activeRole === 'admin'
                  ? 'bg-purple-700 text-white border-purple-700 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {activeRole === 'admin' ? 'Administrator Email' : activeRole === 'doctor' ? 'Doctor Email' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@medcare.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-sky-500 focus:bg-white outline-none transition"
              />
            </div>
          </div>

          {/* Quick Credential Hint */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-[11px] text-slate-600 flex justify-between items-center">
            <span>Seeded Login for <strong>{activeRole.toUpperCase()}</strong>:</span>
            <button
              type="button"
              onClick={() => handleSelectRole(activeRole)}
              className="text-sky-600 hover:underline font-bold"
            >
              Fill Credentials ⚡
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2 ${theme.btnColor}`}
          >
            <span>{loading ? t('loading') : `Sign In as ${activeRole.toUpperCase()}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer actions */}
        <div className="pt-2 border-t border-slate-100 text-center space-y-2">
          {theme.regText ? (
            <p className="text-xs text-slate-600">
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate(`/register?role=${activeRole}`)}
                className="font-bold text-sky-600 hover:underline"
              >
                {theme.regText} &rarr;
              </button>
            </p>
          ) : (
            <p className="text-[11px] text-purple-700 font-medium">
              🔒 Master Administrator Portal • Hospital Operations & Security Control
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

