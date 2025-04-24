const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')

const {
    getEvents,
    getEvent,
    createEvent,
    editEvent,
    deleteEvent
} = require("../controllers/events.js");

const router = express.Router({ mergeParams: true })

router.get("/", getEvents);
router.post("/", createEvent);

router.get("/:event_id", getEvent);
// router.put("/:event_id", editEvent);
// router.delete("/:event_id", deleteEvent);

module.exports = router