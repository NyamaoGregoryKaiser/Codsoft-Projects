```javascript
const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a room name'],
    unique: true,
    trim: true,
    maxlength: [50, 'Room name can not be more than 50 characters']
  },
  isPrivate: {
    type: Boolean,
    default: false
  },
  members: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Room', RoomSchema);
```