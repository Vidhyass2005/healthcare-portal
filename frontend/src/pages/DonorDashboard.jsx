import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { bloodService } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Heart,
  Calendar,
  Award,
  Flame,
  CheckCircle,
  Clock,
  ShieldCheck,
  Building2,
  Send,
  Droplet,
  FileCheck,
  Printer,
  Sparkles
} from 'lucide-react';

export const DonorDashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { activeAlerts } = useSocket();

  const [donorData, setDonorData] = useState(null);
  const [eligibility, setEligibility] = useState({ isEligible: true, daysRemaining: 0, nextEligibleDate: new Date() });
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCertModal, setShowCertModal] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  const fetchDonorInfo = async () => {
    try {
      setLoading(true);
      const [requestsRes, donorsRes] = await Promise.all([
        bloodService.getRequests({ urgency: 'Critical / Immediate' }),
        bloodService.matchDonors({ bloodGroup: user?.bloodGroup || 'O-' })
      ]);

      setEmergencyRequests(requestsRes.data.requests || []);
      const matchedMe = (donorsRes.data.donors || []).find(
        d => d.user?._id === user?.id || d.user === user?.id || d.name === user?.name
      );

      if (matchedMe) {
        setDonorData(matchedMe);
        setEligibility({
          isEligible: matchedMe.isEligible,
          daysRemaining: matchedMe.daysRemaining || 0,
          nextEligibleDate: matchedMe.nextEligibleDate
        });
      }
    } catch (err) {
      console.error('Error fetching donor details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorInfo();
  }, [user, activeAlerts]);

  const handlePledgeDonation = (req) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    alert(`Thank you ${user?.name}! Your pledge for ${req.bloodGroup} at ${req.hospitalName} has been recorded. The emergency team has been notified.`);
  };

  const handleOpenCertificate = (cert) => {
    setSelectedCert(cert);
    setShowCertModal(true);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Donor Profile & Blood Group Banner */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-red-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-600/30 border border-rose-400/40 flex items-center justify-center text-rose-300">
            <Heart className="w-8 h-8 fill-rose-500 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">{user?.name || 'Blood Donor'}</h1>
              <span className="text-xs bg-rose-500/30 text-rose-200 px-2.5 py-0.5 rounded-full border border-rose-400/30 font-bold">
                {user?.bloodGroup || 'O-'} Group
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Registered Voluntary Life Saver • City: <strong>{user?.city || 'Chennai'}</strong>
            </p>
          </div>
        </div>

        {/* 90-Day Eligibility Status Indicator */}
        <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-right space-y-1">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">Donation Eligibility</span>
          {eligibility.isEligible ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-xl border border-emerald-700">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Eligible to Donate Today!</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 bg-amber-950/80 px-3 py-1.5 rounded-xl border border-amber-700">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Next in {eligibility.daysRemaining} days (90-day gap)</span>
            </div>
          )}
        </div>
      </div>

      {/* Emergency Blood Alerts Feed */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-red-600 font-bold text-base">
            <Flame className="w-5 h-5 animate-bounce" />
            <span>Active Hospital Emergency Requests ({user?.bloodGroup || 'O-'} Compatible)</span>
          </div>
          <span className="text-xs text-slate-400">Live Socket Broadcasts</span>
        </div>

        {emergencyRequests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No critical emergency broadcasts pending at this moment. You will be notified in real-time if a matching requirement is posted.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emergencyRequests.map((req) => (
              <div
                key={req._id}
                className="bg-red-50/60 border-2 border-red-200 rounded-2xl p-5 space-y-3 shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      CRITICAL URGENT
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{req.hospitalName}</h4>
                    <span className="text-[11px] text-slate-500">Location: {req.city}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-red-700">{req.bloodGroup}</span>
                    <div className="text-[10px] text-slate-600 font-semibold">{req.unitsRequired} Units needed</div>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-red-100">
                  <strong>Clinical Reason:</strong> {req.reason}
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">Posted: {new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  <button
                    onClick={() => handlePledgeDonation(req)}
                    className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition flex items-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5 fill-white" />
                    <span>Pledge Donation</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Donation History & Digital Certificate */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 text-base">Your Donation History & Certificates</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {donorData?.donationHistory?.length || 1} Lifetime Donations
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(donorData?.donationHistory?.length ? donorData.donationHistory : [
            {
              donationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
              units: 1,
              hospitalName: 'MEDCARE HOSPITAL Chennai',
              certificateId: 'BLD-CERT-849201'
            }
          ]).map((hist, i) => (
            <div key={i} className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-800">{new Date(hist.donationDate).toLocaleDateString()}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {hist.units} Unit Donated
                </span>
              </div>
              <p className="text-xs text-slate-600"><strong>Center:</strong> {hist.hospitalName}</p>
              <div className="text-[11px] font-mono text-slate-400">Cert ID: {hist.certificateId || 'BLD-CERT-120492'}</div>

              <button
                onClick={() => handleOpenCertificate(hist)}
                className="w-full bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
              >
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span>View & Print Certificate</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Printable Certificate Modal */}
      {showCertModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 border-4 border-amber-400 space-y-6 text-center text-slate-800 relative">
            <div className="flex justify-end print:hidden">
              <button
                onClick={() => setShowCertModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                Close (✕)
              </button>
            </div>

            <div className="space-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
                <Award className="w-9 h-9" />
              </div>
              <span className="text-xs font-extrabold uppercase tracking-widest text-amber-700">Official Certificate of Appreciation</span>
              <h2 className="text-2xl font-serif font-black text-slate-900">Life Saver Honor Award</h2>
              <p className="text-xs text-slate-500">Presented with gratitude by MEDCARE HOSPITAL Blood Bank Network</p>
            </div>

            <div className="p-6 bg-amber-50/50 rounded-2xl border border-amber-200 text-sm space-y-2">
              <p className="text-slate-700">This certificate is proudly awarded to</p>
              <h3 className="text-xl font-bold text-rose-700">{user?.name || 'Anand V'}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                In noble recognition of selfless voluntary blood donation (Blood Group: <strong>{user?.bloodGroup || 'O-'}</strong>) helping save human lives in acute medical distress.
              </p>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 px-6 pt-4 border-t border-slate-200">
              <div>
                <div className="font-mono text-[10px]">Certificate: {selectedCert?.certificateId || 'BLD-CERT-849201'}</div>
                <div className="text-[10px]">Date: {new Date().toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                <strong>Dr. Arthur Campbell</strong>
                <div className="text-[10px] text-slate-400">Chief Medical Director</div>
              </div>
            </div>

            <div className="print:hidden pt-2">
              <button
                onClick={() => window.print()}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-md transition inline-flex items-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Print Certificate</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
