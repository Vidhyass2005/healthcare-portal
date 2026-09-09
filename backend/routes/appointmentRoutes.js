const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getMyAppointments,
  getDoctorSlots,
  rescheduleAppointment,
  cancelAppointment,
  updateAppointmentStatus,
  getAppointmentById,
  getMyMedicalHistory
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, bookAppointment);
router.get('/', protect, getMyAppointments);
router.get('/my-medical-history', protect, getMyMedicalHistory);
router.get('/slots/:doctorId', getDoctorSlots);
router.get('/:id', protect, getAppointmentById);
router.put('/:id/reschedule', protect, rescheduleAppointment);
router.put('/:id/cancel', protect, cancelAppointment);
router.put('/:id/status', protect, authorize('doctor', 'admin'), updateAppointmentStatus);

module.exports = router;
