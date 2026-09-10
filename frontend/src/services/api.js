import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to all outgoing requests
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('care_auth_token') || localStorage.getItem('care_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor for 401 handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired, clear local storage
      // Only redirect if not already on login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('care_auth_token');
        localStorage.removeItem('care_auth_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth Services
export const authService = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  getDoctors: (department) => api.get('/auth/doctors', { params: { department } }),
  updateProfile: (data) => api.put('/auth/profile', data)
};

// Appointment Services
export const appointmentService = {
  book: (data) => api.post('/appointments', data),
  getMy: (params) => api.get('/appointments', { params }),
  getMyMedicalHistory: () => api.get('/appointments/my-medical-history'),
  getSlots: (doctorId, date) => api.get(`/appointments/slots/${doctorId}`, { params: { date } }),
  getById: (id) => api.get(`/appointments/${id}`),
  reschedule: (id, data) => api.put(`/appointments/${id}/reschedule`, data),
  cancel: (id, data) => api.put(`/appointments/${id}/cancel`, data),
  updateStatus: (id, data) => api.put(`/appointments/${id}/status`, data)
};

// Priority & Queue Services
export const priorityService = {
  calculatePreview: (data) => api.post('/priority/calculate', data),
  getDoctorQueue: (doctorId, date) => api.get(`/priority/queue/${doctorId}`, { params: { date } }),
  emergencyOverride: (appointmentId, data) => api.post(`/priority/emergency-override/${appointmentId}`, data),
  getPatientStatus: (appointmentId) => api.get(`/priority/patient-status/${appointmentId}`)
};

// Blood Portal Services
export const bloodService = {
  getInventory: () => api.get('/blood/inventory'),
  updateInventory: (bloodGroup, data) => api.put(`/blood/inventory/${bloodGroup}`, data),
  checkEligibility: (donorId) => api.get(`/blood/eligibility/${donorId}`),
  createRequest: (data) => api.post('/blood/request', data),
  getRequests: (params) => api.get('/blood/requests', { params }),
  matchDonors: (params) => api.get('/blood/match-donors', { params }),
  recordDonation: (data) => api.post('/blood/record-donation', data),
  registerDonor: (data) => api.post('/blood/register-donor', data),
  getAllDonorsAdmin: (params) => api.get('/blood/donors/admin', { params })
};

// Lab Services
export const labService = {
  getTests: (params) => api.get('/lab/tests', { params }),
  createTest: (data) => api.post('/lab/tests', data),
  bookTest: (data) => api.post('/lab/book', data),
  getBookings: (params) => api.get('/lab/bookings', { params }),
  updateStatus: (id, data) => api.put(`/lab/bookings/${id}/status`, data),
  recommendTests: (symptoms) => api.post('/lab/recommend', { symptoms })
};

// Doctor Services
export const doctorService = {
  getDashboard: () => api.get('/doctor/dashboard'),
  updateAvailability: (data) => api.put('/doctor/availability', typeof data === 'string' ? { availabilityStatus: data } : data),
  getPatientHistory: (patientId) => api.get(`/doctor/patient-history/${patientId}`),
  requestEmergencyBlood: (data) => api.post('/doctor/emergency-blood-request', data),
  createReferral: (data) => api.post('/doctor/referral', data),
  updatePatientAlerts: (patientId, data) => api.put(`/doctor/patient-alerts/${patientId}`, data)
};

// Admin Services
export const adminService = {
  getAnalytics: () => api.get('/admin/analytics'),
  getUsers: (role) => api.get('/admin/users', { params: { role } }),
  createDoctor: (data) => api.post('/admin/doctors', data),
  updateDoctor: (id, data) => api.put(`/admin/doctors/${id}`, data),
  deleteDoctor: (id) => api.delete(`/admin/doctors/${id}`)
};

// Feedback Services
export const feedbackService = {
  create: (data) => api.post('/feedback', data),
  getMy: () => api.get('/feedback/my'),
  getAllAdmin: (params) => api.get('/feedback/admin', { params }),
  updateStatus: (id, data) => api.put(`/feedback/${id}`, data)
};

// Notification Services
export const notificationService = {
  getMy: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all')
};

export default api;
