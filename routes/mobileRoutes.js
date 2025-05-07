const express = require('express');
const router = express.Router();
const getBedsForCaregiver = require('../controllers/getBeds');
const getBedDetails = require('../controllers/details');
const getAlertsForCaregiver = require('../controllers/getAlert');
const protect = require('../middlewares/auth.middleware');

router.get('/beds/caregiver/:caregiverId', protect, getBedsForCaregiver);
router.get('/beds/:macAddress/details', protect, getBedDetails);
router.get('/alerts/caregiver/:caregiverId', protect, getAlertsForCaregiver);

module.exports = router;