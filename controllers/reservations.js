const mongoose = require('mongoose')
const Reservation = require('../models/Reservation')
const Space = require('../models/Space')

// @desc   Get all reservations
// @route  GET /api/v1/reservations
// @access Public
const getReservations = async (req, res, next) => {
  let queryParams = { user: req.user.id }

  const reqQuery = { ...req.query }
  const removeFields = ['select', 'sort', 'page', 'limit']
  removeFields.forEach((param) => delete reqQuery[param])

  if (req.user.role === 'admin') {
    queryParams = req.params.space_id ? { space: req.params.space_id } : {}
  }

  let query = Reservation.find(queryParams)

  // Handle sorting
  var sortBy = req.query.sort

  switch (sortBy) {
    case 'date-asc':
      sortBy = '+reservationDate'
      break
    case 'date-desc':
      sortBy = '-reservationDate'
      break
    case 'price-asc':
      sortBy = '+price'
      break
    case 'price-desc':
      sortBy = '-price'
      break
    default:
      sortBy = '+reservationDate'
      break
  }

  query = query.sort(sortBy)

  try {
    const reservations = await query.populate([
      {
        path: 'space',
        select: 'name province tel rooms',
      },
      {
        path: 'user',
        select: 'name',
      },
    ])

    const modifiedReservations = reservations.map((reservation) => {
      if (!reservation.space || !reservation.space.rooms) {
        return { ...reservation.toObject(), room: null }
      }

      const roomDetails = reservation.space.rooms.find(
        (room) => room._id.toString() === reservation.room.toString()
      )

      const modifiedSpace = JSON.parse(JSON.stringify(reservation.space))
      delete modifiedSpace.rooms

      return {
        ...reservation.toObject(),
        space: modifiedSpace,
        room: roomDetails || null,
      }
    })

    res.status(200).json({
      success: true,
      data: modifiedReservations,
    })
  } catch (e) {
    next(e)
  }
}

// @desc   Get reservation by id
// @route  GET /api/v1/reservations/:id
// @access Public
const getReservation = async (req, res, next) => {
  const { id } = req.params
  try {
    const reservation = await Reservation.findById(id).populate({
      path: 'space',
      select: 'name province tel rooms',
    })

    if (!reservation) {
      throw new Error('Not found')
    }

    const modifiedSpace = JSON.parse(JSON.stringify(reservation.space))
    delete modifiedSpace.rooms

    const roomWithDetails = reservation.space.rooms.find(
      (room) => room._id.toString() === reservation.room.toString()
    )

    const modifiedReservations = {
      ...reservation.toObject(),
      space: modifiedSpace,
      room: roomWithDetails,
    }

    res.status(200).json({
      success: true,
      data: modifiedReservations,
    })
  } catch (e) {
    if (e.name == 'CastError' || e.message == 'Not found') {
      e.message = `Reservation not found with id of ${id}`
      e.statusCode = 404
    }
    next(e)
  }
}

// @desc   Add reservation by space
// @route  POST /api/v1/:space_id/reservations/
// @access Public
const addReservation = async (req, res, next) => {
  const { space_id } = req.params
  const { room, reservationDate } = req.body
  const MAXIMUM_RESERVATIONS = process.env.MAXIMUM_RESERVATIONS

  req.body.space = space_id
  req.body.user = req.user.id

  try {
    const space = await Space.findById(space_id)
    if (!space) {
      throw new Error('Space not found')
    }

    const roomExists = space.getRoom(room)
    if (!roomExists) {
      throw new Error('Room not found')
    }

    const existsReservations = await Reservation.find({
      user: req.user.id,
    })
    if (
      existsReservations.length >= MAXIMUM_RESERVATIONS &&
      req.user.role !== 'admin'
    ) {
      throw new Error('Maximum exceeded')
    }

    const isTimeValid = space.checkOpeningHours(reservationDate)
    if (!isTimeValid) {
      throw new Error('Not a valid time')
    }

    const reservation = await Reservation.create(req.body)

    res.status(200).json({
      success: true,
      data: reservation,
    })
  } catch (e) {
    if (e.name == 'CastError') {
      e.message = `Space or Room not found`
      e.statusCode = 404
    } else if (e.message == 'Space not found') {
      e.message = `Space not found with id of ${space_id}`
      e.statusCode = 404
    } else if (e.message == 'Room not found') {
      e.message = `Room not found with id of ${room}`
      e.statusCode = 404
    } else if (e.message == 'Maximum exceeded') {
      e.message = `The user with ID ${req.user.id} has exceeded the maximum number of reservations (${MAXIMUM_RESERVATIONS})`
      e.statusCode = 409
    } else if (e.message == 'Not a valid time') {
      e.statusCode = 400
    }
    next(e)
  }
}

// @desc   Update reservation
// @route  PUT /api/v1/reservations/:id
// @access Public
const updateReservation = async (req, res, next) => {
  const { id } = req.params
  let space_id = req.body.space
  let room_id = req.body.room
  let reservationDate = req.body.reservationDate

  try {
    const prevReservation = await Reservation.findById(id)
    if (!prevReservation) {
      throw new Error('Reservation not found')
    }

    if (!req.body.space) space_id = prevReservation.space.toString()
    if (!req.body.room) room_id = prevReservation.room.toString()
    if (!req.body.reservationDate)
      reservationDate = prevReservation.reservationDate

    if (
      prevReservation.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      throw new Error('Unauthorized')
    }

    const space = await Space.findById(space_id)
    if (!space) {
      throw new Error('Space not found')
    }

    const isTimeValid = space.checkOpeningHours(reservationDate)
    if (!isTimeValid) {
      throw new Error('Not a valid time')
    }

    const roomExists = space.getRoom(room_id)
    if (!roomExists) {
      throw new Error('Room not found')
    }

    const reservation = await Reservation.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(200).json({
      success: true,
      data: reservation,
    })
  } catch (e) {
    if (e.name == 'CastError') {
      e.message = `Reservation, Space or Room not found`
      e.statusCode = 404
    } else if (e.message == 'Reservation not found') {
      e.message = `Reservation not found with id of ${id}`
      e.statusCode = 404
    } else if (e.message == 'Space not found') {
      e.message = `Space not found with id of ${space_id}`
      e.statusCode = 404
    } else if (e.message == 'Room not found') {
      e.message = `Room not found with id of ${room_id}`
      e.statusCode = 404
    } else if (e.message == 'Not a valid time') {
      e.statusCode = 400
    }
    next(e)
  }
}

// @desc   Delete reservation
// @route  DELETE /api/v1/reservations/:id
// @access Public
const deleteReservation = async (req, res, next) => {
  const { id } = req.params
  try {
    const reservation = await Reservation.findById(id)
    if (!reservation) {
      throw new Error('Not found')
    }

    if (
      reservation.user.toString() !== req.user.id &&
      req.user.role !== 'admin'
    ) {
      throw new Error('Unauthorized')
    }

    await reservation.deleteOne()

    res.status(200).json({
      success: true,
      data: {},
    })
  } catch (e) {
    if (e.name == 'CastError' || e.message == 'Not found') {
      e.message = `Reservation not found with id of ${id}`
      e.statusCode = 404
    }
    next(e)
  }
}

const getReservesByRoom = async (req, res, next) => {
  const { space_id, id } = req.params // Correctly destructure the params

  const todayStart = Date.now() // Get the current timestamp

  try {
    const reservations = await Reservation.find({
      room: id,
      space: space_id,
      reservationDate: { $gte: todayStart },
    }).select('reservationDate -_id')

    // Extract and flatten the reservationDate values into a single array
    const reservedDate = reservations.map(
      (reservation) => reservation.reservationDate
    )

    res.status(200).json({
      success: true,
      data: reservedDate,
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getReservations,
  addReservation,
  getReservation,
  updateReservation,
  deleteReservation,
  getReservesByRoom,
}
