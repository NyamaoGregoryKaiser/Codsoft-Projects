```javascript
const express = require('express');
const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  addMember,
  removeMember
} = require('../controllers/roomController');
const { protect } = require('../middleware/auth');
const router = express.Router();

// All room routes are protected
router.use(protect);

router.route('/')
  .get(getRooms)
  .post(createRoom);

router.route('/:id')
  .get(getRoom)
  .put(updateRoom)
  .delete(deleteRoom); // Consider adding specific authorization

router.route('/:id/join')
  .put(addMember);

router.route('/:id/leave')
  .put(removeMember);

module.exports = router;
```