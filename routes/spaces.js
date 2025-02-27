const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')
const {
  getSpaces,
  getSpace,
  addSpace,
  updateSpace,
  deleteSpace,
} = require('../controllers/spaces.js')

const router = express.Router()

const reservationRoutes = require('./reservations.js')
const roomRoutes = require('./rooms.js')

router.use('/:space_id/reservations/', reservationRoutes)
router.use('/:space_id/rooms', roomRoutes)

router.get('/', getSpaces)
router.post('/', protect, authorize('admin'), addSpace)

router.get('/:id', getSpace)
router.put('/:id', protect, authorize('admin'), updateSpace)
router.delete('/:id', protect, authorize('admin'), deleteSpace)

module.exports = router
