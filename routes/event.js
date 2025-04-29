const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')

const {
  getEvents,
  getEvent,
  createEvent,
  editEvent,
  deleteEvent,
  joinEvent,
  getEventAttendancesByUser,
  getEventAttendancesByEvent,
} = require('../controllers/events.js')

const router = express.Router({ mergeParams: true })

router.get('/', getEvents)
router.post('/', createEvent)
router.get('/attendance', protect, getEventAttendancesByUser)

router.get('/:event_id', getEvent)
router.put('/:event_id', editEvent)
router.delete("/:event_id", deleteEvent);

router.post('/attendance/:event_id', protect, joinEvent)
router.get('/attendance/:event_id',getEventAttendancesByEvent)

module.exports = router
