import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { appointmentService, labService, bloodService, feedbackService } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import { ReportViewerModal } from '../components/ReportViewerModal';
import {
  CalendarPlus,
  Clock,
  FlaskConical,
  Heart,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Stethoscope,
  XCircle,
  RefreshCw,
  PhoneCall,
  Activity,
  MessageSquare,
  Star,
  Send,
  ShieldCheck,
  Pill,
  Check,
  ThumbsUp,
  Sparkles,
  X
} from 'lucide-react';

export const PatientDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { latestQueueUpdate } = useSocket();

  const [appointments, setAppointments] = useState([]);
  const [labBookings, setLabBookings] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState(null);
  const [myFeedbacks, setMyFeedbacks] = useState([]);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    category: 'OPD Consultation',
    doctorOrDepartment: 'Cardiology',
    consultationQuestions: {
      doctorExplanation: 'Excellent',
      waitTimeSatisfaction: 'Prompt / On Time',
      staffCourteousness: 'Very Polite',
      cleanlinessRating: 'Spotless',
      wouldRecommend: 'Definitely Yes'
    },
    comments: ''
  });
  const [activePatientTab, setActivePatientTab] = useState('overview'); // 'overview' | 'medical_history' | 'feedback'
  const [loading, setLoading] = useState(true);
  const [selectedReportBooking, setSelectedReportBooking] = useState(null);

  // Cancellation Modal State
  const [cancelModalAppt, setCancelModalAppt] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('Personal schedule conflict');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [cancellingLoading, setCancellingLoading] = useState(false);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      const [apptRes, labRes, bloodRes, medHistRes, feedbackRes] = await Promise.all([
        appointmentService.getMy(),
        labService.getBookings(),
        bloodService.getRequests(),
        appointmentService.getMyMedicalHistory().catch(() => ({ data: null })),
        feedbackService.getMy().catch(() => ({ data: { feedbacks: [] } }))
      ]);
      setAppointments(apptRes.data.appointments || []);
      setLabBookings(labRes.data.bookings || []);
      if (medHistRes && medHistRes.data) {
        setMedicalHistory(medHistRes.data);
      }
      if (feedbackRes && feedbackRes.data) {
        setMyFeedbacks(feedbackRes.data.feedbacks || []);
      }
      // Filter blood requests made by or for this patient
      const myBloodReqs = (bloodRes.data.requests || []).filter(
        r => r.requester === user?.id || r.requester === user?._id || r.patientName?.toLowerCase().includes(user?.name?.toLowerCase() || '')
      );
      setBloodRequests(myBloodReqs);
    } catch (err) {
      console.error('Error fetching patient data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [user, latestQueueUpdate]);

  const handleConfirmCancel = async () => {
    if (!cancelModalAppt) return;
    const finalReason = cancellationReason === 'Other'
      ? (customCancelReason.trim() || 'Patient requested cancellation')
      : cancellationReason;
    try {
      setCancellingLoading(true);
      await appointmentService.cancel(cancelModalAppt._id, { cancellationReason: finalReason });
      setCancelModalAppt(null);
      setCustomCancelReason('');
      fetchPatientData();
      alert('Your appointment has been cancelled and your queue slot released successfully.');
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    } finally {
      setCancellingLoading(false);
    }
  };

  const handleSendFeedback = async (e) => {
    e.preventDefault();
    if (!feedbackForm.comments.trim()) {
      alert('Please enter your feedback comments.');
      return;
    }
    try {
      setSubmittingFeedback(true);
      await feedbackService.create(feedbackForm);
      setFeedbackSuccess(true);
      setFeedbackForm({
        rating: 5,
        category: 'OPD Consultation',
        doctorOrDepartment: 'Cardiology',
        consultationQuestions: {
          doctorExplanation: 'Excellent',
          waitTimeSatisfaction: 'Prompt / On Time',
          staffCourteousness: 'Very Polite',
          cleanlinessRating: 'Spotless',
          wouldRecommend: 'Definitely Yes'
        },
        comments: ''
      });
      fetchPatientData();
      setTimeout(() => setFeedbackSuccess(false), 5000);
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Find active appointment for today / current queue
  const today = new Date().toISOString().split('T')[0];
  const activeTodayAppt = appointments.find(
    a => a.status === 'Confirmed' || a.status === 'In Progress'
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Patient Profile Card */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-2xl font-black text-sky-300">
            {user?.name?.charAt(0) || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">{user?.name || 'Patient'}</h1>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                Active Patient
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Age: <strong>{user?.age || '30'} Yrs</strong> | Blood Group: <strong className="text-rose-400">{user?.bloodGroup || 'O+'}</strong> | City: <strong>{user?.city || 'Chennai'}</strong>
            </p>
            {user?.hasChronicCondition && (
              <div className="flex items-center gap-1.5 text-xs text-amber-300 mt-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Chronic Profile: {user.chronicDiseases?.join(', ') || 'Diabetes / Hypertension'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActivePatientTab('overview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activePatientTab === 'overview' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> Overview
            </button>
            <button
              onClick={() => setActivePatientTab('medical_history')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activePatientTab === 'medical_history' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" /> Medical History
            </button>
            <button
              onClick={() => setActivePatientTab('feedback')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activePatientTab === 'feedback' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Feedback
            </button>
          </div>

          <button
            onClick={() => onNavigate('/book-appointment')}
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-md transition"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Book OPD</span>
          </button>
          <button
            onClick={() => onNavigate('/lab-tests')}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold px-3.5 py-2 rounded-xl text-xs transition"
          >
            <FlaskConical className="w-4 h-4 text-emerald-400" />
            <span>Book Lab</span>
          </button>
        </div>
      </div>

      {activePatientTab === 'overview' && (
        <>
          {/* Live Active Queue Tracker Widget */}
          {activeTodayAppt ? (
            <div className="bg-gradient-to-br from-white to-sky-50/50 rounded-3xl p-6 sm:p-8 border-2 border-sky-200 shadow-lg space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                  <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                    Active Outpatient Queue Status (Live)
                  </h2>
                </div>
                <PriorityBadge
                  level={activeTodayAppt.priorityLevel}
                  score={activeTodayAppt.priorityScore}
                  isEmergency={activeTodayAppt.isEmergency}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Queue Counter Box */}
                <div className="bg-slate-900 text-white rounded-2xl p-6 text-center space-y-2 shadow-inner">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Your Queue Position</span>
                  <div className="text-5xl font-black text-sky-400 font-mono">
                    #{activeTodayAppt.queuePosition || 1}
                  </div>
                  <div className="text-xs text-slate-400">
                    {activeTodayAppt.status === 'In Progress' ? (
                      <span className="text-emerald-400 font-bold animate-pulse">Now in Consultation Room</span>
                    ) : (
                      <span>Scheduled Consultation</span>
                    )}
                  </div>
                </div>

                {/* Estimated Waiting Time */}
                <div className="bg-sky-100/70 border border-sky-200 rounded-2xl p-6 text-center space-y-2">
                  <span className="text-xs uppercase tracking-wider text-sky-800 font-bold">Estimated Waiting Time</span>
                  <div className="text-4xl font-extrabold text-sky-900 flex items-center justify-center gap-2">
                    <Clock className="w-7 h-7 text-sky-600 animate-spin" style={{ animationDuration: '6s' }} />
                    <span>~{activeTodayAppt.estimatedWaitMinutes || 15}m</span>
                  </div>
                  <span className="text-xs text-slate-500 block">Dynamic clinical triage queue</span>
                </div>

                {/* Doctor Assigned */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{activeTodayAppt.doctorName}</h4>
                      <span className="text-xs text-slate-500">{activeTodayAppt.department}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-600 border-t border-slate-200 pt-2 flex justify-between">
                    <span>Slot Time:</span>
                    <strong className="text-slate-900">{activeTodayAppt.slotTime}</strong>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 text-center border border-slate-200 shadow-xs space-y-3">
              <Clock className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 text-sm">No Active Consultations Today</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                You don't have an ongoing doctor queue for today. Book an outpatient appointment anytime.
              </p>
              <button
                onClick={() => onNavigate('/book-appointment')}
                className="inline-flex items-center gap-2 bg-sky-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-xs hover:bg-sky-500 transition"
              >
                <CalendarPlus className="w-4 h-4" />
                <span>Schedule Appointment</span>
              </button>
            </div>
          )}

          {/* Outpatient Appointments List */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-base">Outpatient Appointment History</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">{appointments.length} Total Bookings</span>
            </div>

            {appointments.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No appointments recorded yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Doctor & Dept</th>
                      <th className="p-3">Date & Slot</th>
                      <th className="p-3">Clinical Priority</th>
                      <th className="p-3">Queue #</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {appointments.map((appt) => (
                      <tr key={appt._id} className="hover:bg-slate-50">
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{appt.doctorName}</div>
                          <div className="text-[11px] text-slate-500">{appt.department}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-800">{appt.appointmentDate}</div>
                          <div className="text-[11px] text-slate-500">{appt.slotTime}</div>
                        </td>
                        <td className="p-3">
                          <PriorityBadge level={appt.priorityLevel} score={appt.priorityScore} isEmergency={appt.isEmergency} size="sm" />
                        </td>
                        <td className="p-3 font-mono font-bold text-sky-700">
                          #{appt.queuePosition || 1}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full font-semibold text-[10px] ${
                            appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                            appt.status === 'In Progress' ? 'bg-blue-100 text-blue-800 font-bold' :
                            appt.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-sky-100 text-sky-800'
                          }`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {appt.status === 'Confirmed' && (
                            <button
                              onClick={() => {
                                setCancelModalAppt(appt);
                                setCancellationReason('Personal schedule conflict');
                                setCustomCancelReason('');
                              }}
                              className="text-red-600 hover:text-red-800 font-semibold text-xs ml-2 hover:underline"
                            >
                              Cancel
                            </button>
                          )}
                          {appt.prescriptions?.length > 0 && (
                            <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded text-[10px] font-bold border border-emerald-200">
                              Prescription Ready
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Lab Test Bookings & Reports */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Diagnostic Lab Test Bookings</h3>
              </div>
              <button
                onClick={() => onNavigate('/lab-tests')}
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                + Book New Test
              </button>
            </div>

            {labBookings.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No lab tests booked yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {labBookings.map((b) => (
                  <div key={b._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{b.testName}</h4>
                        <span className="text-[11px] text-slate-500">Slot: {b.bookingDate} at {b.slotTime}</span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        b.status === 'Report Ready' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        'bg-sky-100 text-sky-800'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex justify-between">
                      <span>Mode: <strong>{b.isHomeSampleCollection ? 'Home Sample Collection' : 'In-Lab'}</strong></span>
                      <span>Amount: <strong>₹{b.totalAmount}</strong></span>
                    </div>

                    {b.reportData ? (
                      <button
                        onClick={() => setSelectedReportBooking(b)}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
                      >
                        <FileText className="w-4 h-4" />
                        <span>View & Download Report</span>
                      </button>
                    ) : (
                      <div className="text-[11px] text-slate-400 bg-white p-2 rounded-lg border border-slate-200 text-center">
                        Sample in processing • Report expected shortly
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Tab 2: Medical History Visibility to That Particular Individual */}
      {activePatientTab === 'medical_history' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-lg">My Personal Medical History Record</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Comprehensive electronic health record visible strictly to you (Past consultations, clinical diagnoses, prescriptions, and diagnostics)
                </p>
              </div>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1 rounded-full border border-emerald-200">
                Confidential Personal EHR
              </span>
            </div>

            {/* Health Metrics & Chronic Vitals Card */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200">
                <span className="text-[11px] font-bold text-sky-800 uppercase block">Total Consultations</span>
                <span className="text-2xl font-black text-sky-950 mt-1 block">
                  {medicalHistory?.summary?.totalAppointments || appointments.length}
                </span>
                <span className="text-[10px] text-sky-600">{medicalHistory?.summary?.completedConsultations || 0} completed</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-[11px] font-bold text-emerald-800 uppercase block">Active Prescriptions</span>
                <span className="text-2xl font-black text-emerald-950 mt-1 block">
                  {medicalHistory?.summary?.totalPrescriptions || 0}
                </span>
                <span className="text-[10px] text-emerald-600">Issued by consultants</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                <span className="text-[11px] font-bold text-purple-800 uppercase block">Diagnostic Tests</span>
                <span className="text-2xl font-black text-purple-950 mt-1 block">
                  {medicalHistory?.summary?.totalLabTests || labBookings.length}
                </span>
                <span className="text-[10px] text-purple-600">Lab investigations</span>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
                <span className="text-[11px] font-bold text-rose-800 uppercase block">Blood Group Profile</span>
                <span className="text-2xl font-black text-rose-900 mt-1 block">
                  {user?.bloodGroup || 'O+'}
                </span>
                <span className="text-[10px] text-rose-600">
                  {medicalHistory?.summary?.isRegisteredDonor ? 'Registered Donor' : 'Standard Patient'}
                </span>
              </div>
            </div>

            {/* Chronic Conditions & Allergies Note */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Recorded Chronic Profile & Patient Vitals:</span>
              </div>
              <p className="text-amber-800">
                {user?.hasChronicCondition
                  ? `Active chronic condition(s): ${user.chronicDiseases?.join(', ') || 'Hypertension / Diabetes'}.`
                  : 'No chronic conditions reported on file.'}
              </p>
            </div>

            {/* Past Consultations, Clinical Notes & Prescriptions */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-sky-600" />
                <span>Doctor Consultation Records & Clinical Notes</span>
              </h4>

              {appointments.filter(a => a.status === 'Completed' || a.clinicalNotes || a.prescriptions?.length).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                  No completed doctor consultation notes recorded in your EHR yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {appointments
                    .filter(a => a.status === 'Completed' || a.clinicalNotes || a.prescriptions?.length)
                    .map((a) => (
                      <div key={a._id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-slate-900 text-sm">{a.doctorName}</h5>
                              <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded">
                                {a.department}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              Consultation Date: {a.appointmentDate} at {a.slotTime}
                            </span>
                          </div>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Completed Consultation
                          </span>
                        </div>

                        {a.symptoms && (
                          <div className="text-xs text-slate-600">
                            <strong>Reported Symptoms:</strong> {a.symptoms} ({a.severity || 'Mild'} severity)
                          </div>
                        )}

                        {a.clinicalNotes && (
                          <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                            <strong className="text-slate-900 block mb-1">Doctor's Clinical Diagnosis & Advice:</strong>
                            <p>{a.clinicalNotes}</p>
                          </div>
                        )}

                        {a.prescriptions && a.prescriptions.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                              <Pill className="w-3.5 h-3.5" /> Prescribed Medications:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {a.prescriptions.map((p, idx) => (
                                <div key={idx} className="bg-emerald-50/70 border border-emerald-200 p-2.5 rounded-xl text-xs">
                                  <div className="font-bold text-emerald-950">{p.medicine}</div>
                                  <div className="text-[11px] text-emerald-800 mt-0.5">
                                    Dosage: {p.dosage} • Frequency: {p.frequency} ({p.duration})
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {a.recommendedLabTests && a.recommendedLabTests.length > 0 && (
                          <div className="text-xs text-slate-600 flex items-center gap-1.5">
                            <FlaskConical className="w-3.5 h-3.5 text-purple-600" />
                            <span>Recommended Investigations: <strong>{a.recommendedLabTests.join(', ')}</strong></span>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Past Diagnostic Lab Investigations */}
            <div className="space-y-4 pt-2">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                <span>Diagnostic Lab Investigation Reports</span>
              </h4>

              {labBookings.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                  No diagnostic laboratory investigations booked yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {labBookings.map((b) => (
                    <div key={b._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex justify-between items-center">
                      <div>
                        <h5 className="font-bold text-slate-900">{b.testName}</h5>
                        <span className="text-[11px] text-slate-500">{b.bookingDate} • {b.status}</span>
                      </div>
                      {b.reportData ? (
                        <button
                          onClick={() => setSelectedReportBooking(b)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> View
                        </button>
                      ) : (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded">Processing</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Provide Patient Feedback & View Responses */}
      {activePatientTab === 'feedback' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto">
            <div className="border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-lg">Hospital Feedback & Experience Rating</h3>
              </div>
              <p className="text-xs text-slate-500">
                Share your clinical or hospital care experience. Your feedback directly reaches hospital administration.
              </p>
            </div>

            {feedbackSuccess && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Thank you! Your feedback has been sent to MEDCARE Hospital Administration.</span>
              </div>
            )}

            <form onSubmit={handleSendFeedback} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Rating (1 to 5 Stars) *</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= feedbackForm.rating
                            ? 'text-amber-400 fill-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="font-bold text-sm text-amber-900 ml-2">
                    {feedbackForm.rating} / 5 Stars
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Service Category</label>
                  <select
                    value={feedbackForm.category}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="OPD Consultation">OPD Doctor Consultation</option>
                    <option value="Blood Bank Service">Blood Bank & Donation</option>
                    <option value="Diagnostic Lab Tests">Diagnostic Lab Tests</option>
                    <option value="Staff & Nursing">Nursing & Reception Staff</option>
                    <option value="Overall Hospital Facility">Overall Hospital Facility</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Department / Doctor (Optional)</label>
                  <input
                    type="text"
                    value={feedbackForm.doctorOrDepartment}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, doctorOrDepartment: e.target.value })}
                    placeholder="e.g. Cardiology, Dr. Priya"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Consultation-Specific Survey Questions */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center gap-2 border-b border-sky-200 pb-2">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span className="font-bold text-sky-950 text-xs uppercase tracking-wide">
                    Consultation & Care Quality Survey
                  </span>
                </div>

                {/* Q1: Doctor Explanation */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">1. How clearly did the doctor explain your diagnosis & treatment plan?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {['Excellent', 'Good', 'Average', 'Needs Improvement'].map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setFeedbackForm({
                          ...feedbackForm,
                          consultationQuestions: { ...feedbackForm.consultationQuestions, doctorExplanation: opt }
                        })}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition ${
                          feedbackForm.consultationQuestions?.doctorExplanation === opt
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q2: Wait Time Satisfaction */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">2. Outpatient Consultation Waiting Time:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    {['Prompt / On Time', 'Acceptable (<20 min)', 'Long Wait (>30 min)'].map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setFeedbackForm({
                          ...feedbackForm,
                          consultationQuestions: { ...feedbackForm.consultationQuestions, waitTimeSatisfaction: opt }
                        })}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition ${
                          feedbackForm.consultationQuestions?.waitTimeSatisfaction === opt
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q3: Staff Courteousness */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">3. Nursing & Front Desk Staff Courteousness:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {['Very Polite', 'Helpful', 'Indifferent', 'Unhelpful'].map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setFeedbackForm({
                          ...feedbackForm,
                          consultationQuestions: { ...feedbackForm.consultationQuestions, staffCourteousness: opt }
                        })}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition ${
                          feedbackForm.consultationQuestions?.staffCourteousness === opt
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q4: Clinic Hygiene & Cleanliness */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">4. Hospital Hygiene & Sanitation Cleanliness:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {['Spotless', 'Clean & Hygienic', 'Average', 'Poor'].map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setFeedbackForm({
                          ...feedbackForm,
                          consultationQuestions: { ...feedbackForm.consultationQuestions, cleanlinessRating: opt }
                        })}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition ${
                          feedbackForm.consultationQuestions?.cleanlinessRating === opt
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q5: Recommend to Others */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">5. Would you recommend MEDCARE to friends & family?</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {['Definitely Yes', 'Probably', 'Not Sure', 'No'].map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setFeedbackForm({
                          ...feedbackForm,
                          consultationQuestions: { ...feedbackForm.consultationQuestions, wouldRecommend: opt }
                        })}
                        className={`p-2 rounded-xl text-[11px] font-bold border transition ${
                          feedbackForm.consultationQuestions?.wouldRecommend === opt
                            ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Detailed Feedback & Comments *</label>
                <textarea
                  rows={4}
                  required
                  value={feedbackForm.comments}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, comments: e.target.value })}
                  placeholder="Describe your consultation experience, staff helpfulness, or areas of improvement..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={submittingFeedback}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
              >
                <Send className="w-4 h-4" />
                <span>{submittingFeedback ? 'Submitting...' : 'Submit Patient Feedback'}</span>
              </button>
            </form>

            {/* Previous Feedback Given by this Patient */}
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-slate-800 text-sm">Your Previous Submissions ({myFeedbacks.length})</h4>
              {myFeedbacks.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-4">No past feedback submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {myFeedbacks.map((fb) => (
                    <div key={fb._id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-slate-800">{fb.category}</span>
                          <span className="text-slate-400 text-[10px] block">{new Date(fb.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(fb.rating)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />
                          ))}
                        </div>
                      </div>

                      {/* Consultation Survey Badges if present */}
                      {fb.consultationQuestions && (
                        <div className="flex flex-wrap gap-1.5 py-1">
                          {fb.consultationQuestions.doctorExplanation && (
                            <span className="bg-sky-100 text-sky-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                              Doctor: {fb.consultationQuestions.doctorExplanation}
                            </span>
                          )}
                          {fb.consultationQuestions.waitTimeSatisfaction && (
                            <span className="bg-blue-100 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                              Wait: {fb.consultationQuestions.waitTimeSatisfaction}
                            </span>
                          )}
                          {fb.consultationQuestions.staffCourteousness && (
                            <span className="bg-purple-100 text-purple-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                              Staff: {fb.consultationQuestions.staffCourteousness}
                            </span>
                          )}
                          {fb.consultationQuestions.cleanlinessRating && (
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                              Hygiene: {fb.consultationQuestions.cleanlinessRating}
                            </span>
                          )}
                          {fb.consultationQuestions.wouldRecommend && (
                            <span className="bg-rose-100 text-rose-800 text-[10px] font-semibold px-2 py-0.5 rounded">
                              Recommend: {fb.consultationQuestions.wouldRecommend}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-slate-700 italic">"{fb.comments}"</p>
                      {fb.adminReply ? (
                        <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-purple-900">
                          <strong>Admin Reply: </strong> {fb.adminReply}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 block italic">Under review by Hospital Admin</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lab Report Viewer Modal */}
      <ReportViewerModal
        isOpen={Boolean(selectedReportBooking)}
        onClose={() => setSelectedReportBooking(null)}
        booking={selectedReportBooking}
      />

      {/* Appointment Cancellation Reason Modal */}
      {cancelModalAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-2 border-red-200 space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-red-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <XCircle className="w-5 h-5" />
                <span>Cancel Outpatient Appointment</span>
              </div>
              <button
                onClick={() => setCancelModalAppt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800 text-sm">{cancelModalAppt.doctorName}</div>
              <div className="text-slate-500">{cancelModalAppt.department} • OPD Room: {cancelModalAppt.roomNumber || 'OPD-101'}</div>
              <div className="text-slate-700 font-medium">
                Slot: <strong>{cancelModalAppt.appointmentDate}</strong> at <strong>{cancelModalAppt.slotTime}</strong> (Queue #{cancelModalAppt.queuePosition})
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">Please select a reason for cancellation *</label>
              <div className="space-y-1.5">
                {[
                  'Personal schedule conflict / work emergency',
                  'Feeling better / symptoms subsided',
                  'Doctor requested rescheduling',
                  'Need to consult a different specialist',
                  'Other'
                ].map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer transition ${
                      cancellationReason === reason
                        ? 'bg-red-50/80 border-red-300 text-red-900 font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cancelReason"
                      value={reason}
                      checked={cancellationReason === reason}
                      onChange={(e) => setCancellationReason(e.target.value)}
                      className="text-red-600 focus:ring-red-500"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {cancellationReason === 'Other' && (
                <div className="pt-1">
                  <textarea
                    rows={2}
                    value={customCancelReason}
                    onChange={(e) => setCustomCancelReason(e.target.value)}
                    placeholder="Specify reason for cancelling..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Note: Cancelling will release your reserved queue slot immediately for other waiting patients.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelModalAppt(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                disabled={cancellingLoading}
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-md transition flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>{cancellingLoading ? 'Cancelling...' : 'Confirm Cancellation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
