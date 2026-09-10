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
  ArrowRight
} from 'lucide-react';

export const BookLabTestPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [tests, setTests] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTest, setSelectedTest] = useState(null);

  // Booking fields
  const [bookingDate, setBookingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [slotTime, setSlotTime] = useState('08:30 AM');
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
      setTests(res.data.tests || []);
      if (res.data.tests?.length > 0 && !selectedTest) {
        setSelectedTest(res.data.tests[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [categoryFilter, searchTerm]);

  // Load user's appointments for optional linkage
  useEffect(() => {
    if (user) {
      appointmentService.getMy().then(res => {
        setUserAppointments(res.data.appointments || []);
      }).catch(console.error);
    }
  }, [user]);

  const handleConfirmLabBooking = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;

    try {
      setError('');
      const res = await labService.bookTest({
        labTestId: selectedTest._id,
        bookingDate,
        slotTime,
        isHomeSampleCollection: isHomeCollection,
        collectionAddress,
        linkedAppointment: linkedApptId || null,
        referringDoctor: userAppointments.find(a => a._id === linkedApptId)?.doctorName || 'Self / OPD Physician'
      });

      setBookingSuccess(res.data.booking);
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Error booking lab test');
    }
  };

  if (user?.role === 'doctor' || user?.role === 'admin') {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Patient-Only Service</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Diagnostic lab test booking is reserved strictly for patients. Doctors can recommend investigations during outpatient consultations, and Administrators manage tests in the Hospital Catalog.
        </p>
        <button
          onClick={() => onNavigate(user.role === 'doctor' ? '/doctor-dashboard' : '/admin-dashboard')}
          className="bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow transition"
        >
          Return to {user.role === 'doctor' ? 'Doctor Dashboard' : 'Admin Dashboard'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-400/30 font-semibold">
          <FlaskConical className="w-3.5 h-3.5" />
          <span>Diagnostic Laboratory & Imaging Services</span>
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
            <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
              Lab Booking Details
            </h3>

            {selectedTest && (
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-1">
                <span className="text-[11px] text-emerald-800 font-semibold">Selected Test:</span>
                <div className="font-bold text-emerald-950 text-sm">{selectedTest.name}</div>
                <div className="text-emerald-800 font-semibold">Standard Test Fee: ₹{selectedTest.price}</div>
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Collection Date</label>
              <input
                type="date"
                required
                value={bookingDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setBookingDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Time Window</label>
              <select
                value={slotTime}
                onChange={(e) => setSlotTime(e.target.value)}
                className="w-full p-2 bg-slate-50 border rounded-xl"
              >
                {['07:30 AM', '08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM', '02:30 PM', '04:30 PM'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Home Collection Option */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-800 block">Home Sample Collection</span>
                  <span className="text-[10px] text-slate-500">+₹150 phlebotomist visit</span>
                </div>
                <input
                  type="checkbox"
                  checked={isHomeCollection}
                  onChange={(e) => setIsHomeCollection(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600"
                />
              </div>

              {isHomeCollection && (
                <input
                  type="text"
                  placeholder="Enter home pickup address..."
                  value={collectionAddress}
                  onChange={(e) => setCollectionAddress(e.target.value)}
                  className="w-full p-2 bg-white border rounded-lg text-xs"
                />
              )}
            </div>

            {/* Linked Appointment */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Link to OPD Doctor (Optional)</label>
              <select
                value={linkedApptId}
                onChange={(e) => setLinkedApptId(e.target.value)}
                className="w-full p-2 bg-slate-50 border rounded-xl"
              >
                <option value="">None (Self Booking / General Triage)</option>
                {userAppointments.map(a => (
                  <option key={a._id} value={a._id}>
                    {a.doctorName} ({a.department}) - {a.appointmentDate}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Calculation */}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Total Payable:</span>
              <span className="text-emerald-700 text-base">
                ₹{(selectedTest?.price || 0) + (isHomeCollection ? 150 : 0)}
              </span>
            </div>

            <button
              type="submit"
              disabled={!selectedTest}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2"
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
                <strong className="text-emerald-700">{bookingSuccess.isHomeSampleCollection ? 'Home Phlebotomy Collection' : 'Central Diagnostic Lab'}</strong>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                <span>Total Amount:</span>
                <span>₹{bookingSuccess.totalAmount} (Paid)</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate('/patient-dashboard')}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow transition"
            >
              Go to Dashboard & Records
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
