import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [latestQueueUpdate, setLatestQueueUpdate] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(window.location.origin.includes('5173') ? 'http://localhost:5000' : '/', {
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to real-time socket server:', newSocket.id);
    });

    // Listen for global and role-specific notifications
    newSocket.on('new_notification', (notification) => {
      setActiveAlerts(prev => [notification, ...prev]);
    });

    newSocket.on('global_notification', (notification) => {
      setActiveAlerts(prev => [notification, ...prev]);
    });

    newSocket.on('queue_updated', (data) => {
      setLatestQueueUpdate(data);
    });

    newSocket.on('global_queue_updated', (data) => {
      setLatestQueueUpdate(data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Join rooms when user changes
  useEffect(() => {
    if (socket && user) {
      const uid = user.id || user._id;
      socket.emit('join_room', `user_${uid}`);
      if (user.role) {
        socket.emit('join_room', `role_${user.role}`);
      }
      if (user.role === 'doctor') {
        socket.emit('join_room', `doctor_${uid}`);
      }
    }
  }, [socket, user]);

  const dismissAlert = (index) => {
    setActiveAlerts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <SocketContext.Provider value={{ socket, activeAlerts, latestQueueUpdate, dismissAlert }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
