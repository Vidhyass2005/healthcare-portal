import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { priorityService, authService } from '../services/api';
import { PriorityBadge } from '../components/PriorityBadge';
import {
  Clock,
  Activity,
  Search,
  Stethoscope,
  Users,
  Flame,
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';

export const QueueTrackerPage = () => {
  const { user } = useAuth();
  const { latestQueueUpdate } = useSocket();

  const [doctors, setDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState('');
  const [queueDate, setQueueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [queueData, setQueueData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadDoctors = async () => {
      try {
        const res = await authService.getDoctors();
        setDoctors(res.data.doctors || []);
        if (res.data.doctors?.length > 0) {
          setSelectedDoctorId(res.data.doctors[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadDoctors();
  }, []);

  const fetchDoctorQueue = async () => {
    if (!selectedDoctorId) return;
    try {
      setLoading(true);
      const res = await priorityService.getDoctorQueue(selectedDoctorId, queueDate);
      setQueueData(res.data.queue || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorQueue();
  }, [selectedDoctorId, queueDate, latestQueueUpdate]);

  const selectedDoctor = doctors.find(d => d._id === selectedDoctorId);

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-blue-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-2">
        <div className="inline-flex items-center gap-2 bg-sky-500/20 text-sky-300 text-xs px-3 py-1 rounded-full border border-sky-400/30 font-semibold">
          <Activity className="w-3.5 h-3.5" />
          <span>Real-time Clinical Triage Board</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Live Outpatient Queue Tracker</h1>
        <p className="text-xs sm:text-sm text-slate-300">
          Transparent clinical priority ordering • Live waiting time forecast • Doctor consultation status
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex-1 min-w-[220px]">
          <label className="block font-bold text-slate-700 mb-1">Select Doctor OPD Queue</label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold text-slate-800"
          >
            {doctors.map(d => (
              <option key={d._id} value={d._id}>
                {d.name} ({d.doctorProfile?.department} - Room: {d.doctorProfile?.roomNumber})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-slate-700 mb-1">Queue Date</label>
          <input
            type="date"
            value={queueDate}
            onChange={(e) => setQueueDate(e.target.value)}
            className="p-2.5 bg-slate-50 border rounded-xl font-semibold text-slate-800"
          />
        </div>
      </div>

      {/* Queue Board */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-sky-600" />
              <span>{selectedDoctor?.name || 'Doctor Queue'}</span>
            </h3>
            <span className="text-xs text-slate-500">
              Department: <strong>{selectedDoctor?.doctorProfile?.department}</strong> • Status: <strong className="text-emerald-600">Active</strong>
            </span>
          </div>

          <span className="text-xs font-bold bg-sky-100 text-sky-800 px-3 py-1 rounded-full">
            {queueData.length} Patients in Queue
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">Loading live triage queue...</div>
        ) : queueData.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No appointments active in this doctor queue.</div>
        ) : (
          <div className="space-y-3">
            {queueData.map((patient, index) => {
              const isCurrent = patient.status === 'In Progress';
              const isMine = user && (patient.patient === user.id || patient.patient === user._id);

              return (
                <div
                  key={patient._id}
                  className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-sm'
                      : isMine
                      ? 'bg-emerald-50/60 border-emerald-400'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-black text-lg">
                      #{patient.queuePosition || index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">
                          {isMine ? `${patient.patientName} (You)` : `Patient ${patient.patientName.split(' ')[0]}***`}
                        </h4>
                        {patient.isEmergency && (
                          <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                            Emergency
                          </span>
                        )}
                        {isCurrent && (
                          <span className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase animate-pulse">
                            Inside Consultation
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 mt-0.5">
                        Slot: <strong>{patient.slotTime}</strong> • Estimated Wait: <strong className="text-slate-800">~{patient.estimatedWaitMinutes} mins</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <PriorityBadge
                      level={patient.priorityLevel}
                      score={patient.priorityScore}
                      isEmergency={patient.isEmergency}
                      size="sm"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
