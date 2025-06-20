const express = require('express');
const router = express.Router();
const { handleChatQuery } = require('../controllers/chatController');

router.post('/chat', handleChatQuery); // Định tuyến POST /api/chat

module.exports = router;
