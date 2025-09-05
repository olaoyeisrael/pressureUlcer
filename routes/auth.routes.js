const express = require('express');
const router = express.Router();
const { register, login, getProfile, refresh, verifyOTP } = require('../controllers/auth.controller');
const protect = require('../middlewares/auth.middleware');

router.post('/register', register);
router.post('/verify-otp', verifyOTP);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.post('/refresh', refresh);

module.exports = router;