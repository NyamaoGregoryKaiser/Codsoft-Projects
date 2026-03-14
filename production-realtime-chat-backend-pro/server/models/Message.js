```javascript
const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.ObjectId,
    ref: 'Room',
    required: true
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Message cannot be empty'],
    trim: true,
    maxlength: [1000, 'Message content cannot exceed 1000 characters']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Add an index to improve query performance for messages in a room
MessageSchema.index({ room: 1, timestamp: -1 });

module.exports = mongoose.model('Message', MessageSchema);
```