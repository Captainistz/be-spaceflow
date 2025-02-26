const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')
const { getRooms, getRoom , createRoom , deleteRoom, updateRoom} = require('../controllers/rooms.js')

const router = express.Router({ mergeParams: true })

router.route('/').get(getRooms).post(createRoom);
router.route('/:room_id').get(getRoom).delete(deleteRoom).put(updateRoom);

module.exports = router
