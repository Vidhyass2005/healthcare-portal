import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { PriorityBadge } from '../components/PriorityBadge';
import { bloodService, authService } from '../services/api';
import {
  CalendarPlus,
  Heart,
  FlaskConical,
  Clock,
  ShieldCheck,
  Zap,
  Activity,
  ArrowRight,
  Stethoscope,
  Users,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Droplet
} from 'lucide-react';

export const LandingPage = ({ onNavigate }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [bloodStock, setBloodStock] = useState([]);
  const [doctors, setDoctors] = useState([]);

  // Triage simulator state
  const [severity, setSeverity] = useState('Moderate');
  const [age, setAge] = useState(65);
  const [hasChronic, setHasChronic] = useState(true);
  const [isEmergency, setIsEmergency] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bloodRes, docRes] = await Promise.all([
          bloodService.getInventory(),
          authService.getDoctors()
        ]);
        setBloodStock(bloodRes.data.inventory || []);
        setDoctors(docRes.data.doctors || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // Priority formula calculation
  const getSimulatedScore = () => {
    let sevScore = severity === 'Severe' ? 3 : severity === 'Moderate' ? 2 : 1;
    let ageScore = age >= 65 ? 3 : age >= 45 ? 2 : 1;
    let chrScore = hasChronic ? 2 : 0;
    let score = (sevScore * 5) + (ageScore * 2) + (chrScore * 3);
    if (isEmergency) score += 100;

    let level = (isEmergency || score >= 20) ? 'High' : score >= 12 ? 'Moderate' : 'Low';
    return { score, level, sevScore: sevScore * 5, ageScore: ageScore * 2, chrScore: chrScore * 3 };
  };

  const sim = getSimulatedScore();

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 text-white p-8 sm:p-12 shadow-2xl border border-slate-800">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 px-3.5 py-1.5 rounded-full text-xs font-semibold border border-sky-500/30">
            <Activity className="w-3.5 h-3.5 text-sky-400" />
            <span>Next-Gen Smart Healthcare Portal</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Intelligent Triage & Seamless Healthcare Workflow
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Revolutionizing outpatient scheduling with real-time clinical urgency sorting, integrated blood bank matching, capacity-managed lab test bookings, and doctor queue management.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate(user ? '/book-appointment' : '/login')}
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold px-6 py-3 rounded-xl shadow-lg shadow-sky-600/30 transition transform hover:-translate-y-0.5 text-sm"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>{t('bookAppointment')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigate('/queue-tracker')}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold px-5 py-3 rounded-xl transition text-sm"
            >
              <Clock className="w-4 h-4 text-sky-400" />
              <span>{t('navQueueTracker')}</span>
            </button>

            <button
              onClick={() => onNavigate('/blood-bank')}
              className="flex items-center gap-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-semibold px-5 py-3 rounded-xl transition text-sm"
            >
              <Heart className="w-4 h-4 text-rose-400" />
              <span>{t('bloodDonationPortal')}</span>
            </button>
          </div>
        </div>

        {/* Hero Quick Highlights */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 pt-8 border-t border-slate-800/80 text-xs">
          <div className="space-y-1">
            <div className="text-sky-400 font-bold text-lg sm:text-xl">100%</div>
            <div className="text-slate-400">Slot Concurrency Protection</div>
          </div>
          <div className="space-y-1">
            <div className="text-emerald-400 font-bold text-lg sm:text-xl">AI-Driven</div>
            <div className="text-slate-400">Clinical Urgency Sorting</div>
          </div>
          <div className="space-y-1">
            <div className="text-rose-400 font-bold text-lg sm:text-xl">8 Groups</div>
            <div className="text-slate-400">Live Blood Bank Tracking</div>
          </div>
          <div className="space-y-1">
            <div className="text-amber-400 font-bold text-lg sm:text-xl">&lt; 15 mins</div>
            <div className="text-slate-400">Predicted Consultation Slots</div>
          </div>
        </div>
      </section>

      {/* Interactive Clinical Priority Scoring Engine Demo */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Live Algorithm Demonstration</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
              Clinical Priority Scoring Formula
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Priority Score = (Severity × 5) + (Age Factor × 2) + (Chronic Disease × 3)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <PriorityBadge level={sim.level} score={sim.score} isEmergency={isEmergency} size="md" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Controls */}
          <div className="space-y-5 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                1. Clinical Severity Level:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Mild', 'Moderate', 'Severe'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                      severity === sev
                        ? 'bg-sky-600 text-white border-sky-600 shadow'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs">
                <span className="font-bold text-slate-700">2. Patient Age Factor:</span>
                <span className="font-bold text-sky-700">{age} Years Old</span>
              </div>
              <input
                type="range"
                min="1"
                max="95"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>&lt;45 (Weight 1)</span>
                <span>45-64 (Weight 2)</span>
                <span>65+ Elderly (Weight 3)</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-bold text-slate-700 block">3. Chronic Conditions:</span>
                <span className="text-[11px] text-slate-500">Diabetes, Hypertension, Cardiac</span>
              </div>
              <input
                type="checkbox"
                checked={hasChronic}
                onChange={(e) => setHasChronic(e.target.checked)}
                className="w-5 h-5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <div>
                <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Emergency Queue Override:
                </span>
                <span className="text-[11px] text-slate-500">Critical acute symptoms</span>
              </div>
              <input
                type="checkbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-5 h-5 rounded text-red-600 focus:ring-red-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Breakdown & Visual Output */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xl space-y-5">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700 pb-2">
              Live Score Computation Breakdown
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                <span className="text-slate-400">Severity Factor (Weight 5)</span>
                <span className="font-mono font-bold text-sky-400">+{sim.sevScore}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                <span className="text-slate-400">Age Risk Factor (Weight 2)</span>
                <span className="font-mono font-bold text-sky-400">+{sim.ageScore}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-700/50">
                <span className="text-slate-400">Chronic Disease Factor (Weight 3)</span>
                <span className="font-mono font-bold text-sky-400">+{sim.chrScore}</span>
              </div>
              {isEmergency && (
                <div className="flex justify-between items-center py-1 text-red-400 font-bold">
                  <span>Emergency Queue Leap Override</span>
                  <span className="font-mono">+100</span>
                </div>
              )}
            </div>

            <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Total Clinical Score</span>
                <strong className="text-2xl font-extrabold text-white font-mono">{sim.score}</strong>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">Assigned Queue Priority</span>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                  sim.level === 'High' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                  sim.level === 'Moderate' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                  'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}>
                  {sim.level} Priority
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed italic">
              Patients categorized as <strong>High Priority</strong> automatically bypass routine delays and are positioned at the earliest available doctor consultation slot.
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => onNavigate('/book-appointment')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-sky-300 transition cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <CalendarPlus className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-2">Outpatient Appointments</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Select department, choose top specialized consultants, pick conflict-free time slots, and track real-time queue position.
          </p>
          <span className="text-xs font-bold text-sky-600 flex items-center gap-1 group-hover:translate-x-1 transition">
            Book OPD Slot <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('/blood-bank')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-rose-300 transition cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-2">Blood Bank & Donors</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            90-day eligibility calculator, real-time inventory tracking for 8 blood types, emergency broadcast dispatches, and certificate records.
          </p>
          <span className="text-xs font-bold text-rose-600 flex items-center gap-1 group-hover:translate-x-1 transition">
            Access Blood Portal <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>

        <div
          onClick={() => onNavigate('/lab-tests')}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-2">Lab & Diagnostic Booking</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Complete test catalog (CBC, MRI, Lipid, X-Ray), home sample collection toggle, AI symptom test recommender, and instant PDF report downloads.
          </p>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:translate-x-1 transition">
            Browse Lab Tests <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </section>

      {/* Live Blood Inventory Snapshot */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplet className="w-5 h-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-lg">Hospital Blood Inventory Snapshot</h3>
          </div>
          <button
            onClick={() => onNavigate('/blood-bank')}
            className="text-xs font-bold text-rose-600 hover:underline"
          >
            View Full Blood Bank &rarr;
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {bloodStock.map((item) => (
            <div
              key={item.bloodGroup}
              className={`p-3 rounded-2xl border text-center ${
                item.unitsAvailable <= item.criticalThreshold
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="text-sm font-extrabold">{item.bloodGroup}</div>
              <div className="text-xl font-black mt-1">{item.unitsAvailable} <span className="text-[10px] font-normal text-slate-500">units</span></div>
              <div className="mt-1">
                {item.unitsAvailable <= item.criticalThreshold ? (
                  <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded-full uppercase">
                    Low Stock
                  </span>
                ) : (
                  <span className="text-[9px] text-emerald-700 bg-emerald-100 font-semibold px-1.5 py-0.2 rounded-full">
                    Available
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
