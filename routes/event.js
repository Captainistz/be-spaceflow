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

/**
 * @swagger
 * tags:
 *   - name: Events
 *     description: API operations related to events
 */

/***
 * @swagger
 * /events:
 *   get:
 *     summary: Returns the list of all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: The list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *
 */

/**
 * @swagger
 * /events/{event_id}:
 *   get:
 *     summary: Retrieve a single event by its ID.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         description: The unique ID of the event to retrieve.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Details of the event.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event. Requires authentication.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *           example:
 *             name: Sample Event
 *             space: "SpaceId"
 *             description: A Sample Description.
 *             host: "John Doe"
 *             capacity: 100
 *             startDate: "2025-05-10T00:00:00Z"
 *             endDate: "2025-05-11T00:00:00Z"
 *             image: "/sample.jpg"
 *     responses:
 *       201:
 *         description: The event was successfully created.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *             example:
 *               success: true
 *               data:
 *                 _id: "6631b8e56ac22f1c1a1a1a1a"
 *                 name: Sample Event
 *                 space: "SpaceId"
 *                 description: A Sample Description.
 *                 host: "John Doe"
 *                 capacity: 100
 *                 status: upcoming
 *                 startDate: "2025-05-10T00:00:00Z"
 *                 endDate: "2025-05-11T00:00:00Z"
 *                 image: "/sample.jpg"
 *                 attendee: 0
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /events/{event_id}:
 *   put:
 *     summary: Update an existing event. Requires authentication.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         description: The unique ID of the event to update.
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *           example:
 *             name: Updated Name Event
 *             space: "SpaceId"
 *             description: An updated description.
 *             host: Jane Smith
 *             capacity: 150
 *             startDate: "2025-05-11T00:00:00Z"
 *             endDate: "2025-05-14T00:00:00Z"
 *             image: "/Sample.jpg"
 *     responses:
 *       200:
 *         description: The event was successfully updated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Event'
 *             example:
 *               success: true
 *               data:
 *                 _id: "6631b8e56ac22f1c1a1a1a1a"
 *                 name: Updated Name Event
 *                 space: "SpaceId"
 *                 description: An updated description.
 *                 host: Jane Smith
 *                 capacity: 150
 *                 status: upcoming
 *                 startDate: "2025-05-11T00:00:00Z"
 *                 endDate: "2025-05-14T00:00:00Z"
 *                 image: "/Sample.jpg"
 *                 attendee: 10
 *       404:
 *         description: Event not found.
 *       400:
 *         description: Bad request.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /events/{event_id}:
 *   delete:
 *     summary: Delete an event. Requires authentication.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         description: The unique ID of the event to delete.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The event was successfully deleted.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Empty object.
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /events/attendance/{event_id}:
 *   post:
 *     summary: Join an event. Requires authentication.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         description: The unique ID of the event to join.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The user successfully joined the event.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/EventAttendance'
 *       404:
 *         description: Event not found.
 *       400:
 *         description: Bad request (e.g., event has ended, capacity reached).
 *       409:
 *         description: Conflict - User already joined the event.
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /events/attendance:
 *   get:
 *     summary: Get all event attendance records for the authenticated user.
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of event attendance records for the user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EventAttendance'
 *       500:
 *         description: Internal server error.
 */

/**
 * @swagger
 * /events/attendance/{event_id}:
 *   get:
 *     summary: Get all attendance records for a specific event.
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         description: The unique ID of the event to retrieve attendance records for.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A list of attendance records for the event.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EventAttendance'
 *       404:
 *         description: Event not found.
 *       500:
 *         description: Internal server error.
 */

router.get('/', getEvents)
router.post('/', createEvent)
router.get('/attendance', protect, getEventAttendancesByUser)

router.get('/:event_id', getEvent)
router.put('/:event_id', editEvent)
router.delete('/:event_id', deleteEvent)

router.post('/attendance/:event_id', protect, joinEvent)
router.get('/attendance/:event_id', getEventAttendancesByEvent)

module.exports = router
