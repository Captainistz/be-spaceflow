const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')

const {
  getReservations,
  addReservation,
  getReservation,
  updateReservation,
  deleteReservation,
  getTimeslots,
} = require('../controllers/reservations.js')
const router = express.Router({ mergeParams: true })

router.get('/', protect, getReservations)
router.post('/', protect, authorize('user', 'admin'), addReservation)

router.get('/:id', protect, getReservation)
router.put('/:id', protect, authorize('user', 'admin'), updateReservation)
router.delete('/:id', protect, authorize('user', 'admin'), deleteReservation)

module.exports = router
