const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')

const { getReservesByRoom } = require('../controllers/reservations.js')

const router = express.Router({ mergeParams: true })

router.get('/:space_id/:room_id', protect, getReservesByRoom)

module.exports = router
