const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')
const { getRooms, getRoom } = require('../controllers/rooms.js')

const router = express.Router({ mergeParams: true })

router.route('/').get(getRooms)
router.route('/:room_id').get(getRoom)

module.exports = router
