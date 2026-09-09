const express = require('express');
const router = express.Router();
const {
  getBloodInventory,
  updateBloodInventory,
  checkEligibility,
  createBloodRequest,
  getBloodRequests,
  matchDonors,
  recordDonation,
  registerBloodDonor,
  getAllDonorsAdmin
} = require('../controllers/bloodController');
const { protect, authorize } = require('../middleware/auth');

router.get('/inventory', getBloodInventory);
router.put('/inventory/:bloodGroup', protect, authorize('admin', 'doctor'), updateBloodInventory);
router.get('/eligibility/:donorId', checkEligibility);
router.post('/request', protect, createBloodRequest);
router.get('/requests', getBloodRequests);
router.get('/match-donors', matchDonors);
router.post('/record-donation', protect, authorize('admin', 'doctor'), recordDonation);
router.post('/register-donor', registerBloodDonor);
router.get('/donors/admin', protect, authorize('admin'), getAllDonorsAdmin);

module.exports = router;
