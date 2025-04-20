const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')
const {
  getRooms,
  getRoom,
  addRoom,
  deleteRoom,
  updateRoom,
} = require('../controllers/rooms.js')
const {
  getReservesByRoom,
  getTimeslots,
} = require('../controllers/reservations.js')

const router = express.Router({ mergeParams: true })

router.get('/', getRooms)
router.post('/', protect, authorize('admin'), addRoom)

router.get('/:id/reservations', getReservesByRoom)
router.get('/:id/reservations/timeslots', getTimeslots)
router.get('/:id', getRoom)
router.put('/:id', protect, authorize('admin'), updateRoom)
router.delete('/:id', protect, authorize('admin'), deleteRoom)

module.exports = router
