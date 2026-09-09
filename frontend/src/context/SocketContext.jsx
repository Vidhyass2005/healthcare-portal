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

    // Listen for global notifications and emergency broadcasts
    newSocket.on('new_notification', (notification) => {
      setActiveAlerts(prev => [notification, ...prev]);
    });

    newSocket.on('emergency_blood_broadcast', (request) => {
      const alertItem = {
        id: Date.now(),
        title: `CRITICAL BLOOD ALERT: ${request.bloodGroup}`,
        message: `${request.unitsRequired} units needed urgently at ${request.hospitalName}, ${request.city}!`,
        type: 'emergency_blood',
        priority: 'emergency',
        data: request,
        createdAt: new Date()
      };
      setActiveAlerts(prev => [alertItem, ...prev]);
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
      socket.emit('join_room', `user_${user.id || user._id}`);
      if (user.role === 'doctor') {
        socket.emit('join_room', `doctor_${user.id || user._id}`);
      } else if (user.role === 'donor') {
        socket.emit('join_room', 'donors');
      } else if (user.role === 'admin') {
        socket.emit('join_room', 'admins');
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
