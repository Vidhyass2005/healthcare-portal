import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const demoAccounts = {
  admin: {
    email: 'admin@hospital.com',
    password: 'Admin@123',
    name: 'Dr. Arthur Campbell (Chief Admin)',
    role: 'admin'
  },
  doctor: {
    email: 'priya.cardio@hospital.com',
    password: 'Doctor@123',
    name: 'Dr. Priya Sharma',
    role: 'doctor',
    department: 'Cardiology'
  },
  patient: {
    email: 'ramesh@gmail.com',
    password: 'Patient@123',
    name: 'Ramesh Kumar (High Priority)',
    role: 'patient'
  },
  donor: {
    email: 'anand.donor@gmail.com',
    password: 'Donor@123',
    name: 'Anand V (O- Universal Donor)',
    role: 'donor'
  }
};

export const AuthProvider = ({ children }) => {
  // Use sessionStorage so that whenever a user opens the portal freshly in a new tab/session,
  // it shows the Login / Register screen rather than auto-jumping into the previous dashboard
  const [user, setUser] = useState(() => {
    // Clear persistent localStorage auth if any exists from past sessions
    try {
      localStorage.removeItem('care_auth_token');
      localStorage.removeItem('care_auth_user');
    } catch (_) {}
    const saved = sessionStorage.getItem('care_auth_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = sessionStorage.getItem('care_auth_token');
      if (token) {
        try {
          const res = await authService.getMe();
          setUser(res.data.user);
          sessionStorage.setItem('care_auth_user', JSON.stringify(res.data.user));
        } catch (error) {
          console.error('Session expired:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login({ email, password });
    const { token, user } = res.data;
    sessionStorage.setItem('care_auth_token', token);
    sessionStorage.setItem('care_auth_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    const { token, user } = res.data;
    sessionStorage.setItem('care_auth_token', token);
    sessionStorage.setItem('care_auth_user', JSON.stringify(user));
    setUser(user);
    return user;
  };

  const loginDemo = async (roleKey) => {
    const creds = demoAccounts[roleKey];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('care_auth_token');
    sessionStorage.removeItem('care_auth_user');
    localStorage.removeItem('care_auth_token');
    localStorage.removeItem('care_auth_user');
    setUser(null);
  };

  const reloadProfile = async () => {
    try {
      const res = await authService.getMe();
      setUser(res.data.user);
      sessionStorage.setItem('care_auth_user', JSON.stringify(res.data.user));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginDemo, logout, reloadProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
