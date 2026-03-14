```javascript
/**
 * @file Defines API routes for messages (can also be handled via Socket.IO).
 * @module routes/messageRoutes
 */

const express = require('express');
const messageController = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Send and retrieve chat messages (REST alternative/fallback)
 */

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a new message to a chat room (REST)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roomId
 *               - content
 *             properties:
 *               roomId:
 *                 type: string
 *                 format: uuid
 *                 description: The ID of the room to send the message to
 *                 example: '123e4567-e89b-12d3-a456-426614174000'
 *               content:
 *                 type: string
 *                 description: The message content (1-5000 characters)
 *                 example: Hello everyone in this room!
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 message:
 *                   $ref: '#/components/schemas/MessageOutput'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', protect, messageController.sendMessage);

// This route is redundant if roomRoutes handles /api/rooms/:roomId/messages,
// but kept for demonstrating message-specific routes if needed.
// router.get('/:roomId', protect, messageController.getRoomMessages);

module.exports = router;
```