const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')
const { getRooms, getRoom , createRoom , deleteRoom, updateRoom} = require('../controllers/rooms.js')

const router = express.Router({ mergeParams: true })

router.route('/').get(getRooms).post(protect, authorize('admin'),createRoom);
router.route('/:room_id').get(getRoom).delete(protect, authorize('admin'),deleteRoom).put(protect, authorize('admin'),updateRoom);

module.exports = router
