import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { authService, appointmentService, priorityService } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import confetti from 'canvas-confetti';
import {
  CalendarPlus,
  Stethoscope,
  Clock,
  User,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const BookAppointmentPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [doctors, setDoctors] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState('Cardiology');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Clinical triage fields
  const [symptoms, setSymptoms] = useState('');
  const [severity, setSeverity] = useState('Moderate');
  const [patientAge, setPatientAge] = useState(user?.age || 35);
  const [hasChronic, setHasChronic] = useState(user?.hasChronicCondition || false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [simulatedPriority, setSimulatedPriority] = useState({ priorityScore: 16, priorityLevel: 'Moderate' });

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);
  const [error, setError] = useState('');

  // Fetch doctors
  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await authService.getDoctors(selectedDepartment);
        setDoctors(res.data.doctors || []);
        if (res.data.doctors && res.data.doctors.length > 0) {
          setSelectedDoctor(res.data.doctors[0]);
        } else {
          setSelectedDoctor(null);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadDoctors();
  }, [selectedDepartment]);

  // Fetch available slots for doctor & date
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) return;

    const loadSlots = async () => {
      try {
        setLoadingSlots(true);
        const res = await appointmentService.getSlots(selectedDoctor._id, selectedDate);
        setAvailableSlots(res.data.slots || []);
        // Select first available slot
        const firstAvail = res.data.slots?.find(s => s.isAvailable);
        setSelectedSlot(firstAvail ? firstAvail.slotTime : '');
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSlots(false);
      }
    };
    loadSlots();
  }, [selectedDoctor, selectedDate]);

  // Recalculate priority preview on change
  useEffect(() => {
    const fetchPreview = async () => {
      try {
        const res = await priorityService.calculatePreview({
          severity,
          age: patientAge,
          hasChronicCondition: hasChronic,
          isEmergency
        });
        setSimulatedPriority(res.data.result);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPreview();
  }, [severity, patientAge, hasChronic, isEmergency]);

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (!selectedDoctor) {
      setError('Please select a doctor');
      return;
    }
    if (!selectedSlot) {
      setError('Please select an available time slot');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const payload = {
        doctorId: selectedDoctor._id,
        appointmentDate: selectedDate,
        slotTime: selectedSlot,
        symptoms,
        severity,
        hasChronicCondition: hasChronic,
        isEmergency,
        patientAge: Number(patientAge),
        patientName: user?.name,
        patientPhone: user?.phone
      };

      const res = await appointmentService.book(payload);
      setBookingSuccess(res.data.appointment);

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const departments = ['Cardiology', 'Orthopedics', 'Neurology', 'General Medicine', 'Pediatrics'];

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-900 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 text-xs px-3 py-1 rounded-full border border-sky-400/30 font-semibold">
          <CalendarPlus className="w-3.5 h-3.5" />
          <span>Outpatient Department Scheduling</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Schedule Consultation Slot</h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Intelligent Clinical Urgency Sorting • Concurrency Protected Slots • Real-Time Queue Position
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-4 rounded-2xl flex items-center gap-2 shadow-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Booking Form */}
      <form onSubmit={handleSubmitBooking} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Column 1 & 2: Doctor & Slot Selection */}
        <div className="md:col-span-2 space-y-6">
          {/* Department Filter */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Choose Clinical Specialty
            </label>
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <button
                  key={dept}
                  type="button"
                  onClick={() => setSelectedDepartment(dept)}
                  className={`py-2 px-3.5 rounded-xl text-xs font-bold transition ${
                    selectedDepartment === dept
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {dept}
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Cards */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Select Specialist Doctor
            </label>
            <div className="space-y-3">
              {doctors.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => setSelectedDoctor(doc)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                    selectedDoctor?._id === doc._id
                      ? 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
                      {doc.name.charAt(4) || 'D'}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{doc.name}</h4>
                      <span className="text-xs text-sky-700 font-medium">{doc.doctorProfile?.specialization || doc.doctorProfile?.department}</span>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {doc.doctorProfile?.experienceYears || '10'}+ Yrs Exp • Room: {doc.doctorProfile?.roomNumber || 'OPD-101'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block">₹{doc.doctorProfile?.consultationFee || 500}</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                      {doc.doctorProfile?.availabilityStatus || 'Available'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date & Slot Picker */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                3. Select Consultation Date & Slot
              </label>
              <input
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
              />
            </div>

            {loadingSlots ? (
              <div className="text-center p-6 text-xs text-slate-400">Checking slot availability...</div>
            ) : availableSlots.length === 0 ? (
              <div className="text-center p-6 text-xs text-slate-400">No slots configured for this date.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {availableSlots.map((slot) => (
                  <button
                    key={slot.slotTime}
                    type="button"
                    disabled={!slot.isAvailable}
                    onClick={() => setSelectedSlot(slot.slotTime)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition text-center ${
                      selectedSlot === slot.slotTime
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm font-bold'
                        : slot.isAvailable
                        ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-300'
                        : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div>{slot.slotTime}</div>
                    <div className="text-[9px] mt-0.5">
                      {slot.isAvailable ? (
                        <span className="text-emerald-600 font-bold">Open</span>
                      ) : (
                        <span className="text-red-500 font-medium">Booked</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Clinical Triage & Urgency Assessment */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 sticky top-20">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Clinical Triage Engine</h3>
                <span className="text-[10px] text-slate-500 font-mono">Real-time Priority Triage</span>
              </div>
              <PriorityBadge
                level={simulatedPriority.priorityLevel}
                score={simulatedPriority.priorityScore}
                isEmergency={isEmergency}
                size="sm"
              />
            </div>

            {/* Symptoms Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Chief Symptoms</label>
              <textarea
                rows={2}
                required
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="e.g. Chest pain with radiation, palpitations, high fever..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            {/* Severity Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Perceived Severity</label>
              <div className="grid grid-cols-3 gap-1.5">
                {['Mild', 'Moderate', 'Severe'].map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                      severity === sev
                        ? 'bg-slate-800 text-white border-slate-800'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Age Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Patient Age</label>
              <input
                type="number"
                min={1}
                max={110}
                value={patientAge}
                onChange={(e) => setPatientAge(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
              />
            </div>

            {/* Chronic Condition Toggle */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs font-bold text-slate-700 block">Chronic Conditions</span>
                <span className="text-[10px] text-slate-400">Diabetes, Cardiac, Asthma</span>
              </div>
              <input
                type="checkbox"
                checked={hasChronic}
                onChange={(e) => setHasChronic(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 cursor-pointer"
              />
            </div>

            {/* Emergency Override Flag */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div>
                <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Emergency Acute
                </span>
                <span className="text-[10px] text-slate-400">Overrides queue position</span>
              </div>
              <input
                type="checkbox"
                checked={isEmergency}
                onChange={(e) => setIsEmergency(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 cursor-pointer"
              />
            </div>

            {/* Triage Calculation Preview Box */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-slate-600 font-mono text-[11px]">
              <div>Formula: (Sev*5) + (Age*2) + (Chr*3)</div>
              <div className="text-sky-700 font-bold">
                Computed Score: {simulatedPriority.priorityScore} ({simulatedPriority.priorityLevel} Tier)
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedSlot}
              className="w-full bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>{submitting ? 'Confirming Slot...' : 'Confirm Appointment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      {bookingSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 border border-slate-200 text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Appointment Confirmed!</h3>
              <p className="text-xs text-slate-500">Your outpatient consultation has been scheduled successfully</p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Doctor:</span>
                <strong className="text-slate-800">{bookingSuccess.doctorName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department:</span>
                <strong>{bookingSuccess.department}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date & Slot:</span>
                <strong className="text-sky-700">{bookingSuccess.appointmentDate} at {bookingSuccess.slotTime}</strong>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500">Queue Position:</span>
                <span className="font-mono font-bold text-base text-slate-900 bg-sky-100 px-2 py-0.5 rounded">
                  #{bookingSuccess.queuePosition || 1}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Estimated Wait:</span>
                <strong className="text-emerald-700">~{bookingSuccess.estimatedWaitMinutes || 0} mins</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onNavigate('/queue-tracker')}
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs shadow transition"
              >
                Track Live Queue
              </button>
              <button
                onClick={() => onNavigate('/patient-dashboard')}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-xs transition"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
