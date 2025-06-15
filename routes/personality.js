const express = require('express');
const router = express.Router();
const personalityController = require('../controllers/personality');
const verifyToken = require('../middleware/authMiddleware'); // ✅ ekle

router.post('/submit', verifyToken, personalityController.submitPersonality); // ✅ middleware uygula

module.exports = router;
