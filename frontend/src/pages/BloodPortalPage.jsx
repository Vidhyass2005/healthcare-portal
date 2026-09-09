import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSocket } from '../context/SocketContext';
import { bloodService } from '../services/api';
import confetti from 'canvas-confetti';
import {
  Heart,
  Droplet,
  Users,
  Flame,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  Send,
  Building2,
  MapPin,
  Phone,
  ShieldCheck,
  UserPlus,
  FileText,
  Activity,
  Check
} from 'lucide-react';

export const BloodPortalPage = ({ onNavigate }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { activeAlerts } = useSocket();

  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'request' | 'match' | 'requests_feed'
  const [inventory, setInventory] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);

  // Donor Matcher State
  const [matchGroup, setMatchGroup] = useState('O-');
  const [matchCity, setMatchCity] = useState('All');
  const [matchedDonors, setMatchedDonors] = useState([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  // Blood Request Form State
  const [requestForm, setRequestForm] = useState({
    patientName: user?.name || '',
    bloodGroup: 'O+',
    unitsRequired: 2,
    hospitalName: 'MEDCARE HOSPITAL',
    city: 'Chennai',
    urgencyLevel: 'Urgent (within 12 hrs)',
    reason: 'Emergency Surgical Procedure'
  });
  const [submittingReq, setSubmittingReq] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(null);

  // New Donor Registration State
  const [donorRegForm, setDonorRegForm] = useState({
    name: user?.name || '',
    bloodGroup: user?.bloodGroup && user?.bloodGroup !== 'Unknown' ? user.bloodGroup : 'O+',
    phone: user?.phone || '',
    email: user?.email || '',
    city: user?.city || 'Chennai',
    locationArea: 'Central',
    address: '',
    age: user?.age || 28,
    gender: user?.gender || 'Male',
    weightKg: 65,
    lastDonationDate: '',
    hasChronicDiseases: false,
    chronicDiseases: '',
    hadRecentSurgery: false,
    surgeryDetails: '',
    hadTattooRecently: false,
    hemoglobinLevel: 13.5,
    notes: 'Voluntary blood donor registration'
  });
  const [submittingDonorReg, setSubmittingDonorReg] = useState(false);
  const [donorRegSuccess, setDonorRegSuccess] = useState(null);

  const fetchBloodData = async () => {
    try {
      const [invRes, reqRes] = await Promise.all([
        bloodService.getInventory(),
        bloodService.getRequests()
      ]);
      setInventory(invRes.data.inventory || []);
      setBloodRequests(reqRes.data.requests || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBloodData();
  }, [activeAlerts]);

  const handleMatchDonors = async () => {
    try {
      setMatchingLoading(true);
      const res = await bloodService.matchDonors({
        bloodGroup: matchGroup,
        city: matchCity
      });
      setMatchedDonors(res.data.donors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMatchingLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'match') {
      handleMatchDonors();
    }
  }, [activeTab, matchGroup, matchCity]);

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReq(true);
      const res = await bloodService.createRequest(requestForm);
      setRequestSuccess(res.data.bloodRequest);
      fetchBloodData();

      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting blood request');
    } finally {
      setSubmittingReq(false);
    }
  };

  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    try {
      setSubmittingDonorReg(true);
      const res = await bloodService.registerDonor(donorRegForm);
      setDonorRegSuccess(res.data.donor);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      fetchBloodData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error registering blood donor');
    } finally {
      setSubmittingDonorReg(false);
    }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-8 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-red-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 text-xs px-3 py-1 rounded-full border border-rose-400/30 font-semibold mb-2">
            <Heart className="w-3.5 h-3.5 fill-rose-400" />
            <span>Integrated Blood Bank & Emergency Matcher</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold">Blood Bank & Donation Portal</h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Real-time inventory levels • 90-day eligibility engine • Instant emergency broadcasts
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'inventory' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" /> Inventory
          </button>
          <button
            onClick={() => setActiveTab('register_donor')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'register_donor' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> Register Donor
          </button>
          <button
            onClick={() => setActiveTab('match')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'match' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Match Donors
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'request' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" /> Request Blood
          </button>
          <button
            onClick={() => setActiveTab('requests_feed')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'requests_feed' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Live Requests ({bloodRequests.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Blood Inventory */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Current Blood Bank Stock Levels</h3>
                <p className="text-xs text-slate-500">Live units available per blood group in Central Blood Repository</p>
              </div>
              <button
                onClick={() => setActiveTab('request')}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition flex items-center gap-1.5"
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Submit Emergency Requirement</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {inventory.map((item) => {
                const isCritical = item.unitsAvailable <= item.criticalThreshold;
                return (
                  <div
                    key={item.bloodGroup}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCritical
                        ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-2xl font-black text-slate-900">{item.bloodGroup}</span>
                      {isCritical ? (
                        <span className="text-[10px] bg-rose-600 text-white font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" /> Critical
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Adequate
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      <div className="text-3xl font-black text-slate-900 font-mono">
                        {item.unitsAvailable}
                        <span className="text-xs font-normal text-slate-500 ml-1">units</span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">Safety Min: {item.criticalThreshold} units</span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200 flex justify-between text-xs">
                      <button
                        onClick={() => {
                          setMatchGroup(item.bloodGroup);
                          setActiveTab('match');
                        }}
                        className="text-rose-600 hover:underline font-bold"
                      >
                        Find Donors &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab: New User Blood Donor Registration Form */}
      {activeTab === 'register_donor' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 max-w-3xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">New Voluntary Blood Donor Registration</h3>
                  <p className="text-xs text-slate-500">
                    Join the MEDCARE life-saver registry. All details will be securely recorded in the repository.
                  </p>
                </div>
              </div>
              <span className="text-[11px] bg-rose-50 text-rose-700 px-3 py-1 rounded-full font-bold border border-rose-200">
                Hospital Registry
              </span>
            </div>
          </div>

          {donorRegSuccess ? (
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-emerald-900 text-base">Registration Successful!</h4>
                <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                  Thank you, <strong>{donorRegSuccess.name}</strong> ({donorRegSuccess.bloodGroup}). Your profile and medical eligibility are now recorded in the hospital blood database.
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    setDonorRegSuccess(null);
                    setActiveTab('inventory');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow transition"
                >
                  View Blood Inventory
                </button>
                <button
                  onClick={() => setDonorRegSuccess(null)}
                  className="bg-white border border-emerald-300 text-emerald-800 font-bold px-4 py-2 rounded-xl text-xs"
                >
                  Register Another Donor
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRegisterDonor} className="space-y-6 text-xs">
              {/* Section 1: Personal & Contact Information */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">1</span>
                  Personal & Contact Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={donorRegForm.name}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, name: e.target.value })}
                      placeholder="e.g. Ramesh Kumar"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Blood Group *</label>
                    <select
                      value={donorRegForm.bloodGroup}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, bloodGroup: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-rose-700"
                    >
                      {bloodGroups.map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={donorRegForm.phone}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, phone: e.target.value })}
                      placeholder="+91 98840 12345"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={donorRegForm.email}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, email: e.target.value })}
                      placeholder="donor@example.com"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">City / District *</label>
                    <input
                      type="text"
                      required
                      value={donorRegForm.city}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, city: e.target.value })}
                      placeholder="e.g. Chennai"
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Age * (Min 18 Yrs)</label>
                    <input
                      type="number"
                      min={18}
                      max={65}
                      required
                      value={donorRegForm.age}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, age: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Gender</label>
                    <select
                      value={donorRegForm.gender}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, gender: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Body Weight (kg) * (Min 45 kg)</label>
                    <input
                      type="number"
                      min={45}
                      max={160}
                      required
                      value={donorRegForm.weightKg}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, weightKg: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Residential Address / Area</label>
                  <input
                    type="text"
                    value={donorRegForm.address}
                    onChange={(e) => setDonorRegForm({ ...donorRegForm, address: e.target.value })}
                    placeholder="Street, Locality, Landmark"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Section 2: Donation History & Medical Health Eligibility */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-1.5">
                  <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px]">2</span>
                  Medical History & Donation Eligibility
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Last Blood Donation Date (if any)</label>
                    <input
                      type="date"
                      value={donorRegForm.lastDonationDate}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, lastDonationDate: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Leave empty if this is your first donation</span>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Estimated Hemoglobin (g/dL)</label>
                    <input
                      type="number"
                      step="0.1"
                      min={10}
                      max={20}
                      value={donorRegForm.hemoglobinLevel}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, hemoglobinLevel: Number(e.target.value) })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Clinical standard: ≥ 12.5 g/dL</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={donorRegForm.hasChronicDiseases}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, hasChronicDiseases: e.target.checked })}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-semibold text-slate-700">Any chronic diseases (Hypertension, Diabetes, Cardiac, Asthma)?</span>
                  </label>

                  {donorRegForm.hasChronicDiseases && (
                    <input
                      type="text"
                      value={donorRegForm.chronicDiseases}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, chronicDiseases: e.target.value })}
                      placeholder="Specify chronic condition(s)"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl mt-1"
                    />
                  )}

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={donorRegForm.hadRecentSurgery}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, hadRecentSurgery: e.target.checked })}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-semibold text-slate-700">Had major surgery in past 6 months?</span>
                  </label>

                  {donorRegForm.hadRecentSurgery && (
                    <input
                      type="text"
                      value={donorRegForm.surgeryDetails}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, surgeryDetails: e.target.value })}
                      placeholder="Surgery details"
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl mt-1"
                    />
                  )}

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={donorRegForm.hadTattooRecently}
                      onChange={(e) => setDonorRegForm({ ...donorRegForm, hadTattooRecently: e.target.checked })}
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="font-semibold text-slate-700">Tattoo or piercing in past 6 months?</span>
                  </label>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Additional Medical Remarks / Notes</label>
                  <textarea
                    rows={2}
                    value={donorRegForm.notes}
                    onChange={(e) => setDonorRegForm({ ...donorRegForm, notes: e.target.value })}
                    placeholder="General fitness, medication notes, or availability preferences"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingDonorReg}
                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
              >
                <UserPlus className="w-4 h-4" />
                <span>{submittingDonorReg ? 'Registering...' : 'Register in Blood Donor Repository'}</span>
              </button>
            </form>
          )}
        </div>
      )}

      {/* Tab 2: Smart Donor Matching */}
      {activeTab === 'match' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Smart Donor Matching Algorithm</h3>
              <p className="text-xs text-slate-500">
                Filters compatible blood groups (including Universal Donor O-), geographical city, and 90-day eligibility
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={matchGroup}
                onChange={(e) => setMatchGroup(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-rose-700"
              >
                {bloodGroups.map(bg => (
                  <option key={bg} value={bg}>{bg} Recipient</option>
                ))}
              </select>

              <select
                value={matchCity}
                onChange={(e) => setMatchCity(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="All">All Cities</option>
                <option value="Chennai">Chennai</option>
                <option value="Madurai">Madurai</option>
                <option value="Coimbatore">Coimbatore</option>
              </select>
            </div>
          </div>

          {matchingLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Searching active donor network...</div>
          ) : matchedDonors.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No matching registered donors found for this criteria.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchedDonors.map((donor) => (
                <div
                  key={donor._id}
                  className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-sm">
                        {donor.bloodGroup}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{donor.name}</h4>
                        <span className="text-xs text-slate-500">
                          {donor.age} Yrs • Location: {donor.city}
                        </span>
                      </div>
                    </div>

                    <div>
                      {donor.isEligible ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Eligible
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> In {donor.daysRemaining}d
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Contact: <strong>{donor.phone || '+91 98840 XXXXX'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                      <span>Emergency Dispatch: <strong className="text-emerald-600">Available</strong></span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Submit Blood Request Form */}
      {activeTab === 'request' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 max-w-2xl mx-auto">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-600" />
              <span>Submit Blood Requirement Request</span>
            </h3>
            <p className="text-xs text-slate-500">
              Dispatches alerts to matching donors and hospital blood bank staff in real-time
            </p>
          </div>

          <form onSubmit={handleCreateRequest} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Patient Full Name</label>
                <input
                  type="text"
                  required
                  value={requestForm.patientName}
                  onChange={(e) => setRequestForm({ ...requestForm, patientName: e.target.value })}
                  placeholder="Patient Name"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Blood Group Required</label>
                <select
                  value={requestForm.bloodGroup}
                  onChange={(e) => setRequestForm({ ...requestForm, bloodGroup: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold text-rose-700"
                >
                  {bloodGroups.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Units Required</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={requestForm.unitsRequired}
                  onChange={(e) => setRequestForm({ ...requestForm, unitsRequired: Number(e.target.value) })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Urgency Level</label>
                <select
                  value={requestForm.urgencyLevel}
                  onChange={(e) => setRequestForm({ ...requestForm, urgencyLevel: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                >
                  <option value="Critical / Immediate">Critical / Immediate (Emergency Broadcast)</option>
                  <option value="Urgent (within 12 hrs)">Urgent (within 12 hrs)</option>
                  <option value="Standard (within 24-48 hrs)">Standard (within 24-48 hrs)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Hospital / Medical Center</label>
                <input
                  type="text"
                  required
                  value={requestForm.hospitalName}
                  onChange={(e) => setRequestForm({ ...requestForm, hospitalName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">City / Region</label>
                <input
                  type="text"
                  required
                  value={requestForm.city}
                  onChange={(e) => setRequestForm({ ...requestForm, city: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reason / Clinical Context</label>
              <textarea
                rows={2}
                value={requestForm.reason}
                onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
                placeholder="e.g. Major orthopedic surgery, emergency acute trauma transfusion"
                className="w-full p-2.5 bg-slate-50 border rounded-xl"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReq}
              className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
            >
              <Send className="w-4 h-4" />
              <span>{submittingReq ? 'Broadcasting...' : 'Broadcast Blood Request'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Live Requests Feed */}
      {activeTab === 'requests_feed' && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-lg">Hospital Blood Request Stream</h3>
            <p className="text-xs text-slate-500">Chronological feed of patient and clinical blood requisitions</p>
          </div>

          <div className="space-y-3">
            {bloodRequests.map((req) => (
              <div
                key={req._id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex justify-between items-center gap-4 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{req.patientName}</span>
                    <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.2 rounded font-mono">
                      {req.bloodGroup} ({req.unitsRequired} units)
                    </span>
                    {req.urgencyLevel?.includes('Critical') && (
                      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.2 rounded-full uppercase">
                        Emergency
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 mt-1">
                    Hospital: <strong>{req.hospitalName}</strong>, {req.city} • Context: {req.reason}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">{new Date(req.createdAt).toLocaleDateString()}</span>
                  <span className="bg-slate-200 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
