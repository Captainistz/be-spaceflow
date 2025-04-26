const Event = require('../models/Event')
const Space = require('../models/Space')
const EventAttendance = require('../models/EventAttendance')

// @desc    Get all events
// @route   GET /api/v1/events
// @access  Public
const getEvents = async (req, res, next) => {
  try {
    // Build filter query
    const reqQuery = { ...req.query }
    const removeFields = ['select', 'sort', 'page', 'limit']
    removeFields.forEach((param) => delete reqQuery[param])

    // Create query string with MongoDB operators
    let queryString = JSON.stringify(reqQuery)
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`,
    )
    const parsedQuery = JSON.parse(queryString)

    // Prepare base query
    let query = Event.find(parsedQuery).populate('space', 'name')

    // Handle select fields
    if (req.query.select) {
      query = query.select(req.query.select.split(',').join(' '))
    }

    //Pagination
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 6
    const startIndex = (page - 1) * limit

    // Execute queries in parallel
    const [total, events] = await Promise.all([
      Event.countDocuments(parsedQuery),
      query.skip(startIndex).limit(limit).populate('space', 'name'),
    ])

    // Build pagination object
    const totalPages = Math.ceil(total / limit)
    const pagination = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }

    res.status(200).json({
      success: true,
      data: {
        events,
        pagination,
      },
    })
  } catch (e) {
    next(e)
  }
}

// @desc    Get event by ID
// @route   GET /api/v1/events/:event_id
// @access  Public
const getEvent = async (req, res, next) => {
  const { event_id } = req.params
  try {
    const event = await Event.findById(event_id)
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      })
    }
    res.status(200).json({
      success: true,
      data: event,
    })
  } catch (e) {
    if (e.name === 'CastError') {
      e.message = `Event not found with id of ${event_id}`
      e.statusCode = 404
    }
    next(e)
  }
}

// @desc    Create a new event
// @route   POST /api/v1/events
// @access  Private
const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create(req.body)
    res.status(201).json({
      success: true,
      data: event,
    })
  } catch (e) {
    next(e)
  }
}

// @desc    Edit a event
// @route   PUT /api/v1/events/:event_id
// @access  Private
const editEvent = async (req, res, next) => {
  const { event_id } = req.params
  try {
    const event = await Event.findById({ _id: event_id })
    if (!event) {
      throw new Error('Not found')
    }

    Object.assign(event, req.body)
    await event.save()

    return res.status(200).json({
      success: true,
      data: event,
    })
  } catch (error) {
    next(error)
  }
}

// @desc    Delete a event
// @route   DELETE /api/v1/events/:event_id
// @access  Private
const deleteEvent = async (req, res, next) => {
  try {
    // TODO: ...
  } catch (error) {
    next(error)
  }
}

// @desc    join an ongoing event
// @route   POST /api/v1/events/:event_id/join
// @access  Private
const joinEvent = async (req,res,next) => {
  const { event_id } = req.params;

  try {
    const event = await Event.findById(event_id); 

    // find if event exists
    if (!event) {
      throw new Error('Not found')
    }

    // find if user has already reserved
    const userHasJoined = await EventAttendance.exists({ event:event_id, user:req.user.id});
    if (userHasJoined) {
      throw new Error('This user has already joined this event');
    }

    // check (end) time
    const now = new Date();
    if (now >= event.endDate) {
      throw new Error('Event has ended') ;
    }

    // check event max capacity
    const totalJoin = await EventAttendance.countDocuments({ event: event._id }); // count document with this eventId
    if (event.capacity <= totalJoin) {
      return next(new Error('The maximum capacity is reached'));
    }

    // pollute req.body
    req.body.user = req.user.id;
    req.body.event = event_id

    const reservation = await EventAttendance.create(req.body)

    res.status(200).json({
      success: true,
      data: reservation,
    })

  } catch (error) {
    next(error)
  }
}

// @desc    get event attendances of this user with event detail populated
// @route   GET /api/v1/events/eventAttendance
// @access  Private
const getEventAttendancesByUser = async (req,res,next) => {
  try {
    const eventAttendances = await EventAttendance.find({user:req.user.id}).populate('event');
    res.status(200).json({
      success: true,
      data: eventAttendances,
    })
  } catch (error) {
    next(error);
  }
}

module.exports = { getEvents, getEvent, createEvent, editEvent, deleteEvent, joinEvent, getEventAttendancesByUser }
