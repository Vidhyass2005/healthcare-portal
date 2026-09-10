import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { EmergencyAlertModal } from './components/EmergencyAlertModal';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PatientDashboard } from './pages/PatientDashboard';
import { DoctorDashboard } from './pages/DoctorDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { DonorDashboard } from './pages/DonorDashboard';
import { BookAppointmentPage } from './pages/BookAppointmentPage';
import { BookLabTestPage } from './pages/BookLabTestPage';
import { BloodPortalPage } from './pages/BloodPortalPage';
import { QueueTrackerPage } from './pages/QueueTrackerPage';

export function App() {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState(() => window.location.pathname || '/');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigate = (path) => {
    setCurrentPath(path);
    window.history.pushState({}, '', path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // If user is not logged in, enforce Login / Signup first
  const renderCurrentPage = () => {
    const cleanPath = currentPath.split('?')[0];
    const queryParams = new URLSearchParams(currentPath.includes('?') ? currentPath.split('?')[1] : '');
    const queryRole = queryParams.get('role') || 'patient';

    if (!user) {
      if (cleanPath === '/register') {
        return <RegisterPage onNavigate={navigate} />;
      }
      return <LoginPage onNavigate={navigate} initialRole={queryRole} />;
    }

    // Authenticated routes
    switch (cleanPath) {
      case '/':
        if (user.role === 'admin') return <AdminDashboard onNavigate={navigate} />;
        if (user.role === 'doctor') return <DoctorDashboard onNavigate={navigate} />;
        if (user.role === 'donor') return <DonorDashboard onNavigate={navigate} />;
        return <PatientDashboard onNavigate={navigate} />;
      case '/login':
        if (user.role === 'admin') return <AdminDashboard onNavigate={navigate} />;
        if (user.role === 'doctor') return <DoctorDashboard onNavigate={navigate} />;
        if (user.role === 'donor') return <DonorDashboard onNavigate={navigate} />;
        return <PatientDashboard onNavigate={navigate} />;
      case '/register':
        if (user.role === 'admin') return <AdminDashboard onNavigate={navigate} />;
        if (user.role === 'doctor') return <DoctorDashboard onNavigate={navigate} />;
        if (user.role === 'donor') return <DonorDashboard onNavigate={navigate} />;
        return <PatientDashboard onNavigate={navigate} />;
      case '/patient-dashboard':
        return <PatientDashboard onNavigate={navigate} />;
      case '/doctor-dashboard':
        return <DoctorDashboard onNavigate={navigate} />;
      case '/admin-dashboard':
        return <AdminDashboard onNavigate={navigate} />;
      case '/donor-dashboard':
        return <DonorDashboard onNavigate={navigate} />;
      case '/book-appointment':
        if (user.role === 'admin') return <AdminDashboard onNavigate={navigate} />;
        if (user.role === 'doctor') return <DoctorDashboard onNavigate={navigate} />;
        return <BookAppointmentPage onNavigate={navigate} />;
      case '/lab-tests':
        if (user.role === 'admin') return <AdminDashboard onNavigate={navigate} />;
        if (user.role === 'doctor') return <DoctorDashboard onNavigate={navigate} />;
        return <BookLabTestPage onNavigate={navigate} />;
      case '/blood-bank':
        return <BloodPortalPage onNavigate={navigate} />;
      case '/queue-tracker':
        return <QueueTrackerPage onNavigate={navigate} />;
      default:
        if (user.role === 'admin') return <AdminDashboard onNavigate={navigate} />;
        if (user.role === 'doctor') return <DoctorDashboard onNavigate={navigate} />;
        if (user.role === 'donor') return <DonorDashboard onNavigate={navigate} />;
        return <PatientDashboard onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar only for authenticated users */}
        {user && (
          <Sidebar
            currentPath={currentPath}
            onNavigate={navigate}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}

        {/* Content View */}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 min-w-0 ${!user ? 'flex items-center justify-center' : ''}`}>
          {renderCurrentPage()}
        </main>
      </div>

      {/* Floating Emergency Toast Alert */}
      <EmergencyAlertModal />
    </div>
  );
}

export default App;
