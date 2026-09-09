let ioInstance = null;

const initSocket = (io) => {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Join room based on user role or specific user ID
    socket.on('join_room', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    socket.on('leave_room', (room) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
};

const getIO = () => {
  return ioInstance;
};

// Emit real-time queue position updates
const emitQueueUpdate = (doctorId, data) => {
  if (ioInstance) {
    ioInstance.to(`doctor_${doctorId}`).emit('queue_updated', data);
    ioInstance.emit('global_queue_updated', data);
  }
};

// Emit emergency blood broadcast to donor community and admins
const emitEmergencyBloodAlert = (bloodRequest) => {
  if (ioInstance) {
    ioInstance.to('donors').emit('emergency_blood_broadcast', bloodRequest);
    ioInstance.to('admins').emit('emergency_blood_broadcast', bloodRequest);
    ioInstance.emit('new_notification', {
      title: `EMERGENCY: ${bloodRequest.bloodGroup} Blood Required!`,
      message: `${bloodRequest.unitsRequired} units needed urgently at ${bloodRequest.hospitalName}, ${bloodRequest.city}.`,
      type: 'emergency_blood',
      priority: 'emergency',
      data: bloodRequest
    });
  }
};

// Emit real-time appointment status update
const emitAppointmentUpdate = (userId, appointment) => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit('appointment_status_changed', appointment);
    ioInstance.emit('slot_availability_changed', {
      doctorId: appointment.doctor,
      date: appointment.appointmentDate,
      slotTime: appointment.slotTime,
      status: appointment.status
    });
  }
};

// Emit lab report ready event
const emitLabReportReady = (userId, labBooking) => {
  if (ioInstance) {
    ioInstance.to(`user_${userId}`).emit('lab_report_ready', labBooking);
    ioInstance.emit('new_notification', {
      recipient: userId,
      title: 'Lab Report Ready for Download',
      message: `Your test results for ${labBooking.testName} are now ready.`,
      type: 'lab_report_ready',
      priority: 'medium',
      data: labBooking
    });
  }
};

module.exports = {
  initSocket,
  getIO,
  emitQueueUpdate,
  emitEmergencyBloodAlert,
  emitAppointmentUpdate,
  emitLabReportReady
};
