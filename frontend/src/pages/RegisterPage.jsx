import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  UserPlus,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Heart,
  Activity,
  ArrowRight,
  AlertCircle,
  Stethoscope,
  Shield,
  Building2,
  Calendar,
  DollarSign,
  Award
} from 'lucide-react';

export const RegisterPage = ({ onNavigate }) => {
  const { register } = useAuth();
  const { t } = useLanguage();

  // Read initial role from query params e.g. /register?role=doctor
  const [role, setRole] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const paramRole = params.get('role');
    if (paramRole === 'doctor' || paramRole === 'donor') return paramRole;
    return 'patient';
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    age: 30,
    gender: 'Male',
    bloodGroup: 'O+',
    city: 'Chennai',
    // Patient specific
    hasChronicCondition: false,
    chronicDiseases: '',
    // Doctor specific
    department: 'Cardiology',
    specialization: 'Senior Consultant',
    experienceYears: 10,
    consultationFee: 700,
    roomNumber: 'OPD-101',
    // Blood Donor specific
    weightKg: 68,
    lastDonationDate: '',
    isFirstTimeDonor: true,
    availableForEmergency: true
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const departments = [
    'Cardiology',
    'Orthopedics',
    'Neurology',
    'General Medicine',
    'Pediatrics',
    'Oncology',
    'Dermatology',
    'Gastroenterology',
    'ENT'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: role,
        phone: formData.phone,
        age: Number(formData.age) || 30,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        city: formData.city
      };

      if (role === 'patient') {
        payload.hasChronicCondition = Boolean(formData.hasChronicCondition);
        payload.chronicDiseases = formData.chronicDiseases
          ? formData.chronicDiseases.split(',').map(s => s.trim()).filter(Boolean)
          : [];
      } else if (role === 'doctor') {
        payload.doctorProfile = {
          department: formData.department,
          specialization: formData.specialization,
          experienceYears: Number(formData.experienceYears) || 5,
          consultationFee: Number(formData.consultationFee) || 500,
          roomNumber: formData.roomNumber || 'OPD-101',
          availabilityStatus: 'Available',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          slotTimes: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM']
        };
      } else if (role === 'donor') {
        payload.donorProfile = {
          weightKg: Number(formData.weightKg) || 65,
          lastDonationDate: formData.isFirstTimeDonor ? null : (formData.lastDonationDate || null),
          totalDonations: formData.isFirstTimeDonor ? 0 : 1,
          isAvailableForEmergency: formData.availableForEmergency
        };
      }

      const newUser = await register(payload);
      if (newUser.role === 'doctor') onNavigate('/doctor-dashboard');
      else if (newUser.role === 'donor') onNavigate('/donor-dashboard');
      else onNavigate('/patient-dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please verify your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl w-full mx-auto py-6">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
        {/* Hospital Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
            🏥 MEDCARE HOSPITAL
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Healthcare Account</h2>
          <p className="text-xs text-slate-500">Register as a Patient, Doctor, or Blood Donor</p>
        </div>

        {/* Tab Switcher: Sign In vs Sign Up */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => onNavigate(`/login?role=${role}`)}
            className="flex-1 py-2 rounded-xl text-slate-500 hover:text-slate-900 text-center transition"
          >
            Sign In
          </button>
          <button
            type="button"
            className="flex-1 py-2 rounded-xl bg-white text-emerald-700 shadow-sm text-center"
          >
            Sign Up (Register)
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Public Registration Roles Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Select Registration Category:</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Patient */}
              <button
                type="button"
                onClick={() => setRole('patient')}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                  role === 'patient'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-600/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <User className="w-5 h-5" />
                <span>Patient Account</span>
              </button>

              {/* Blood Donor */}
              <button
                type="button"
                onClick={() => setRole('donor')}
                className={`py-3 px-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1.5 ${
                  role === 'donor'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Heart className="w-5 h-5" />
                <span>Blood Donor Account</span>
              </button>
            </div>
          </div>

          {/* Primary Profile Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {role === 'doctor' ? 'Doctor Full Name' : 'Full Name'}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={role === 'doctor' ? 'Dr. Name Surname' : 'Your Full Name'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98400 12345"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={role === 'doctor' ? 'doctor@medcare.com' : 'name@example.com'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 characters"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                min={1}
                max={120}
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Blood Group</label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-sky-500 font-bold text-rose-700"
              >
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-bold text-slate-700 mb-1">City / Region</label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Chennai, Madurai, Coimbatore"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Role-Specific Custom Sections */}
          
          {/* 1. DOCTOR SPECIFIC */}
          {role === 'doctor' && (
            <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-3 text-xs animate-in fade-in duration-200">
              <div className="font-bold text-blue-900 flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-blue-600" />
                <span>Doctor Clinical Profile & Department Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clinical Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full p-2 bg-white border border-blue-200 rounded-xl font-semibold"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Specialization / Title</label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="e.g. Senior Interventional Cardiologist"
                    className="w-full p-2 bg-white border border-blue-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Experience (Yrs)</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.experienceYears}
                    onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                    className="w-full p-2 bg-white border border-blue-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">OPD Fee (₹)</label>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={formData.consultationFee}
                    onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
                    className="w-full p-2 bg-white border border-blue-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">OPD Room No</label>
                  <input
                    type="text"
                    value={formData.roomNumber}
                    onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                    placeholder="OPD-204"
                    className="w-full p-2 bg-white border border-blue-200 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 2. BLOOD DONOR SPECIFIC */}
          {role === 'donor' && (
            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-4 space-y-3 text-xs animate-in fade-in duration-200">
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-600" />
                <span>Blood Donor Eligibility & History</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Body Weight (kg)</label>
                  <input
                    type="number"
                    min={45}
                    max={150}
                    value={formData.weightKg}
                    onChange={(e) => setFormData({ ...formData, weightKg: e.target.value })}
                    className="w-full p-2 bg-white border border-rose-200 rounded-xl"
                  />
                  <span className="text-[10px] text-slate-500">Min 50kg recommended for donation</span>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-slate-700 mb-1">Donation History</label>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="firstTime"
                      checked={formData.isFirstTimeDonor}
                      onChange={(e) => setFormData({ ...formData, isFirstTimeDonor: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600"
                    />
                    <label htmlFor="firstTime" className="text-slate-700 cursor-pointer font-semibold">First Time Donor</label>
                  </div>
                </div>
              </div>

              {!formData.isFirstTimeDonor && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Last Blood Donation Date</label>
                  <input
                    type="date"
                    value={formData.lastDonationDate}
                    onChange={(e) => setFormData({ ...formData, lastDonationDate: e.target.value })}
                    className="w-full p-2 bg-white border border-rose-200 rounded-xl"
                  />
                  <span className="text-[10px] text-slate-500">90-day eligibility engine will calculate donation gap</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="emergencyOpt"
                  checked={formData.availableForEmergency}
                  onChange={(e) => setFormData({ ...formData, availableForEmergency: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600"
                />
                <label htmlFor="emergencyOpt" className="text-slate-700 cursor-pointer">
                  Opt-in for Real-Time Emergency Hospital Blood Broadcasts
                </label>
              </div>
            </div>
          )}

          {/* 3. PATIENT SPECIFIC (Chronic conditions) */}
          {role === 'patient' && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Pre-existing Chronic Diseases</span>
                  <span className="text-[11px] text-slate-500">Affects clinical urgency priority calculation</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.hasChronicCondition}
                  onChange={(e) => setFormData({ ...formData, hasChronicCondition: e.target.checked })}
                  className="w-5 h-5 rounded text-sky-600 cursor-pointer"
                />
              </div>

              {formData.hasChronicCondition && (
                <input
                  type="text"
                  value={formData.chronicDiseases}
                  onChange={(e) => setFormData({ ...formData, chronicDiseases: e.target.value })}
                  placeholder="Comma separated: Type 2 Diabetes, Hypertension, Asthma, Cardiac"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-sky-500 mt-2"
                />
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white font-bold py-3 rounded-xl shadow-md transition text-xs flex items-center justify-center gap-2 ${
              role === 'doctor'
                ? 'bg-blue-600 hover:bg-blue-500'
                : role === 'donor'
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-sky-600 hover:bg-sky-500'
            }`}
          >
            <span>{loading ? t('loading') : `Register as ${role.toUpperCase()}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Staff & Admin Provisioning Access Notes */}
        <div className="space-y-2 pt-1">
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-3 text-center text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2 text-left">
              <Stethoscope className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Hospital Doctor? Accounts are provisioned by Hospital Admin.</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/login?role=doctor')}
              className="text-blue-700 hover:underline font-bold text-xs shrink-0"
            >
              Doctor Sign In &rarr;
            </button>
          </div>

          <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-3 text-center text-xs text-purple-900 flex items-center justify-between">
            <div className="flex items-center gap-2 text-left">
              <Shield className="w-4 h-4 text-purple-700 shrink-0" />
              <span>Hospital Administrator? Access is centrally managed.</span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/login?role=admin')}
              className="text-purple-700 hover:underline font-bold text-xs shrink-0"
            >
              Admin Sign In &rarr;
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate(`/login?role=${role}`)}
            className="font-bold text-sky-600 hover:underline"
          >
            Sign In Here
          </button>
        </p>
      </div>
    </div>
  );
};


