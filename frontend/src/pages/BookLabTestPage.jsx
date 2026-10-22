import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { labService, appointmentService } from '../services/api';
import confetti from 'canvas-confetti';
import {
  FlaskConical,
  Search,
  Home,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Building,
  ArrowRight,
  UserCheck,
  Stethoscope
} from 'lucide-react';

// Time helpers to ensure no past timing booking and only future timings are visible
const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTomorrowDateString = (offsetDays = 1) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ALL_LAB_WINDOWS = [
  '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM'
];

const isSlotInPast = (dateStr, slotTimeStr) => {
  const now = new Date();
  const todayStr = getTodayDateString();
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const match = (slotTimeStr || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return false;
  let [_, hours, minutes, period] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  
  // 15-minute grace period buffer to avoid race condition rejections
  const slotDate = new Date(year, month - 1, day, hours, minutes + 15, 0, 0);
  return slotDate <= now;
};

const getInitialBookingDate = () => {
  const today = getTodayDateString();
  const hasSlotToday = ALL_LAB_WINDOWS.some(slot => !isSlotInPast(today, slot));
  return hasSlotToday ? today : getTomorrowDateString(1);
};

const FALLBACK_LAB_TESTS = [
  {
    _id: 'fallback-cbc-01',
    name: 'Complete Blood Count (CBC) with ESR',
    category: 'Pathology',
    code: 'CBC-01',
    description: 'Comprehensive screening test evaluating red blood cells, white blood cells, platelets, and infection markers.',
    price: 450,
    sampleType: 'Blood',
    fastingRequired: false,
    turnaroundHours: 12,
    dailyCapacity: 40,
    isHomeSampleAvailable: true
  },
  {
    _id: 'fallback-lip-01',
    name: 'Comprehensive Lipid Profile',
    category: 'Biochemistry',
    code: 'LIP-01',
    description: 'Measures total cholesterol, HDL, LDL, VLDL, and triglycerides for cardiovascular health risk assessment.',
    price: 650,
    sampleType: 'Blood',
    fastingRequired: true,
    turnaroundHours: 24,
    dailyCapacity: 30,
    isHomeSampleAvailable: true
  },
  {
    _id: 'fallback-hba1c-01',
    name: 'HbA1c (Glycosylated Hemoglobin)',
    category: 'Biochemistry',
    code: 'HBA1C-01',
    description: 'Reflects average blood glucose control over the past 2 to 3 months. Essential for diabetes management.',
    price: 500,
    sampleType: 'Blood',
    fastingRequired: false,
    turnaroundHours: 12,
    dailyCapacity: 35,
    isHomeSampleAvailable: true
  },
  {
    _id: 'fallback-lft-01',
    name: 'Liver Function Test (LFT Profile)',
    category: 'Biochemistry',
    code: 'LFT-01',
    description: 'Measures Bilirubin (Total/Direct), SGOT (AST), SGPT (ALT), Alkaline Phosphatase, and Total Protein.',
    price: 700,
    sampleType: 'Blood',
    fastingRequired: true,
    turnaroundHours: 18,
    dailyCapacity: 25,
    isHomeSampleAvailable: true
  },
  {
    _id: 'fallback-kft-01',
    name: 'Renal / Kidney Function Test (KFT)',
    category: 'Biochemistry',
    code: 'KFT-01',
    description: 'Evaluates kidney performance via Blood Urea Nitrogen (BUN), Serum Creatinine, and Uric Acid.',
    price: 600,
    sampleType: 'Blood',
    fastingRequired: false,
    turnaroundHours: 12,
    dailyCapacity: 30,
    isHomeSampleAvailable: true
  },
  {
    _id: 'fallback-thy-01',
    name: 'Thyroid Stimulating Hormone (TSH) & Profile',
    category: 'Biochemistry',
    code: 'THY-01',
    description: 'Assesses thyroid gland function measuring T3, T4, and TSH hormones.',
    price: 550,
    sampleType: 'Blood',
    fastingRequired: true,
    turnaroundHours: 24,
    dailyCapacity: 35,
    isHomeSampleAvailable: true
  },
  {
    _id: 'fallback-xray-01',
    name: 'Digital Chest X-Ray (PA View)',
    category: 'Radiology',
    code: 'XRAY-01',
    description: 'Evaluates lungs, cardiac silhouette, mediastinum, pleura, and thoracic cage structure.',
    price: 400,
    sampleType: 'Digital Radiograph',
    fastingRequired: false,
    turnaroundHours: 4,
    dailyCapacity: 50,
    isHomeSampleAvailable: false
  },
  {
    _id: 'fallback-mri-01',
    name: 'MRI Brain (Plain + Contrast)',
    category: 'Radiology',
    code: 'MRI-01',
    description: 'High-resolution magnetic resonance imaging of brain parenchyma, ventricles, and neurovasculature.',
    price: 6500,
    sampleType: 'Scan Imaging',
    fastingRequired: false,
    turnaroundHours: 24,
    dailyCapacity: 10,
    isHomeSampleAvailable: false
  },
  {
    _id: 'fallback-ecg-01',
    name: '12-Lead Resting Electrocardiogram (ECG)',
    category: 'Cardiology',
    code: 'ECG-01',
    description: 'Records electrical activity of the heart to detect arrhythmias, ischemia, or prior myocardial infarction.',
    price: 300,
    sampleType: 'Electrical Trace',
    fastingRequired: false,
    turnaroundHours: 2,
    dailyCapacity: 60,
    isHomeSampleAvailable: true
  },
  {
    _id: 'fallback-urine-01',
    name: 'Urine Routine & Microscopic Examination',
    category: 'Pathology',
    code: 'URINE-01',
    description: 'Physical, chemical, and microscopic examination for renal health, infection, and glycosuria.',
    price: 250,
    sampleType: 'Urine',
    fastingRequired: false,
    turnaroundHours: 6,
    dailyCapacity: 50,
    isHomeSampleAvailable: true
  }
];

const categories = ['All', 'Pathology', 'Radiology', 'Cardiology', 'Biochemistry', 'Microbiology'];

export const BookLabTestPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [tests, setTests] = useState(FALLBACK_LAB_TESTS);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTest, setSelectedTest] = useState(FALLBACK_LAB_TESTS[0]);

  // Booking fields with smart date selection
  const todayStr = getTodayDateString();
  const tomorrowStr = getTomorrowDateString(1);
  const dayAfterStr = getTomorrowDateString(2);

  const [bookingDate, setBookingDate] = useState(getInitialBookingDate);
  const isPastDate = bookingDate < todayStr;
  const isToday = bookingDate === todayStr;

  // Filter lab windows so only future timings are visible to users
  const visibleLabSlots = ALL_LAB_WINDOWS.filter((slot) => {
    if (isPastDate) return false;
    if (isToday && isSlotInPast(bookingDate, slot)) return false;
    return true;
  });

  const [slotTime, setSlotTime] = useState('');

  // Automatically ensure slotTime selects a valid future slot
  useEffect(() => {
    if (visibleLabSlots.length > 0 && !visibleLabSlots.includes(slotTime)) {
      setSlotTime(visibleLabSlots[0]);
    } else if (visibleLabSlots.length === 0) {
      setSlotTime('');
    }
  }, [visibleLabSlots, slotTime]);

  const [isHomeCollection, setIsHomeCollection] = useState(false);
  const [collectionAddress, setCollectionAddress] = useState(user?.city || 'Chennai');
  const [userAppointments, setUserAppointments] = useState([]);
  const [linkedApptId, setLinkedApptId] = useState('');

  const [loading, setLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [error, setError] = useState('');

  const fetchTests = async () => {
    try {
      setLoading(true);
      const res = await labService.getTests({
        category: categoryFilter,
        search: searchTerm
      });
      let fetched = res.data.tests || [];

      // If backend returned 0 tests, attempt auto-seed endpoint
      if (fetched.length === 0) {
        try {
          const seedRes = await labService.seedTests();
          if (seedRes.data.tests?.length > 0) {
            fetched = seedRes.data.tests;
          }
        } catch (sErr) {
          console.warn('Seed endpoint note:', sErr.message);
        }
      }

      // If still empty and no specific search, use fallback tests
      if (fetched.length === 0 && (!searchTerm || searchTerm.trim() === '')) {
        fetched = categoryFilter === 'All'
          ? FALLBACK_LAB_TESTS
          : FALLBACK_LAB_TESTS.filter(t => t.category === categoryFilter);
      }

      setTests(fetched);
      if (fetched.length > 0) {
        setSelectedTest(prev => {
          if (prev && fetched.some(t => t.code === prev.code || t._id === prev._id)) {
            return fetched.find(t => t.code === prev.code || t._id === prev._id);
          }
          return fetched[0];
        });
      }
    } catch (err) {
      console.error('Error fetching lab tests:', err);
      const fallbackFiltered = categoryFilter === 'All'
        ? FALLBACK_LAB_TESTS
        : FALLBACK_LAB_TESTS.filter(t => t.category === categoryFilter);
      setTests(fallbackFiltered);
      if (!selectedTest && fallbackFiltered.length > 0) {
        setSelectedTest(fallbackFiltered[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [categoryFilter, searchTerm]);

  // Load user's appointments for optional linkage
  useEffect(() => {
    if (user && user.role === 'patient') {
      appointmentService.getMy().then(res => {
        setUserAppointments(res.data.appointments || []);
      }).catch(console.error);
    }
  }, [user]);

  const handleConfirmLabBooking = async (e) => {
    e.preventDefault();
    if (!selectedTest) {
      setError('Please select a diagnostic test from the catalog.');
      return;
    }

    if (bookingDate < todayStr || isSlotInPast(bookingDate, slotTime)) {
      setError('Cannot book diagnostic lab tests for past dates or past time slots. Please choose a future timing.');
      return;
    }

    if (!slotTime) {
      setError('Please select an available collection time window.');
      return;
    }

    try {
      setError('');
      const defaultDoctor = user?.role === 'doctor' ? `Dr. ${user.name}` : 'Self / OPD Physician';
      const selectedDoc = userAppointments.find(a => a._id === linkedApptId)?.doctorName || defaultDoctor;

      const isFallbackId = !selectedTest._id || String(selectedTest._id).startsWith('fallback-');

      const res = await labService.bookTest({
        labTestId: isFallbackId ? undefined : selectedTest._id,
        testCode: selectedTest.code,
        testName: selectedTest.name,
        bookingDate,
        slotTime,
        isHomeSampleCollection: isHomeCollection,
        collectionAddress: isHomeCollection ? collectionAddress : undefined,
        linkedAppointment: linkedApptId || null,
        referringDoctor: selectedDoc
      });

      setBookingSuccess(res.data.booking);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      console.error('Booking error response:', err.response?.data);
      setError(err.response?.data?.message || 'Error booking lab test. Please try again.');
    }
  };


  return (
    <div className="max-w-5xl mx-auto py-6 space-y-6 pb-20 px-3 sm:px-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-400/30 font-semibold">
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Diagnostic Laboratory & Imaging Services</span>
          </div>

          {user?.role === 'doctor' && (
            <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-400/30 font-semibold">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>Clinician Mode: Ordering Diagnostic Investigation</span>
            </span>
          )}

          {user?.role === 'admin' && (
            <span className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-full border border-amber-400/30 font-semibold">
              <UserCheck className="w-3.5 h-3.5" />
              <span>Admin Operations: Lab Registration</span>
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold">Book Diagnostic Lab Test</h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Search comprehensive pathology & imaging panels • Home sample phlebotomy • Linked doctor consultations
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Catalog & Booking Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Test Catalog & Search */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            {/* Search Bar */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search lab tests (e.g. CBC, MRI, Lipid)..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    categoryFilter === cat
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Test Cards List */}
          <div className="space-y-3">
            {tests.map((test) => (
              <div
                key={test._id}
                onClick={() => setSelectedTest(test)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex justify-between items-start gap-4 ${
                  selectedTest?._id === test._id
                    ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{test.name}</h4>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                      {test.code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{test.description}</p>
                  <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 pt-1">
                    <span>Sample: <strong>{test.sampleType}</strong></span>
                    <span>Turnaround: <strong>{test.turnaroundHours} hrs</strong></span>
                    {test.fastingRequired && (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                        Fasting Required
                      </span>
                    )}
                    {test.isHomeSampleAvailable && (
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        Home Sample Available
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="text-base font-extrabold text-slate-900">₹{test.price}</span>
                  <div className="text-[10px] text-slate-400 mt-1">Cap: {test.dailyCapacity} / day</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Checkout & Booking Panel */}
        <div className="space-y-4">
          <form
            onSubmit={handleConfirmLabBooking}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 sticky top-20 text-xs"
          >
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Lab Booking Details</span>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                MedCare Lab
              </span>
            </h3>

            {selectedTest && (
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-[11px] text-emerald-800 font-semibold">Selected Test:</span>
                <div className="font-bold text-emerald-950 text-sm">{selectedTest.name}</div>
                <div className="text-emerald-800 font-semibold">Standard Test Fee: ₹{selectedTest.price}</div>
              </div>
            )}

            {/* Date Selection with Quick Chips */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block font-bold text-slate-700">Collection Date</label>
                <span className="text-[10px] text-slate-400">Future dates only</span>
              </div>

              {/* Quick Date Chips */}
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                <button
                  type="button"
                  onClick={() => setBookingDate(todayStr)}
                  className={`py-1.5 text-[11px] rounded-lg font-semibold transition border ${
                    bookingDate === todayStr
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setBookingDate(tomorrowStr)}
                  className={`py-1.5 text-[11px] rounded-lg font-semibold transition border ${
                    bookingDate === tomorrowStr
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setBookingDate(dayAfterStr)}
                  className={`py-1.5 text-[11px] rounded-lg font-semibold transition border ${
                    bookingDate === dayAfterStr
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Day After
                </button>
              </div>

              <input
                type="date"
                required
                value={bookingDate}
                min={todayStr}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Time Window</label>
              {isPastDate ? (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                  Past dates cannot be selected. Please choose today or a future date.
                </div>
              ) : visibleLabSlots.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-2">
                  <div className="font-bold flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>All slots for today have completed</span>
                  </div>
                  <p className="text-[11px] text-amber-700">
                    Diagnostic collection windows close once the time passes. Please choose tomorrow or another upcoming date.
                  </p>
                  <button
                    type="button"
                    onClick={() => setBookingDate(tomorrowStr)}
                    className="w-full bg-amber-600 hover:bg-amber-500 text-white py-1.5 px-3 rounded-lg text-xs font-semibold shadow-xs transition"
                  >
                    Switch to Tomorrow ({tomorrowStr})
                  </button>
                </div>
              ) : (
                <select
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {visibleLabSlots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Home Collection Option */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Home Sample Collection</span>
                  <span className="text-[10px] text-slate-500">+₹150 phlebotomist visit fee</span>
                </div>
                <input
                  type="checkbox"
                  checked={isHomeCollection}
                  onChange={(e) => setIsHomeCollection(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
                />
              </div>

              {isHomeCollection && (
                <input
                  type="text"
                  placeholder="Enter home pickup address..."
                  value={collectionAddress}
                  onChange={(e) => setCollectionAddress(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
              )}
            </div>

            {/* Linked Appointment */}
            {userAppointments.length > 0 && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Link to OPD Doctor (Optional)</label>
                <select
                  value={linkedApptId}
                  onChange={(e) => setLinkedApptId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border rounded-xl outline-none text-xs"
                >
                  <option value="">None (Self Booking / General Triage)</option>
                  {userAppointments.map(a => (
                    <option key={a._id} value={a._id}>
                      {a.doctorName} ({a.department}) - {a.appointmentDate}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Total Calculation */}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Total Payable:</span>
              <span className="text-emerald-700 text-base">
                ₹{(selectedTest?.price || 0) + (isHomeCollection ? 150 : 0)}
              </span>
            </div>

            <button
              type="submit"
              disabled={!selectedTest || visibleLabSlots.length === 0 || !slotTime || isPastDate}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Confirm Lab Booking</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Booking Success Modal */}
      {bookingSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200 text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Lab Test Booked!</h3>
              <p className="text-xs text-slate-500">Diagnostic investigation slot confirmed</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Test Name:</span>
                <strong className="text-slate-800">{bookingSuccess.testName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Date:</span>
                <strong>{bookingSuccess.bookingDate} at {bookingSuccess.slotTime}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Collection Mode:</span>
                <strong className="text-emerald-700">
                  {bookingSuccess.isHomeSampleCollection ? 'Home Phlebotomy Collection' : 'Central Diagnostic Lab'}
                </strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span>Total Amount:</span>
                <span>₹{bookingSuccess.totalAmount} (Confirmed)</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (user?.role === 'doctor') onNavigate('/doctor-dashboard');
                else if (user?.role === 'admin') onNavigate('/admin-dashboard');
                else onNavigate('/patient-dashboard');
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow transition cursor-pointer"
            >
              Return to {user?.role === 'doctor' ? 'Doctor Dashboard' : user?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard & Records'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
