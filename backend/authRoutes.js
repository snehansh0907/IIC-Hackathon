const express = require('express');
const router = express.Router();
const { signup, login, getMe, getDemoSession } = require('./authController');
const { authMiddleware } = require('./authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.get('/demo', getDemoSession);

module.exports = router;
