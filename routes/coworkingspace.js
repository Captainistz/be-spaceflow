const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')
const {
  getCoWorkingSpaces,
  getCoWorkingSpace,
  addCoWorkingSpace,
  updateCoworkingSpace,
  deleteCoWorkingSpace,
} = require('../controllers/coworkingspace.js')

const router = express.Router()

const rvsRoute = require('./reservation')
const roomRoutes = require('./rooms.js')

router.use('/:CoWorkingSpaceId/reservations/', rvsRoute)
router.use('/:CoWorkingSpaceID/rooms', roomRoutes)

router
  .route('/')
  .get(getCoWorkingSpaces)
  .post(protect, authorize('admin'), addCoWorkingSpace)

router
  .route('/:id')
  .get(getCoWorkingSpace)
  .put(protect, authorize('admin'), updateCoworkingSpace)
  .delete(protect, authorize('admin'), deleteCoWorkingSpace)

module.exports = router
