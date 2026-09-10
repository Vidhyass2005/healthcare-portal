import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminService, bloodService, feedbackService, labService } from '../services/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Shield,
  Users,
  Calendar,
  Heart,
  FlaskConical,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Plus,
  RefreshCw,
  Stethoscope,
  Building2,
  CheckCircle,
  MessageSquare,
  Star,
  Clock,
  Search,
  Eye,
  Send,
  Sparkles,
  Filter
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'inventory' | 'doctors' | 'users'
  const [analytics, setAnalytics] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [bloodInventory, setBloodInventory] = useState([]);
  const [donorsList, setDonorsList] = useState([]);
  const [feedbacksList, setFeedbacksList] = useState([]);
  const [feedbackFilter, setFeedbackFilter] = useState({ category: 'All', rating: 'All' });
  const [feedbackReplyText, setFeedbackReplyText] = useState({});
  const [selectedDonorDetail, setSelectedDonorDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  // Diagnostic Lab Tests Catalog State
  const [labTestsList, setLabTestsList] = useState([]);
  const [showAddLabTestModal, setShowAddLabTestModal] = useState(false);
  const [newLabTestForm, setNewLabTestForm] = useState({
    name: '',
    category: 'Pathology',
    code: '',
    description: '',
    price: 450,
    sampleType: 'Blood',
    fastingRequired: false,
    preparationInstructions: 'No special preparation needed.',
    turnaroundHours: 24,
    dailyCapacity: 40,
    isHomeSampleAvailable: true,
    recommendedForSymptoms: ''
  });
  const [savingLabTest, setSavingLabTest] = useState(false);

  // New Doctor Form Modal
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    password: 'Doctor@123',
    phone: '',
    age: 42,
    gender: 'Male',
    city: 'Chennai',
    department: 'Cardiology',
    specialization: 'Senior Interventional Cardiologist',
    experienceYears: 12,
    consultationFee: 800,
    roomNumber: 'OPD-Cardio-105',
    availabilityStatus: 'Available',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  });

  const departments = [
    'Cardiology',
    'Orthopedics',
    'Neurology',
    'General Medicine',
    'Pediatrics',
    'Oncology',
    'Dermatology',
    'Gastroenterology',
    'ENT',
    'Nephrology',
    'Pulmonology'
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, usersRes, bloodRes, donorsRes, feedbackRes, labTestsRes] = await Promise.all([
        adminService.getAnalytics(),
        adminService.getUsers(),
        bloodService.getInventory(),
        bloodService.getAllDonorsAdmin(),
        feedbackService.getAllAdmin(),
        labService.getTests()
      ]);
      setAnalytics(analyticsRes.data);
      setUsersList(usersRes.data.users || []);
      setBloodInventory(bloodRes.data.inventory || []);
      setDonorsList(donorsRes.data.donors || []);
      setFeedbacksList(feedbackRes.data.feedbacks || []);
      setLabTestsList(labTestsRes.data.tests || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveLabTest = async (e) => {
    e.preventDefault();
    try {
      setSavingLabTest(true);
      await labService.createTest(newLabTestForm);
      alert(`Diagnostic test "${newLabTestForm.name}" (${newLabTestForm.code.toUpperCase()}) added to hospital catalog!`);
      setShowAddLabTestModal(false);
      setNewLabTestForm({
        name: '',
        category: 'Pathology',
        code: '',
        description: '',
        price: 450,
        sampleType: 'Blood',
        fastingRequired: false,
        preparationInstructions: 'No special preparation needed.',
        turnaroundHours: 24,
        dailyCapacity: 40,
        isHomeSampleAvailable: true,
        recommendedForSymptoms: ''
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving lab test');
    } finally {
      setSavingLabTest(false);
    }
  };

  const handleUpdateFeedbackStatus = async (id, status, adminReply) => {
    try {
      await feedbackService.updateStatus(id, { status, adminReply });
      fetchData();
      alert('Feedback updated successfully!');
    } catch (err) {
      alert('Error updating feedback');
    }
  };

  const handleRestockBlood = async (bloodGroup, delta) => {
    try {
      await bloodService.updateInventory(bloodGroup, { unitsDelta: delta });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating stock');
    }
  };

  const handleOpenAddDoctor = () => {
    setEditingDoctor(null);
    setDoctorForm({
      name: '',
      email: '',
      password: 'Doctor@123',
      phone: '',
      age: 40,
      gender: 'Male',
      city: 'Chennai',
      department: 'Cardiology',
      specialization: 'Senior Consultant Specialist',
      experienceYears: 10,
      consultationFee: 750,
      roomNumber: 'OPD-105',
      availabilityStatus: 'Available',
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    });
    setShowDoctorModal(true);
  };

  const handleOpenEditDoctor = (doc) => {
    setEditingDoctor(doc);
    setDoctorForm({
      name: doc.name || '',
      email: doc.email || '',
      password: '',
      phone: doc.phone || '',
      age: doc.age || 40,
      gender: doc.gender || 'Male',
      city: doc.city || 'Chennai',
      department: doc.doctorProfile?.department || 'General Medicine',
      specialization: doc.doctorProfile?.specialization || 'Consultant Specialist',
      experienceYears: doc.doctorProfile?.experienceYears || 5,
      consultationFee: doc.doctorProfile?.consultationFee || 500,
      roomNumber: doc.doctorProfile?.roomNumber || 'OPD-101',
      availabilityStatus: doc.doctorProfile?.availabilityStatus || 'Available',
      availableDays: doc.doctorProfile?.availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    });
    setShowDoctorModal(true);
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await adminService.updateDoctor(editingDoctor._id, doctorForm);
        alert(`Doctor ${doctorForm.name} updated successfully!`);
      } else {
        await adminService.createDoctor(doctorForm);
        alert(`Doctor ${doctorForm.name} added successfully!`);
      }
      setShowDoctorModal(false);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving doctor details');
    }
  };

  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the medical staff?`)) return;
    try {
      await adminService.deleteDoctor(id);
      alert(`${name} removed successfully.`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting doctor');
    }
  };

  const handleToggleDoctorStatus = async (doc) => {
    const nextStatus = doc.doctorProfile?.availabilityStatus === 'Available' ? 'On Leave' : 'Available';
    try {
      await adminService.updateDoctor(doc._id, { availabilityStatus: nextStatus });
      fetchData();
    } catch (err) {
      alert('Error updating doctor availability');
    }
  };

  // Prepare Department Load Chart Data
  const deptLabels = analytics?.charts?.departmentLoad?.map(d => d._id) || ['Cardiology', 'General Medicine', 'Orthopedics', 'Neurology', 'Pediatrics'];
  const deptData = analytics?.charts?.departmentLoad?.map(d => d.count) || [12, 19, 8, 5, 7];

  const departmentChartData = {
    labels: deptLabels,
    datasets: [
      {
        label: 'Appointments',
        data: deptData,
        backgroundColor: [
          '#0284c7',
          '#10b981',
          '#f59e0b',
          '#8b5cf6',
          '#ec4899',
          '#06b6d4'
        ],
        borderWidth: 0
      }
    ]
  };

  // Prepare Peak Hours Chart Data
  const peakHoursLabels = analytics?.charts?.peakHours?.map(p => p._id) || ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];
  const peakHoursData = analytics?.charts?.peakHours?.map(p => p.count) || [15, 22, 18, 10, 14, 8];

  const peakHoursChartData = {
    labels: peakHoursLabels,
    datasets: [
      {
        label: 'Patients per Slot',
        data: peakHoursData,
        backgroundColor: '#38bdf8',
        borderRadius: 8
      }
    ]
  };

  // Prepare Blood Stock Chart Data
  const bloodLabels = bloodInventory.map(b => b.bloodGroup);
  const bloodUnits = bloodInventory.map(b => b.unitsAvailable);
  const bloodColors = bloodInventory.map(b => b.unitsAvailable <= b.criticalThreshold ? '#ef4444' : '#0284c7');

  const bloodChartData = {
    labels: bloodLabels,
    datasets: [
      {
        label: 'Units in Stock',
        data: bloodUnits,
        backgroundColor: bloodColors,
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 flex flex-wrap items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold">Hospital Administration Portal</h1>
              <span className="text-xs bg-purple-500/30 text-purple-200 px-2.5 py-0.5 rounded-full border border-purple-400/30 font-semibold uppercase">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Supervising Outpatient Flow, Blood Bank Stock & Real-time Clinical Priorities
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'analytics' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" /> Analytics
          </button>
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'doctors' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5" /> Doctors Directory
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'inventory' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5" /> Blood Stock
          </button>
          <button
            onClick={() => setActiveTab('donors')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'donors' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Heart className="w-3.5 h-3.5 text-rose-400" /> Donors Directory ({donorsList.length})
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'feedback' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-amber-400" /> Patient Feedback ({feedbacksList.length})
          </button>
          <button
            onClick={() => setActiveTab('lab-tests')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'lab-tests' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5 text-emerald-400" /> Lab Catalog ({labTestsList.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> All Users
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Total Appointments</span>
          <div className="text-2xl font-black text-slate-900 mt-1">{analytics?.metrics?.totalAppointments || 0}</div>
          <span className="text-[10px] text-emerald-600 font-bold">{analytics?.metrics?.completedAppointments || 0} completed</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold block">No-Show Rate</span>
          <div className="text-2xl font-black text-amber-600 mt-1">{analytics?.metrics?.noShowRate || '0%'}</div>
          <span className="text-[10px] text-slate-400">{analytics?.metrics?.noShowAppointments || 0} missed slots</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold block">High Priority Cases</span>
          <div className="text-2xl font-black text-red-600 mt-1">{analytics?.metrics?.highPriorityAppointments || 0}</div>
          <span className="text-[10px] text-red-500 font-bold">Fast-tracked OPD</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Active Doctors</span>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {usersList.filter(u => u.role === 'doctor').length || analytics?.metrics?.totalDoctors || 0}
          </div>
          <span className="text-[10px] text-blue-600 font-bold">Admin Managed</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Blood Donors</span>
          <div className="text-2xl font-black text-rose-600 mt-1">{analytics?.metrics?.totalDonors || 0}</div>
          <span className="text-[10px] text-slate-400">Registered</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-[11px] text-slate-500 font-semibold block">Lab Bookings</span>
          <div className="text-2xl font-black text-emerald-600 mt-1">{analytics?.metrics?.totalLabBookings || 0}</div>
          <span className="text-[10px] text-slate-400">Pathology & Rad</span>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Load */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm">Department Load Distribution</h3>
                <span className="text-[11px] text-slate-400">Real-time OPD Traffic</span>
              </div>
              <div className="h-64 flex items-center justify-center">
                <Doughnut
                  data={departmentChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } }
                  }}
                />
              </div>
            </div>

            {/* Peak Hours Analysis */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm">Peak Hours Slot Demand</h3>
                <span className="text-[11px] text-slate-400">Hourly Distribution</span>
              </div>
              <div className="h-64">
                <Bar
                  data={peakHoursChartData}
                  options={{
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } } }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Blood Inventory Chart & Critical Alerts */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Blood Bank Inventory Status (All 8 Groups)</h3>
                <p className="text-xs text-slate-500">Red bars denote blood groups at or below critical safety threshold (&le; 5 units)</p>
              </div>
            </div>

            <div className="h-64">
              <Bar
                data={bloodChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab: Doctors Management (Admin Controlled) */}
      {activeTab === 'doctors' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-lg">Hospital Clinical Doctors Directory</h3>
              </div>
              <p className="text-xs text-slate-500">
                Doctors are registered and credentialed by Hospital Administration
              </p>
            </div>

            <button
              onClick={handleOpenAddDoctor}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-md transition"
            >
              <Plus className="w-4 h-4" /> Add New Doctor
            </button>
          </div>

          {/* Doctors Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Doctor Details</th>
                  <th className="p-3.5">Department</th>
                  <th className="p-3.5">Specialization</th>
                  <th className="p-3.5">Experience</th>
                  <th className="p-3.5">Fee / Room</th>
                  <th className="p-3.5">Availability</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.filter(u => u.role === 'doctor').length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-xs text-slate-400">
                      No doctors currently listed. Click "Add New Doctor" to register staff.
                    </td>
                  </tr>
                ) : (
                  usersList.filter(u => u.role === 'doctor').map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">{doc.name}</div>
                        <div className="text-slate-500 text-[11px]">{doc.email}</div>
                        <div className="text-slate-400 text-[10px]">{doc.phone || 'No phone'}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="bg-blue-50 text-blue-700 font-bold px-2.5 py-1 rounded-lg border border-blue-200">
                          {doc.doctorProfile?.department || 'General Medicine'}
                        </span>
                      </td>
                      <td className="p-3.5 text-slate-700 font-medium">
                        {doc.doctorProfile?.specialization || 'Consultant Specialist'}
                      </td>
                      <td className="p-3.5 font-semibold text-slate-800">
                        {doc.doctorProfile?.experienceYears || 5} Yrs
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-emerald-700">₹{doc.doctorProfile?.consultationFee || 500}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{doc.doctorProfile?.roomNumber || 'OPD-101'}</div>
                      </td>
                      <td className="p-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleDoctorStatus(doc)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition ${
                            doc.doctorProfile?.availabilityStatus === 'Available'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Click to toggle status"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{doc.doctorProfile?.availabilityStatus || 'Available'}</span>
                        </button>
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditDoctor(doc)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteDoctor(doc._id, doc.name)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-lg transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blood Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Manage Blood Stock Units</h3>
              <p className="text-xs text-slate-500">Restock units, update safety thresholds, and monitor reserve quantities</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {bloodInventory.map((item) => (
              <div
                key={item.bloodGroup}
                className={`p-5 rounded-2xl border ${
                  item.unitsAvailable <= item.criticalThreshold
                    ? 'bg-rose-50 border-rose-300'
                    : 'bg-slate-50 border-slate-200'
                } space-y-3`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-2xl font-black text-slate-900">{item.bloodGroup}</span>
                    <span className="text-[10px] text-slate-500 block">Critical Threshold: {item.criticalThreshold}</span>
                  </div>
                  <span className={`text-xl font-bold font-mono ${
                    item.unitsAvailable <= item.criticalThreshold ? 'text-rose-700' : 'text-slate-800'
                  }`}>
                    {item.unitsAvailable} <span className="text-xs font-normal">units</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                  <button
                    onClick={() => handleRestockBlood(item.bloodGroup, -1)}
                    disabled={item.unitsAvailable <= 0}
                    className="flex-1 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-700"
                  >
                    -1 Issue
                  </button>
                  <button
                    onClick={() => handleRestockBlood(item.bloodGroup, 1)}
                    className="flex-1 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-bold shadow-xs"
                  >
                    +1 Restock
                  </button>
                  <button
                    onClick={() => handleRestockBlood(item.bloodGroup, 5)}
                    className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold"
                    title="Add 5 units batch"
                  >
                    +5
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Users Directory Tab */}
      {activeTab === 'users' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">Hospital Staff & Registered Users</h3>
              <p className="text-xs text-slate-500">Manage all registered accounts across all roles</p>
            </div>
            <button
              onClick={handleOpenAddDoctor}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition"
            >
              <Plus className="w-4 h-4" /> Add Doctor
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">User Name</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">City / Info</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3 text-slate-600">{u.email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'doctor' ? 'bg-blue-100 text-blue-700' :
                        u.role === 'donor' ? 'bg-rose-100 text-rose-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{u.phone || '—'}</td>
                    <td className="p-3 text-slate-500">
                      {u.doctorProfile?.department || u.city || 'Chennai'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Feedback & Consultation Survey Tab */}
      {activeTab === 'feedback' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-lg">Patient Feedback & Consultation Surveys</h3>
              </div>
              <p className="text-xs text-slate-500">
                Live patient experience ratings, consultation survey responses, and hospital service appraisals
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-semibold flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              <select
                value={feedbackFilter.category}
                onChange={(e) => setFeedbackFilter({ ...feedbackFilter, category: e.target.value })}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
              >
                <option value="All">All Categories</option>
                <option value="OPD Consultation">OPD Consultation</option>
                <option value="Blood Bank Service">Blood Bank</option>
                <option value="Diagnostic Lab Tests">Diagnostic Lab</option>
                <option value="Staff & Nursing">Staff & Nursing</option>
                <option value="Overall Hospital Facility">Hospital Facility</option>
              </select>

              <select
                value={feedbackFilter.rating}
                onChange={(e) => setFeedbackFilter({ ...feedbackFilter, rating: e.target.value })}
                className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700"
              >
                <option value="All">All Ratings</option>
                <option value="5">⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value="4">⭐⭐⭐⭐ (4 Stars)</option>
                <option value="3">⭐⭐⭐ (3 Stars)</option>
                <option value="2">⭐⭐ (2 Stars)</option>
                <option value="1">⭐ (1 Star)</option>
              </select>
            </div>
          </div>

          {feedbacksList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No patient feedback entries recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {feedbacksList
                .filter(f => {
                  if (feedbackFilter.category !== 'All' && f.category !== feedbackFilter.category) return false;
                  if (feedbackFilter.rating !== 'All' && f.rating !== Number(feedbackFilter.rating)) return false;
                  return true;
                })
                .map((fb) => (
                  <div key={fb._id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{fb.patientName || 'Verified Patient'}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                            {fb.category}
                          </span>
                          {fb.doctorOrDepartment && (
                            <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-medium">
                              Dept: {fb.doctorOrDepartment}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Submitted on {new Date(fb.createdAt).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {[...Array(fb.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          fb.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                          fb.status === 'Reviewed' ? 'bg-blue-100 text-blue-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {fb.status}
                        </span>
                      </div>
                    </div>

                    {/* Consultation-Specific Quality Survey Breakdown */}
                    {fb.consultationQuestions && (
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-sky-900 uppercase tracking-wider block">
                          Patient Consultation Survey Answers:
                        </span>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                          <div className="bg-sky-50/60 p-2 rounded-lg border border-sky-100">
                            <span className="text-[10px] text-slate-400 block">Doctor Explanation</span>
                            <span className="font-bold text-sky-900">{fb.consultationQuestions.doctorExplanation || 'N/A'}</span>
                          </div>
                          <div className="bg-blue-50/60 p-2 rounded-lg border border-blue-100">
                            <span className="text-[10px] text-slate-400 block">Wait Time</span>
                            <span className="font-bold text-blue-900">{fb.consultationQuestions.waitTimeSatisfaction || 'N/A'}</span>
                          </div>
                          <div className="bg-purple-50/60 p-2 rounded-lg border border-purple-100">
                            <span className="text-[10px] text-slate-400 block">Staff Courtesy</span>
                            <span className="font-bold text-purple-900">{fb.consultationQuestions.staffCourteousness || 'N/A'}</span>
                          </div>
                          <div className="bg-emerald-50/60 p-2 rounded-lg border border-emerald-100">
                            <span className="text-[10px] text-slate-400 block">Cleanliness</span>
                            <span className="font-bold text-emerald-900">{fb.consultationQuestions.cleanlinessRating || 'N/A'}</span>
                          </div>
                          <div className="bg-rose-50/60 p-2 rounded-lg border border-rose-100">
                            <span className="text-[10px] text-slate-400 block">Recommend</span>
                            <span className="font-bold text-rose-900">{fb.consultationQuestions.wouldRecommend || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs text-slate-700">
                      <strong className="text-slate-900 block mb-1">Patient Comments:</strong>
                      <p className="italic leading-relaxed">"{fb.comments}"</p>
                    </div>

                    {/* Admin Response */}
                    {fb.adminReply ? (
                      <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 text-xs text-purple-950">
                        <strong className="text-purple-900 block mb-0.5">Admin Response Dispatched:</strong>
                        <p>{fb.adminReply}</p>
                      </div>
                    ) : (
                      <div className="pt-2 flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                        <input
                          type="text"
                          placeholder="Type hospital administration reply to patient..."
                          value={feedbackReplyText[fb._id] || ''}
                          onChange={(e) => setFeedbackReplyText({ ...feedbackReplyText, [fb._id]: e.target.value })}
                          className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => handleUpdateFeedbackStatus(fb._id, 'Resolved', feedbackReplyText[fb._id])}
                          className="bg-purple-700 hover:bg-purple-600 text-white font-bold px-3.5 py-2 rounded-xl text-xs shadow-xs transition flex items-center gap-1.5 flex-shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Reply & Mark Resolved</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Diagnostic Lab Catalog Tab (Admin can add new lab tests based on requirement) */}
      {activeTab === 'lab-tests' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-lg">Hospital Diagnostic Laboratory Catalog</h3>
              </div>
              <p className="text-xs text-slate-500">
                Manage medical laboratory investigations, configure turnaround times, sample requirements & provision new clinical tests
              </p>
            </div>

            <button
              onClick={() => setShowAddLabTestModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add New Lab Test</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Total Active Tests</span>
              <div className="text-2xl font-black text-emerald-950 mt-1">{labTestsList.length}</div>
              <span className="text-[10px] text-emerald-600">Available in hospital lab</span>
            </div>
            <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200">
              <span className="text-[10px] uppercase font-bold text-sky-800 tracking-wider">Home Collection</span>
              <div className="text-2xl font-black text-sky-950 mt-1">
                {labTestsList.filter(t => t.isHomeSampleAvailable).length}
              </div>
              <span className="text-[10px] text-sky-600">Phlebotomy doorstep service</span>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Fasting Tests</span>
              <div className="text-2xl font-black text-amber-950 mt-1">
                {labTestsList.filter(t => t.fastingRequired).length}
              </div>
              <span className="text-[10px] text-amber-600">Pre-test fasting protocol</span>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
              <span className="text-[10px] uppercase font-bold text-purple-800 tracking-wider">Categories</span>
              <div className="text-2xl font-black text-purple-950 mt-1">5</div>
              <span className="text-[10px] text-purple-600">Pathology, Radiology, Bio, etc.</span>
            </div>
          </div>

          {/* Tests Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Test Name & Code</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Sample Type</th>
                  <th className="p-3">Fasting</th>
                  <th className="p-3">Turnaround</th>
                  <th className="p-3">Daily Capacity</th>
                  <th className="p-3">Home Sample</th>
                  <th className="p-3 text-right">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {labTestsList.map((test) => (
                  <tr key={test._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                          <FlaskConical className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div>{test.name}</div>
                          <span className="text-[10px] font-mono text-slate-400">{test.code}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                        {test.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{test.sampleType || 'Blood'}</td>
                    <td className="p-3">
                      {test.fastingRequired ? (
                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          Required
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">No</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-700 font-medium">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {test.turnaroundHours || 24} hrs
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-mono font-semibold">
                      {test.dailyCapacity || 30} slots/day
                    </td>
                    <td className="p-3">
                      {test.isHomeSampleAvailable ? (
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">
                          Available
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded text-[10px]">
                          In-Lab Only
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 text-sm">
                      ₹{test.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Donors Directory Tab (Admin can see old user & new user details) */}
      {activeTab === 'donors' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600 fill-rose-500" />
                <h3 className="font-bold text-slate-900 text-lg">Voluntary Blood Donors Repository</h3>
              </div>
              <p className="text-xs text-slate-500">
                Full registry of registered donors, eligibility countdowns, contact details, and clinical health history
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-full">
                {donorsList.length} Registered Donors
              </span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full">
                {donorsList.filter(d => d.isEligible).length} Eligible Now
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Donor Name</th>
                  <th className="p-3">Blood Group</th>
                  <th className="p-3">Age / Gender</th>
                  <th className="p-3">Phone & Email</th>
                  <th className="p-3">Location / City</th>
                  <th className="p-3">Eligibility Status</th>
                  <th className="p-3">Total Donations</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donorsList.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      No blood donors registered in the portal yet.
                    </td>
                  </tr>
                ) : (
                  donorsList.map((donor) => (
                    <tr key={donor._id} className="hover:bg-slate-50">
                      <td className="p-3 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-[11px]">
                            {donor.name.charAt(0)}
                          </div>
                          <div>
                            <div>{donor.name}</div>
                            <span className="text-[10px] text-slate-400">Reg: {new Date(donor.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="bg-rose-100 text-rose-800 font-extrabold px-2.5 py-1 rounded-md font-mono text-xs">
                          {donor.bloodGroup}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700">
                        {donor.age} Yrs / {donor.gender || 'Male'}
                        <span className="block text-[10px] text-slate-400">{donor.weightKg || 65} kg</span>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div className="font-semibold">{donor.phone}</div>
                        <div className="text-[11px] text-slate-500">{donor.email || '—'}</div>
                      </td>
                      <td className="p-3 text-slate-700">
                        <div className="font-semibold">{donor.city}</div>
                        <div className="text-[11px] text-slate-400">{donor.locationArea || donor.address || 'Central'}</div>
                      </td>
                      <td className="p-3">
                        {donor.isEligible ? (
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            Eligible
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            Wait ({donor.daysRemaining || 0}d)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-slate-800 font-mono font-bold">
                        {donor.donationHistory?.length || 0} times
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setSelectedDonorDetail(donor)}
                          className="inline-flex items-center gap-1 text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-lg text-[11px] font-bold transition"
                        >
                          <Eye className="w-3 h-3" /> View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Patient Feedback Management Tab (Admin can see all patient feedback) */}
      {activeTab === 'feedback' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-lg">Patient Experience & Quality Feedbacks</h3>
              </div>
              <p className="text-xs text-slate-500">
                Review ratings, comments, departmental remarks, and provide administrative responses
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                {feedbacksList.length} Feedbacks Received
              </span>
            </div>
          </div>

          {feedbacksList.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No patient feedback submitted yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {feedbacksList.map((fb) => (
                <div key={fb._id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{fb.patientName}</h4>
                        <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded font-bold">
                          {fb.category}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Dept/Doctor: <strong>{fb.doctorOrDepartment || 'Hospital'}</strong> • {new Date(fb.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < fb.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="text-[11px] font-bold text-amber-900 ml-1">{fb.rating}/5</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200 italic">
                    "{fb.comments}"
                  </p>

                  {fb.adminReply && (
                    <div className="bg-purple-50 p-2.5 rounded-xl border border-purple-200 text-xs">
                      <span className="font-bold text-purple-900 block text-[10px] uppercase">Admin Response:</span>
                      <p className="text-purple-800 mt-0.5">{fb.adminReply}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="text"
                      placeholder="Type admin reply..."
                      value={feedbackReplyText[fb._id] !== undefined ? feedbackReplyText[fb._id] : (fb.adminReply || '')}
                      onChange={(e) => setFeedbackReplyText({ ...feedbackReplyText, [fb._id]: e.target.value })}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <button
                      onClick={() => handleUpdateFeedbackStatus(fb._id, 'Reviewed', feedbackReplyText[fb._id] || fb.adminReply || '')}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                    >
                      Reply / Review
                    </button>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
                      fb.status === 'Reviewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {fb.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Selected Donor Full Details Modal for Admin */}
      {selectedDonorDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-600 fill-rose-500" />
                <h3 className="font-bold text-lg text-slate-900">
                  Donor Full Profile & Medical Records
                </h3>
              </div>
              <button
                onClick={() => setSelectedDonorDetail(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block font-semibold">Donor Name</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedDonorDetail.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Blood Group</span>
                  <span className="font-extrabold text-rose-700 text-base font-mono">{selectedDonorDetail.bloodGroup}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Phone</span>
                  <span className="font-semibold text-slate-800">{selectedDonorDetail.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Email</span>
                  <span className="font-semibold text-slate-800">{selectedDonorDetail.email || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">City & Address</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDonorDetail.city} ({selectedDonorDetail.locationArea || selectedDonorDetail.address || 'Central'})
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Age / Gender / Weight</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDonorDetail.age} Yrs / {selectedDonorDetail.gender || 'Male'} / {selectedDonorDetail.weightKg || 65} kg
                  </span>
                </div>
              </div>

              {/* Medical History Section */}
              <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-200 space-y-2">
                <h4 className="font-bold text-rose-950 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-rose-600" />
                  Clinical & Medical History:
                </h4>
                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    <span>Chronic Condition: </span>
                    <strong>{selectedDonorDetail.medicalHistory?.hasChronicDiseases ? 'Yes (Reported)' : 'None reported'}</strong>
                  </div>
                  <div>
                    <span>Recent Surgery: </span>
                    <strong>{selectedDonorDetail.medicalHistory?.hadRecentSurgery ? 'Yes' : 'No'}</strong>
                  </div>
                  <div>
                    <span>Tattoo / Piercing: </span>
                    <strong>{selectedDonorDetail.medicalHistory?.hadTattooRecently ? 'Yes (Past 6m)' : 'No'}</strong>
                  </div>
                  <div>
                    <span>Hemoglobin Level: </span>
                    <strong>{selectedDonorDetail.medicalHistory?.hemoglobinLevel || 13.5} g/dL</strong>
                  </div>
                </div>
                {selectedDonorDetail.medicalHistory?.notes && (
                  <p className="text-slate-600 text-[11px] pt-1">
                    Notes: {selectedDonorDetail.medicalHistory.notes}
                  </p>
                )}
              </div>

              {/* Donation History */}
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2">
                <h4 className="font-bold text-slate-900">Donation History ({selectedDonorDetail.donationHistory?.length || 0} times)</h4>
                {selectedDonorDetail.donationHistory?.length ? (
                  <div className="space-y-1 max-h-36 overflow-y-auto">
                    {selectedDonorDetail.donationHistory.map((dh, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px] bg-slate-50 p-2 rounded-lg">
                        <span>{new Date(dh.donationDate).toLocaleDateString()} - {dh.hospitalName || 'MEDCARE HOSPITAL'}</span>
                        <span className="font-mono font-bold text-rose-700">{dh.units || 1} unit(s)</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-[11px]">No prior donations recorded yet.</p>
                )}
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setSelectedDonorDetail(null)}
                className="bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Add / Edit Doctor Modal */}
      {showDoctorModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 space-y-5 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-lg text-slate-900">
                  {editingDoctor ? `Edit Doctor Details (${doctorForm.name})` : 'Enter Doctor Details (Admin Credentialing)'}
                </h3>
              </div>
              <button
                onClick={() => setShowDoctorModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">
              {/* Doctor Basic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doctor Full Name *</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    placeholder="e.g. Dr. Ramesh Gupta"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Doctor Email Address *</label>
                  <input
                    type="email"
                    required
                    disabled={Boolean(editingDoctor)}
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    placeholder="doctor@medcare.com"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>
              </div>

              {!editingDoctor && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Initial Login Password *</label>
                    <input
                      type="password"
                      required
                      value={doctorForm.password}
                      onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                      placeholder="Doctor@123"
                      className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="tel"
                      value={doctorForm.phone}
                      onChange={(e) => setDoctorForm({ ...doctorForm, phone: e.target.value })}
                      placeholder="+91 98401 22334"
                      className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Department & Specialization */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clinical Department *</label>
                  <select
                    value={doctorForm.department}
                    onChange={(e) => setDoctorForm({ ...doctorForm, department: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {departments.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Medical Specialization / Qualifications</label>
                  <input
                    type="text"
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    placeholder="e.g. Senior Interventional Cardiologist (MD, DM)"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Experience, Fee, Room No, Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Experience (Yrs)</label>
                  <input
                    type="number"
                    min={1}
                    value={doctorForm.experienceYears}
                    onChange={(e) => setDoctorForm({ ...doctorForm, experienceYears: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">OPD Fee (₹)</label>
                  <input
                    type="number"
                    min={100}
                    step={50}
                    value={doctorForm.consultationFee}
                    onChange={(e) => setDoctorForm({ ...doctorForm, consultationFee: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">OPD Room No</label>
                  <input
                    type="text"
                    value={doctorForm.roomNumber}
                    onChange={(e) => setDoctorForm({ ...doctorForm, roomNumber: e.target.value })}
                    placeholder="OPD-105"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Live Status</label>
                  <select
                    value={doctorForm.availabilityStatus}
                    onChange={(e) => setDoctorForm({ ...doctorForm, availabilityStatus: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Available">Available 🟢</option>
                    <option value="In Consultation">In Consultation 🔵</option>
                    <option value="On Leave">On Leave 🟡</option>
                  </select>
                </div>
              </div>

              {/* Consultation Days */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
                <label className="block font-bold text-slate-700">Available Consultation Days:</label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => {
                    const isSelected = doctorForm.availableDays?.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const current = doctorForm.availableDays || [];
                          const updated = isSelected
                            ? current.filter(d => d !== day)
                            : [...current, day];
                          setDoctorForm({ ...doctorForm, availableDays: updated });
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                          isSelected
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md transition"
                >
                  {editingDoctor ? 'Save Changes' : 'Save & Provision Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Lab Test Modal */}
      {showAddLabTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border border-slate-200 space-y-5 my-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-lg text-slate-900">Add New Diagnostic Lab Test</h3>
              </div>
              <button
                onClick={() => setShowAddLabTestModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLabTest} className="space-y-4 text-xs">
              {/* Name & Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Test Name *</label>
                  <input
                    type="text"
                    required
                    value={newLabTestForm.name}
                    onChange={(e) => setNewLabTestForm({ ...newLabTestForm, name: e.target.value })}
                    placeholder="e.g. Thyroid Profile Total (T3, T4, TSH)"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unique Test Code *</label>
                  <input
                    type="text"
                    required
                    value={newLabTestForm.code}
                    onChange={(e) => setNewLabTestForm({ ...newLabTestForm, code: e.target.value })}
                    placeholder="e.g. THY-01"
                    className="w-full p-2.5 bg-slate-50 border rounded-xl uppercase font-mono font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Category, Sample Type & Price */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category / Discipline *</label>
                  <select
                    value={newLabTestForm.category}
                    onChange={(e) => setNewLabTestForm({ ...newLabTestForm, category: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Pathology">Pathology</option>
                    <option value="Biochemistry">Biochemistry</option>
                    <option value="Radiology">Radiology / Imaging</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Microbiology">Microbiology</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sample Type *</label>
                  <select
                    value={newLabTestForm.sampleType}
                    onChange={(e) => setNewLabTestForm({ ...newLabTestForm, sampleType: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-semibold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Blood">Blood (Serum / Plasma)</option>
                    <option value="Urine">Urine</option>
                    <option value="Saliva / Swab">Saliva / Swab</option>
                    <option value="Imaging Scan">Imaging Scan (X-Ray / MRI / USG)</option>
                    <option value="Tissue / Biopsy">Tissue / Biopsy</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Test Price (₹) *</label>
                  <input
                    type="number"
                    min={50}
                    step={10}
                    required
                    value={newLabTestForm.price}
                    onChange={(e) => setNewLabTestForm({ ...newLabTestForm, price: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl font-bold outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Turnaround, Daily Capacity, Toggles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Turnaround (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    value={newLabTestForm.turnaroundHours}
                    onChange={(e) => setNewLabTestForm({ ...newLabTestForm, turnaroundHours: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Daily Slot Capacity</label>
                  <input
                    type="number"
                    min={5}
                    value={newLabTestForm.dailyCapacity}
                    onChange={(e) => setNewLabTestForm({ ...newLabTestForm, dailyCapacity: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div className="flex flex-col justify-center">
                  <label className="block font-bold text-slate-700 mb-1">Fasting Required?</label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1 font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newLabTestForm.fastingRequired}
                      onChange={(e) => setNewLabTestForm({ ...newLabTestForm, fastingRequired: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Yes, Fasting</span>
                  </label>
                </div>
                <div className="flex flex-col justify-center">
                  <label className="block font-bold text-slate-700 mb-1">Home Collection?</label>
                  <label className="flex items-center gap-2 cursor-pointer mt-1 font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={newLabTestForm.isHomeSampleAvailable}
                      onChange={(e) => setNewLabTestForm({ ...newLabTestForm, isHomeSampleAvailable: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <span>Available</span>
                  </label>
                </div>
              </div>

              {/* Preparation Instructions */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Preparation Instructions for Patient</label>
                <input
                  type="text"
                  value={newLabTestForm.preparationInstructions}
                  onChange={(e) => setNewLabTestForm({ ...newLabTestForm, preparationInstructions: e.target.value })}
                  placeholder="e.g. 10-12 hours overnight fasting required. Water intake allowed."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Symptom Keywords for AI Matching */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Recommended for Symptoms (Comma Separated)</label>
                <input
                  type="text"
                  value={newLabTestForm.recommendedForSymptoms}
                  onChange={(e) => setNewLabTestForm({ ...newLabTestForm, recommendedForSymptoms: e.target.value })}
                  placeholder="e.g. fatigue, hair loss, weight change, thyroid, weakness"
                  className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Clinical Description & Scope</label>
                <textarea
                  rows={2}
                  value={newLabTestForm.description}
                  onChange={(e) => setNewLabTestForm({ ...newLabTestForm, description: e.target.value })}
                  placeholder="Clinical purpose of test, diagnostic markers evaluated..."
                  className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddLabTestModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingLabTest}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>{savingLabTest ? 'Adding to Catalog...' : 'Save & Publish Lab Test'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
