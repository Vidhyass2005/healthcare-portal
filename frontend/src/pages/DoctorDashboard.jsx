import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { doctorService, appointmentService, priorityService, authService } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  Stethoscope,
  Users,
  Clock,
  Flame,
  CheckCircle,
  AlertTriangle,
  FileText,
  Heart,
  Plus,
  Play,
  Check,
  Send,
  X,
  History,
  Activity,
  Droplet,
  Calendar,
  CalendarX,
  Share2,
  ShieldAlert,
  Thermometer,
  ArrowRightLeft,
  Scale,
  Sparkles
} from 'lucide-react';

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { latestQueueUpdate } = useSocket();

  const [metrics, setMetrics] = useState({
    totalToday: 0,
    completedCount: 0,
    highPriorityCount: 0,
    pendingCount: 0,
    currentInConsultation: null,
    availabilityStatus: 'Available'
  });
  const [todayQueue, setTodayQueue] = useState([]);
  const [referredQueue, setReferredQueue] = useState([]);
  const [activeQueueTab, setActiveQueueTab] = useState('opd'); // 'opd' | 'referrals'
  const [loading, setLoading] = useState(true);

  // Prescription / Clinical notes modal
  const [activeConsultationAppt, setActiveConsultationAppt] = useState(null);
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [prescriptions, setPrescriptions] = useState([
    { medicine: '', dosage: '', frequency: 'Twice daily', duration: '5 days' }
  ]);
  const [recommendedLabTests, setRecommendedLabTests] = useState('');

  // Vitals Charting State (Live BMI auto-calculation)
  const [vitalsForm, setVitalsForm] = useState({
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    pulseHeartRate: '',
    oxygenSaturation: '',
    temperature: '',
    heightCm: '',
    weightKg: '',
    bloodSugarMgDl: ''
  });

  // Patient Allergies & Critical Medical Alerts
  const [patientAllergies, setPatientAllergies] = useState([]);
  const [patientMedicalAlerts, setPatientMedicalAlerts] = useState([]);
  const [newAllergyInput, setNewAllergyInput] = useState('');
  const [newAlertInput, setNewAlertInput] = useState('');
  const [savingAlerts, setSavingAlerts] = useState(false);

  // Cross-Department Referral Modal State
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralTargetAppt, setReferralTargetAppt] = useState(null);
  const [referralForm, setReferralForm] = useState({
    referredToDepartment: 'Cardiology',
    referredToDoctorId: '',
    referralUrgency: 'Routine',
    referralReason: ''
  });
  const [deptDoctors, setDeptDoctors] = useState([]);
  const [loadingDeptDoctors, setLoadingDeptDoctors] = useState(false);
  const [submittingReferral, setSubmittingReferral] = useState(false);

  // Emergency blood broadcast modal
  const [showBloodModal, setShowBloodModal] = useState(false);
  const [bloodGroupReq, setBloodGroupReq] = useState('O-');
  const [bloodUnitsReq, setBloodUnitsReq] = useState(2);
  const [bloodReasonReq, setBloodReasonReq] = useState('Acute clinical emergency');

  // Patient history drawer
  const [patientHistoryData, setPatientHistoryData] = useState(null);

  // Doctor Leave & Reschedule modal
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveReason: 'Clinical Conference & Emergency Medical Leave',
    autoRescheduleDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Computed Live BMI
  const computeBmi = () => {
    const h = parseFloat(vitalsForm.heightCm);
    const w = parseFloat(vitalsForm.weightKg);
    if (!h || !w || h <= 0 || w <= 0) return { bmi: null, category: null };
    const heightM = h / 100;
    const val = Number((w / (heightM * heightM)).toFixed(1));
    let cat = 'Normal (18.5 - 24.9)';
    let color = 'text-emerald-700 bg-emerald-100 border-emerald-300';
    if (val < 18.5) {
      cat = 'Underweight (<18.5)';
      color = 'text-amber-700 bg-amber-100 border-amber-300';
    } else if (val <= 24.9) {
      cat = 'Normal (18.5 - 24.9)';
      color = 'text-emerald-700 bg-emerald-100 border-emerald-300';
    } else if (val <= 29.9) {
      cat = 'Overweight (25.0 - 29.9)';
      color = 'text-amber-700 bg-amber-100 border-amber-300';
    } else {
      cat = 'Obese (≥30.0)';
      color = 'text-rose-700 bg-rose-100 border-rose-300';
    }
    return { bmi: val, category: cat, color };
  };
  const liveBmi = computeBmi();

  const fetchDoctorData = async () => {
    try {
      setLoading(true);
      const res = await doctorService.getDashboard();
      setMetrics(res.data.metrics || {});
      setTodayQueue(res.data.todayQueue || []);
      setReferredQueue(res.data.referredQueue || []);
    } catch (err) {
      console.error('Error fetching doctor dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [user, latestQueueUpdate]);

  const handleUpdateAvailability = async (status) => {
    if (status === 'On Leave') {
      setShowLeaveModal(true);
      return;
    }
    try {
      await doctorService.updateAvailability(status);
      setMetrics(prev => ({ ...prev, availabilityStatus: status }));
      fetchDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating status');
    }
  };

  const handleConfirmLeave = async (e) => {
    e.preventDefault();
    try {
      setSubmittingLeave(true);
      const res = await doctorService.updateAvailability({
        availabilityStatus: 'On Leave',
        leaveReason: leaveForm.leaveReason,
        autoRescheduleDate: leaveForm.autoRescheduleDate
      });
      setShowLeaveModal(false);
      setMetrics(prev => ({ ...prev, availabilityStatus: 'On Leave' }));
      alert(res.data?.message || 'Doctor status set to On Leave. Active appointments rescheduled and patients notified.');
      fetchDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating leave status');
    } finally {
      setSubmittingLeave(false);
    }
  };

  const handleStartConsultation = async (appt) => {
    try {
      await appointmentService.updateStatus(appt._id, { status: 'In Progress' });
      fetchDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error starting consultation');
    }
  };

  const handleEmergencyOverride = async (apptId) => {
    const reason = prompt('Specify reason for emergency triage boost:');
    if (!reason) return;
    try {
      await priorityService.emergencyOverride(apptId, { emergencyReason: reason });
      fetchDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error applying emergency override');
    }
  };

  const handleOpenConsultationModal = (appt) => {
    setActiveConsultationAppt(appt);
    setClinicalNotes(appt.clinicalNotes || '');
    setPrescriptions(appt.prescriptions?.length ? appt.prescriptions : [{ medicine: '', dosage: '', frequency: 'Twice daily', duration: '5 days' }]);
    setRecommendedLabTests(appt.recommendedLabTests?.join(', ') || '');
    
    // Initialize vitals from appt or patient profile
    const existingVitals = appt.vitals || appt.patient?.latestVitals || {};
    setVitalsForm({
      bloodPressureSystolic: existingVitals.bloodPressureSystolic || '',
      bloodPressureDiastolic: existingVitals.bloodPressureDiastolic || '',
      pulseHeartRate: existingVitals.pulseHeartRate || '',
      oxygenSaturation: existingVitals.oxygenSaturation || '',
      temperature: existingVitals.temperature || '',
      heightCm: existingVitals.heightCm || '',
      weightKg: existingVitals.weightKg || '',
      bloodSugarMgDl: existingVitals.bloodSugarMgDl || ''
    });

    // Initialize allergies and alerts
    setPatientAllergies(appt.allergies?.length ? appt.allergies : (appt.patient?.allergies || []));
    setPatientMedicalAlerts(appt.medicalAlerts?.length ? appt.medicalAlerts : (appt.patient?.medicalAlerts || []));
    setNewAllergyInput('');
    setNewAlertInput('');
  };

  const handleAddAllergy = (allergy) => {
    const val = allergy.trim();
    if (val && !patientAllergies.includes(val)) {
      setPatientAllergies([...patientAllergies, val]);
    }
    setNewAllergyInput('');
  };

  const handleRemoveAllergy = (idx) => {
    setPatientAllergies(patientAllergies.filter((_, i) => i !== idx));
  };

  const handleAddAlert = (alertTag) => {
    const val = alertTag.trim();
    if (val && !patientMedicalAlerts.includes(val)) {
      setPatientMedicalAlerts([...patientMedicalAlerts, val]);
    }
    setNewAlertInput('');
  };

  const handleRemoveAlert = (idx) => {
    setPatientMedicalAlerts(patientMedicalAlerts.filter((_, i) => i !== idx));
  };

  const handleSaveAlertsOnly = async () => {
    if (!activeConsultationAppt) return;
    try {
      setSavingAlerts(true);
      const patientId = typeof activeConsultationAppt.patient === 'object'
        ? activeConsultationAppt.patient._id
        : activeConsultationAppt.patient;

      await doctorService.updatePatientAlerts(patientId, {
        allergies: patientAllergies,
        medicalAlerts: patientMedicalAlerts,
        appointmentId: activeConsultationAppt._id
      });
      alert('Patient allergies and medical alerts updated and synced to health record.');
      fetchDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating alerts');
    } finally {
      setSavingAlerts(false);
    }
  };

  const handleCompleteConsultation = async (e) => {
    e.preventDefault();
    if (!activeConsultationAppt) return;
    try {
      const cleanPrescriptions = prescriptions.filter(p => p.medicine.trim() !== '');
      const labTestsArray = recommendedLabTests.split(',').map(s => s.trim()).filter(Boolean);

      // Clean vitals
      const cleanedVitals = {
        bloodPressureSystolic: vitalsForm.bloodPressureSystolic ? Number(vitalsForm.bloodPressureSystolic) : null,
        bloodPressureDiastolic: vitalsForm.bloodPressureDiastolic ? Number(vitalsForm.bloodPressureDiastolic) : null,
        pulseHeartRate: vitalsForm.pulseHeartRate ? Number(vitalsForm.pulseHeartRate) : null,
        oxygenSaturation: vitalsForm.oxygenSaturation ? Number(vitalsForm.oxygenSaturation) : null,
        temperature: vitalsForm.temperature ? Number(vitalsForm.temperature) : null,
        heightCm: vitalsForm.heightCm ? Number(vitalsForm.heightCm) : null,
        weightKg: vitalsForm.weightKg ? Number(vitalsForm.weightKg) : null,
        bloodSugarMgDl: vitalsForm.bloodSugarMgDl ? Number(vitalsForm.bloodSugarMgDl) : null
      };

      await appointmentService.updateStatus(activeConsultationAppt._id, {
        status: 'Completed',
        clinicalNotes,
        prescriptions: cleanPrescriptions,
        recommendedLabTests: labTestsArray,
        vitals: cleanedVitals,
        allergies: patientAllergies,
        medicalAlerts: patientMedicalAlerts
      });

      setActiveConsultationAppt(null);
      fetchDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving consultation');
    }
  };

  // Referral Modal Triggers
  const handleOpenReferralModal = (appt) => {
    setReferralTargetAppt(appt);
    setReferralForm({
      referredToDepartment: 'Cardiology',
      referredToDoctorId: '',
      referralUrgency: 'Routine',
      referralReason: ''
    });
    fetchDepartmentDoctors('Cardiology');
    setShowReferralModal(true);
  };

  const fetchDepartmentDoctors = async (dept) => {
    try {
      setLoadingDeptDoctors(true);
      const res = await authService.getDoctors(dept);
      // Filter out self
      const validDoctors = (res.data.doctors || []).filter(d => d._id !== user?._id);
      setDeptDoctors(validDoctors);
      if (validDoctors.length > 0) {
        setReferralForm(prev => ({ ...prev, referredToDoctorId: validDoctors[0]._id }));
      } else {
        setReferralForm(prev => ({ ...prev, referredToDoctorId: '' }));
      }
    } catch (err) {
      console.error('Error fetching department doctors:', err);
    } finally {
      setLoadingDeptDoctors(false);
    }
  };

  const handleReferralDeptChange = (dept) => {
    setReferralForm(prev => ({ ...prev, referredToDepartment: dept }));
    fetchDepartmentDoctors(dept);
  };

  const handleSubmitReferral = async (e) => {
    e.preventDefault();
    if (!referralTargetAppt || !referralForm.referredToDoctorId) {
      alert('Please select a target specialist doctor.');
      return;
    }
    try {
      setSubmittingReferral(true);
      const res = await doctorService.createReferral({
        appointmentId: referralTargetAppt._id,
        referredToDepartment: referralForm.referredToDepartment,
        referredToDoctorId: referralForm.referredToDoctorId,
        referralUrgency: referralForm.referralUrgency,
        referralReason: referralForm.referralReason
      });
      alert(res.data?.message || 'Referral dispatched successfully to receiving specialist.');
      setShowReferralModal(false);
      setReferralTargetAppt(null);
      fetchDoctorData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating referral');
    } finally {
      setSubmittingReferral(false);
    }
  };

  const handleDispatchEmergencyBlood = async (e) => {
    e.preventDefault();
    try {
      await doctorService.requestEmergencyBlood({
        patientName: activeConsultationAppt ? activeConsultationAppt.patientName : 'OPD Emergency Patient',
        bloodGroup: bloodGroupReq,
        unitsRequired: Number(bloodUnitsReq),
        reason: bloodReasonReq
      });
      setShowBloodModal(false);
      alert(`Critical emergency broadcast sent to all matching ${bloodGroupReq} blood donors & admins!`);
    } catch (err) {
      alert(err.response?.data?.message || 'Blood request failed');
    }
  };

  const handleViewPatientHistory = async (patientId) => {
    try {
      const pId = typeof patientId === 'object' ? patientId._id : patientId;
      const res = await doctorService.getPatientHistory(pId);
      setPatientHistoryData(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Error fetching history');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Doctor Availability Control */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-sky-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">{user?.name || 'Doctor'}</h1>
              <span className="text-xs bg-blue-500/30 text-blue-200 px-2.5 py-0.5 rounded-full border border-blue-400/30 font-semibold">
                {user?.doctorProfile?.department || 'Cardiology'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Room: <strong>{user?.doctorProfile?.roomNumber || 'OPD-102'}</strong> | Experience: <strong>{user?.doctorProfile?.experienceYears || '10'}+ Yrs</strong>
            </p>
          </div>
        </div>

        {/* Doctor Status Picker */}
        <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 flex items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold px-2">Availability:</span>
          {['Available', 'In Consultation', 'On Leave'].map((st) => (
            <button
              key={st}
              onClick={() => handleUpdateAvailability(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                metrics.availabilityStatus === st
                  ? st === 'Available'
                    ? 'bg-emerald-600 text-white shadow ring-2 ring-emerald-400'
                    : st === 'In Consultation'
                    ? 'bg-blue-600 text-white shadow ring-2 ring-blue-400'
                    : 'bg-amber-600 text-white shadow ring-2 ring-amber-400'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* On Leave Alert & Patient Rescheduling Banner */}
      {metrics.availabilityStatus === 'On Leave' && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-3xl p-5 shadow-md flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-black">
              <CalendarX className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-sm flex items-center gap-2">
                <span>Doctor Currently On Leave</span>
                <span className="bg-amber-200 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Bookings Paused
                </span>
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                New appointments are temporarily blocked. Scheduled patients were automatically rescheduled and notified.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleUpdateAvailability('Available')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Resume Practice (Set Available)</span>
          </button>
        </div>
      )}

      {/* Daily Metrics Snapshot */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Today's Queue</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{metrics.totalToday}</div>
          <span className="text-[10px] text-slate-400 font-medium">Scheduled OPD Patients</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-rose-600 text-xs">
            <span className="font-bold">High Priority</span>
            <Flame className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2">{metrics.highPriorityCount}</div>
          <span className="text-[10px] text-rose-500 font-medium">Urgent triage cases</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 text-xs">
            <span className="font-bold">Incoming Referrals</span>
            <ArrowRightLeft className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-700 mt-2">{referredQueue.length}</div>
          <span className="text-[10px] text-indigo-600 font-medium">Specialist referrals</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 text-xs">
            <span className="font-semibold">Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-700 mt-2">{metrics.completedCount}</div>
          <span className="text-[10px] text-emerald-600 font-medium">Consultations finished</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-semibold">Pending Queue</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-slate-900 mt-2">{metrics.pendingCount}</div>
          <span className="text-[10px] text-slate-400 font-medium">In waiting lounge</span>
        </div>
      </div>

      {/* Priority-Sorted Patient Queue Table with OPD vs Referrals Tab */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-sky-600" />
                <span>Patient Queue Management</span>
              </h2>

              {/* Queue Mode Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveQueueTab('opd')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                    activeQueueTab === 'opd'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  OPD Queue ({todayQueue.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveQueueTab('referrals')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                    activeQueueTab === 'referrals'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-indigo-600'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Incoming Referrals ({referredQueue.length})</span>
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-1">
              {activeQueueTab === 'opd'
                ? 'Patients dynamically ranked by clinical urgency (Severity × 5 + Age × 2 + Chronic × 3 + Emergency Override)'
                : 'Cross-department inter-specialist referrals prioritized by clinical urgency level (Immediate STAT, Urgent, Routine)'}
            </p>
          </div>

          <button
            onClick={() => setShowBloodModal(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
          >
            <Flame className="w-4 h-4" />
            <span>Emergency Blood Broadcast</span>
          </button>
        </div>

        {((activeQueueTab === 'opd' ? todayQueue : referredQueue).length === 0) ? (
          <div className="p-8 text-center text-xs text-slate-400">
            {activeQueueTab === 'opd'
              ? 'No OPD patient appointments scheduled for today.'
              : 'No incoming inter-department referrals awaiting evaluation.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Queue #</th>
                  <th className="p-3">Patient Details</th>
                  <th className="p-3">Slot / Urgency</th>
                  <th className="p-3">Clinical Alerts & Allergies</th>
                  <th className="p-3">Clinical Triage</th>
                  <th className="p-3">Symptoms & Referral Note</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Doctor Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(activeQueueTab === 'opd' ? todayQueue : referredQueue).map((appt) => {
                  const patientAllergiesList = appt.allergies?.length ? appt.allergies : (appt.patient?.allergies || []);
                  const patientAlertsList = appt.medicalAlerts?.length ? appt.medicalAlerts : (appt.patient?.medicalAlerts || []);
                  const hasAlertsOrAllergies = patientAllergiesList.length > 0 || patientAlertsList.length > 0;

                  return (
                    <tr
                      key={appt._id}
                      className={`transition-colors ${
                        appt.isEmergency ? 'bg-red-50/70 font-semibold' :
                        appt.isReferralPatient ? 'bg-indigo-50/50' :
                        appt.status === 'In Progress' ? 'bg-blue-50/60' :
                        'hover:bg-slate-50'
                      }`}
                    >
                      <td className="p-3 font-mono font-black text-base text-slate-900">
                        {appt.isReferralPatient ? (
                          <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">REF</span>
                        ) : (
                          `#${appt.queuePosition || 1}`
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                          <span>{appt.patientName}</span>
                          {appt.isEmergency && <Flame className="w-3.5 h-3.5 text-red-600 fill-red-600" />}
                          {appt.isReferralPatient && (
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-bold">
                              Referred
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {appt.patientAge} Yrs • {appt.patientGender || 'Male'} • Phone: {appt.patientPhone || 'N/A'}
                        </div>
                        {appt.referredByDoctorName && (
                          <div className="text-[10px] text-indigo-700 font-semibold mt-0.5">
                            Referred by: {appt.referredByDoctorName} ({appt.referredByDepartment})
                          </div>
                        )}
                        {appt.hasChronicCondition && (
                          <span className="inline-block mt-0.5 text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded font-medium">
                            Chronic: {appt.chronicDiseases?.join(', ') || 'Cardiac / Diabetes'}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{appt.slotTime}</div>
                        {appt.isReferralPatient ? (
                          <span className="text-[10px] text-indigo-600 font-bold">{appt.severity} Urgency</span>
                        ) : (
                          <span className="text-[10px] text-slate-400">Est. Wait: {appt.estimatedWaitMinutes}m</span>
                        )}
                      </td>

                      {/* Patient Clinical Alerts & Drug Allergies Tagging Column */}
                      <td className="p-3">
                        {hasAlertsOrAllergies ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {patientAllergiesList.map((al, idx) => (
                              <span
                                key={`al-${idx}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-rose-100 text-rose-800 border border-rose-200 rounded text-[10px] font-bold"
                              >
                                <ShieldAlert className="w-2.5 h-2.5 text-rose-600" />
                                {al}
                              </span>
                            ))}
                            {patientAlertsList.map((alt, idx) => (
                              <span
                                key={`alt-${idx}`}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[10px] font-bold"
                              >
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />
                                {alt}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No warnings tagged</span>
                        )}
                      </td>

                      <td className="p-3">
                        <PriorityBadge
                          level={appt.priorityLevel}
                          score={appt.priorityScore}
                          isEmergency={appt.isEmergency}
                          size="sm"
                        />
                      </td>
                      <td className="p-3 max-w-xs">
                        <p className="text-slate-700 line-clamp-2 leading-relaxed">
                          {appt.symptoms || 'General clinical assessment'}
                        </p>
                        {appt.referral?.isReferred && (
                          <span className="inline-block mt-1 text-[10px] bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded font-medium">
                            Referred to {appt.referral.referredToDoctorName || appt.referral.referredToDepartment}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          appt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          appt.status === 'In Progress' ? 'bg-blue-600 text-white animate-pulse' :
                          appt.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-sky-100 text-sky-800'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="p-3 text-right space-x-1.5">
                        <button
                          onClick={() => handleViewPatientHistory(appt.patient)}
                          className="p-1.5 text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50 rounded-lg transition"
                          title="View Medical History & Past Lab Reports"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        {/* Cross-Department Referral Button */}
                        <button
                          onClick={() => handleOpenReferralModal(appt)}
                          className="p-1.5 text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 rounded-lg transition"
                          title="Refer to another department specialist"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        {appt.status === 'Confirmed' && (
                          <>
                            <button
                              onClick={() => handleStartConsultation(appt)}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-1.5 rounded-lg text-xs transition inline-flex items-center gap-1"
                              title="Call Patient In"
                            >
                              <Play className="w-3 h-3" /> Start
                            </button>
                            {!appt.isEmergency && (
                              <button
                                onClick={() => handleEmergencyOverride(appt._id)}
                                className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 px-2 py-1.5 rounded-lg text-xs font-bold transition"
                                title="Triage Emergency Override to front of queue"
                              >
                                ⚡ Override
                              </button>
                            )}
                          </>
                        )}

                        {appt.status === 'In Progress' && (
                          <button
                            onClick={() => handleOpenConsultationModal(appt)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow transition inline-flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Complete & Prescribe
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Consultation Modal (Prescription & Notes) */}
      {activeConsultationAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 space-y-5 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">
                  Consultation: {activeConsultationAppt.patientName}
                </h3>
                <p className="text-xs text-slate-500">
                  {activeConsultationAppt.patientAge} Yrs • Slot: {activeConsultationAppt.slotTime} • Priority: {activeConsultationAppt.priorityLevel}
                </p>
              </div>
              <button
                onClick={() => setActiveConsultationAppt(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCompleteConsultation} className="space-y-4">
              {/* Patient Allergies & Critical Alerts Banner */}
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <div>
                      <h4 className="text-xs font-bold text-rose-950">Patient Allergies & Critical Clinical Alerts</h4>
                      <span className="text-[10px] text-rose-700">High-visibility safety flags across hospital EHR</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={savingAlerts}
                    onClick={handleSaveAlertsOnly}
                    className="text-[11px] font-bold bg-white text-rose-700 hover:bg-rose-100 border border-rose-300 px-3 py-1 rounded-lg transition shadow-xs"
                  >
                    {savingAlerts ? 'Syncing...' : 'Sync Alerts'}
                  </button>
                </div>

                {/* Drug Allergies Pills */}
                <div>
                  <label className="block text-[11px] font-bold text-rose-900 mb-1">
                    Drug / Environmental Allergies:
                  </label>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {patientAllergies.map((al, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-rose-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full"
                      >
                        <span>{al}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(idx)}
                          className="hover:text-rose-200 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {patientAllergies.length === 0 && (
                      <span className="text-[11px] text-rose-500 italic">No known drug allergies (NKDA)</span>
                    )}
                  </div>

                  {/* Add Allergy Input & Quick Pills */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={newAllergyInput}
                      onChange={(e) => setNewAllergyInput(e.target.value)}
                      placeholder="Add allergy (e.g. Penicillin, Sulfa, NSAIDs)..."
                      className="text-xs px-2.5 py-1 bg-white border border-rose-200 rounded-lg flex-1 outline-none focus:ring-1 focus:ring-rose-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddAllergy(newAllergyInput)}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Penicillin', 'Sulfa Drugs', 'NSAIDs / Aspirin', 'Latex', 'Peanuts'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddAllergy(tag)}
                        className="text-[10px] bg-white hover:bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full transition"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Critical Medical Conditions Pills */}
                <div className="pt-2 border-t border-rose-200/60">
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    Critical Medical Warnings & Risk Flags:
                  </label>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {patientMedicalAlerts.map((alt, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 bg-amber-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full"
                      >
                        <span>{alt}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAlert(idx)}
                          className="hover:text-amber-200 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {patientMedicalAlerts.length === 0 && (
                      <span className="text-[11px] text-amber-600 italic">No critical risk flags recorded</span>
                    )}
                  </div>

                  {/* Add Alert Input & Quick Pills */}
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={newAlertInput}
                      onChange={(e) => setNewAlertInput(e.target.value)}
                      placeholder="Add critical flag (e.g. Pacemaker, Bleeding Risk)..."
                      className="text-xs px-2.5 py-1 bg-white border border-amber-200 rounded-lg flex-1 outline-none focus:ring-1 focus:ring-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddAlert(newAlertInput)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg transition"
                    >
                      + Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {['Pacemaker Implant', 'Bleeding Risk / Anticoagulant', 'Severe Asthma', 'Fall Risk', 'Renal Impairment'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleAddAlert(tag)}
                        className="text-[10px] bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full transition"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Patient Vitals Recording & Live BMI Charting */}
              <div className="bg-sky-50/70 border border-sky-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-sky-600" />
                    <div>
                      <h4 className="text-xs font-bold text-sky-950">Patient Vitals Recording & Clinical Charting</h4>
                      <span className="text-[10px] text-sky-700">Auto-synced to patient electronic health record (EHR)</span>
                    </div>
                  </div>

                  {liveBmi.bmi && (
                    <div className={`px-2.5 py-1 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${liveBmi.color}`}>
                      <Scale className="w-3.5 h-3.5" />
                      <span>BMI: {liveBmi.bmi} ({liveBmi.category})</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">BP Systolic (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 120"
                      value={vitalsForm.bloodPressureSystolic}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressureSystolic: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">BP Diastolic (mmHg)</label>
                    <input
                      type="number"
                      placeholder="e.g. 80"
                      value={vitalsForm.bloodPressureDiastolic}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, bloodPressureDiastolic: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Pulse Rate (BPM)</label>
                    <input
                      type="number"
                      placeholder="e.g. 72"
                      value={vitalsForm.pulseHeartRate}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, pulseHeartRate: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">SpO₂ Oxygen (%)</label>
                    <input
                      type="number"
                      placeholder="e.g. 98"
                      value={vitalsForm.oxygenSaturation}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, oxygenSaturation: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Temp (°F)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 98.6"
                      value={vitalsForm.temperature}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Height (cm)</label>
                    <input
                      type="number"
                      placeholder="e.g. 175"
                      value={vitalsForm.heightCm}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, heightCm: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 70"
                      value={vitalsForm.weightKg}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, weightKg: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Blood Sugar (mg/dL)</label>
                    <input
                      type="number"
                      placeholder="e.g. 110"
                      value={vitalsForm.bloodSugarMgDl}
                      onChange={(e) => setVitalsForm({ ...vitalsForm, bloodSugarMgDl: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Assessment & Notes</label>
                <textarea
                  rows={3}
                  value={clinicalNotes}
                  onChange={(e) => setClinicalNotes(e.target.value)}
                  placeholder="Diagnosis, vitals, patient observations, follow-up instructions..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Prescriptions */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Digital Prescription</label>
                  <button
                    type="button"
                    onClick={() => setPrescriptions([...prescriptions, { medicine: '', dosage: '', frequency: 'Twice daily', duration: '5 days' }])}
                    className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Drug
                  </button>
                </div>

                {prescriptions.map((p, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                    <input
                      type="text"
                      placeholder="Medicine Name (e.g. Atorvastatin 20mg)"
                      value={p.medicine}
                      onChange={(e) => {
                        const copy = [...prescriptions];
                        copy[index].medicine = e.target.value;
                        setPrescriptions(copy);
                      }}
                      className="col-span-2 px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 1 tab)"
                      value={p.dosage}
                      onChange={(e) => {
                        const copy = [...prescriptions];
                        copy[index].dosage = e.target.value;
                        setPrescriptions(copy);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={p.frequency}
                      onChange={(e) => {
                        const copy = [...prescriptions];
                        copy[index].frequency = e.target.value;
                        setPrescriptions(copy);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Recommended Lab Tests */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recommended Lab Investigations</label>
                <input
                  type="text"
                  placeholder="e.g. Complete Blood Count (CBC-01), Comprehensive Lipid Profile (LIP-01)"
                  value={recommendedLabTests}
                  onChange={(e) => setRecommendedLabTests(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveConsultationAppt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition"
                >
                  Save & Complete Consultation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Emergency Blood Modal */}
      {showBloodModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 border-2 border-red-500 space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-red-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-bold text-base">
                <Flame className="w-5 h-5" />
                <span>Doctor Emergency Blood Broadcast</span>
              </div>
              <button onClick={() => setShowBloodModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleDispatchEmergencyBlood} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Blood Group Required</label>
                <select
                  value={bloodGroupReq}
                  onChange={(e) => setBloodGroupReq(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-red-700"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Units Required</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={bloodUnitsReq}
                  onChange={(e) => setBloodUnitsReq(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Reason</label>
                <input
                  type="text"
                  value={bloodReasonReq}
                  onChange={(e) => setBloodReasonReq(e.target.value)}
                  placeholder="e.g. Acute Hemorrhage, Urgent surgery stabilization"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <Flame className="w-4 h-4" />
                  <span>Dispatch Real-time Broadcast</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient History Drawer */}
      {patientHistoryData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-end p-0">
          <div className="bg-white h-full max-w-lg w-full p-6 shadow-2xl overflow-y-auto space-y-6 animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">{patientHistoryData.patient.name}</h3>
                <span className="text-xs text-slate-500">Medical Record ID: {patientHistoryData.patient._id}</span>
              </div>
              <button onClick={() => setPatientHistoryData(null)} className="p-1 rounded-lg hover:bg-slate-100">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Patient Clinical Profile & Vitals Overview in Drawer */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Drug Allergies & Medical Alerts:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {(patientHistoryData.patient.allergies || []).map((al, idx) => (
                  <span key={`a-${idx}`} className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                    {al}
                  </span>
                ))}
                {(patientHistoryData.patient.medicalAlerts || []).map((alt, idx) => (
                  <span key={`m-${idx}`} className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-bold text-[10px]">
                    {alt}
                  </span>
                ))}
                {!(patientHistoryData.patient.allergies?.length || patientHistoryData.patient.medicalAlerts?.length) && (
                  <span className="text-slate-400 italic text-[11px]">No alerts tagged on patient master profile</span>
                )}
              </div>

              {patientHistoryData.patient.latestVitals && (
                <div className="pt-2 border-t border-slate-200/80 text-[11px] text-slate-700 space-y-0.5">
                  <div className="font-bold text-slate-900">Latest Recorded Vitals:</div>
                  <div className="grid grid-cols-2 gap-1 text-[10px]">
                    <span>BP: {patientHistoryData.patient.latestVitals.bloodPressureSystolic || '-'}/{patientHistoryData.patient.latestVitals.bloodPressureDiastolic || '-'} mmHg</span>
                    <span>Pulse: {patientHistoryData.patient.latestVitals.pulseHeartRate || '-'} BPM</span>
                    <span>SpO₂: {patientHistoryData.patient.latestVitals.oxygenSaturation || '-'}%</span>
                    <span>Temp: {patientHistoryData.patient.latestVitals.temperature || '-'}°F</span>
                    <span>BMI: {patientHistoryData.patient.latestVitals.bmi || '-'} ({patientHistoryData.patient.latestVitals.bmiCategory || 'Normal'})</span>
                    <span>Blood Sugar: {patientHistoryData.patient.latestVitals.bloodSugarMgDl || '-'} mg/dL</span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Past Consultations</h4>
              {patientHistoryData.pastAppointments.map((pa) => (
                <div key={pa._id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{pa.appointmentDate} ({pa.slotTime})</span>
                    <span className="text-emerald-600">{pa.status}</span>
                  </div>
                  <p className="text-slate-600"><strong>Notes:</strong> {pa.clinicalNotes || 'None'}</p>
                  {pa.vitals && (pa.vitals.bloodPressureSystolic || pa.vitals.pulseHeartRate) && (
                    <div className="text-[10px] text-sky-800 bg-sky-50 p-1.5 rounded font-mono">
                      Vitals: BP {pa.vitals.bloodPressureSystolic || '-'}/{pa.vitals.bloodPressureDiastolic || '-'} • Pulse {pa.vitals.pulseHeartRate || '-'} • SpO₂ {pa.vitals.oxygenSaturation || '-'}% • BMI {pa.vitals.bmi || '-'}
                    </div>
                  )}
                  {pa.referral?.isReferred && (
                    <div className="text-[10px] text-indigo-700 bg-indigo-50 p-1.5 rounded">
                      Referral: Referred to Dr. {pa.referral.referredToDoctorName} ({pa.referral.referredToDepartment}) - {pa.referral.referralUrgency}
                    </div>
                  )}
                </div>
              ))}

              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 pt-2">Diagnostic Reports</h4>
              {patientHistoryData.labReports.map((lr) => (
                <div key={lr._id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
                  <div className="flex justify-between font-semibold text-slate-800">
                    <span>{lr.testName}</span>
                    <span className="text-sky-600">{lr.status}</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">{lr.reportData?.reportSummary || 'Investigation processed'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cross-Department Referral Modal */}
      {showReferralModal && referralTargetAppt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border-2 border-indigo-400 space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-indigo-100 pb-3">
              <div className="flex items-center gap-2 text-indigo-900 font-bold text-base">
                <Share2 className="w-5 h-5 text-indigo-600" />
                <span>Internal Cross-Department Referral</span>
              </div>
              <button
                onClick={() => { setShowReferralModal(false); setReferralTargetAppt(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-indigo-50/70 p-3.5 rounded-2xl border border-indigo-200 text-xs text-indigo-900 space-y-1">
              <div className="font-bold">Patient: {referralTargetAppt.patientName} ({referralTargetAppt.patientAge} Yrs)</div>
              <p className="text-indigo-800">
                Instantly transfers patient clinical record, recorded vitals, and drug allergy warnings directly to the receiving specialist's evaluation queue.
              </p>
            </div>

            <form onSubmit={handleSubmitReferral} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Specialist Department *</label>
                <select
                  value={referralForm.referredToDepartment}
                  onChange={(e) => handleReferralDeptChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  {['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'General Medicine', 'Dermatology', 'Oncology', 'ENT'].map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Receiving Doctor *</label>
                {loadingDeptDoctors ? (
                  <div className="p-2 text-slate-400 text-xs italic">Loading available specialists...</div>
                ) : deptDoctors.length === 0 ? (
                  <div className="p-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs">
                    No other doctors found in this department. Please select a different department.
                  </div>
                ) : (
                  <select
                    value={referralForm.referredToDoctorId}
                    onChange={(e) => setReferralForm({ ...referralForm, referredToDoctorId: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {deptDoctors.map(doc => (
                      <option key={doc._id} value={doc._id}>
                        {doc.name} ({doc.doctorProfile?.department} - Room: {doc.doctorProfile?.roomNumber || 'OPD'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Urgency Level *</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { level: 'Routine', color: 'bg-sky-50 text-sky-800 border-sky-300' },
                    { level: 'Urgent', color: 'bg-amber-50 text-amber-800 border-amber-300' },
                    { level: 'Immediate STAT', color: 'bg-red-50 text-red-800 border-red-300' }
                  ].map(({ level, color }) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setReferralForm({ ...referralForm, referralUrgency: level })}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition text-center ${
                        referralForm.referralUrgency === level
                          ? `${color} ring-2 ring-indigo-500 shadow`
                          : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Reason & Observations *</label>
                <textarea
                  rows={2}
                  required
                  value={referralForm.referralReason}
                  onChange={(e) => setReferralForm({ ...referralForm, referralReason: e.target.value })}
                  placeholder="e.g. Uncontrolled hypertension with chest tightness; urgent ECHO evaluation requested..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowReferralModal(false); setReferralTargetAppt(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReferral || deptDoctors.length === 0}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition flex items-center gap-1.5"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{submittingReferral ? 'Routing Patient...' : 'Confirm & Route Referral'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctor Leave & Appointment Rescheduling Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 border-2 border-amber-400 space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-amber-100 pb-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                <CalendarX className="w-5 h-5 text-amber-600" />
                <span>Doctor Leave & Patient Rescheduling</span>
              </div>
              <button onClick={() => setShowLeaveModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Automatic Patient Protection & Rescheduling</span>
              </div>
              <p className="text-amber-800">
                When you activate leave, all active OPD appointments booked with you will be automatically shifted to the target resume date and real-time SMS/portal notifications will be dispatched to each patient.
              </p>
            </div>

            <form onSubmit={handleConfirmLeave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Doctor Leave *</label>
                <input
                  type="text"
                  required
                  value={leaveForm.leaveReason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveReason: e.target.value })}
                  placeholder="e.g. Clinical Conference, Emergency Surgical Leave, Personal Leave"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Return & Auto-Reschedule Date *</label>
                <input
                  type="date"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  value={leaveForm.autoRescheduleDate}
                  onChange={(e) => setLeaveForm({ ...leaveForm, autoRescheduleDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 font-semibold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Pending patient appointments will be moved to this date and slots will be cleared.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLeaveModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLeave}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-md transition flex items-center gap-1.5"
                >
                  <CalendarX className="w-4 h-4" />
                  <span>{submittingLeave ? 'Rescheduling Patients...' : 'Confirm Leave & Reschedule'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
