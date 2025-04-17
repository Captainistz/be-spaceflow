const mongoose = require('mongoose')
const Reservation = require('../models/Reservation')
const Space = require('../models/Space')

// @desc   Get all reservations
// @route  GET /api/v1/reservations
// @access Public
const getReservations = async (req, res, next) => {
  let findParam = { user: req.user.id }
  if (req.user.role === 'admin' && req.params.space_id) {
    findParam = { space: req.params.space_id }
  }

  let query = Reservation.find(findParam)

  let sortParam = { reservationDate: 1 }
  if (req.query.sort === 'date-desc') {
    sortParam = { reservationDate: -1 }
  }

  query = query.sort(sortParam)
  const isPriceSorting =
    req.query.sort === 'price-asc' || req.query.sort === 'price-desc'

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
        (room) => room._id.toString() === reservation.room.toString(),
      )

      const modifiedSpace = JSON.parse(JSON.stringify(reservation.space))
      delete modifiedSpace.rooms

      return {
        ...reservation.toObject(),
        space: modifiedSpace,
        room: roomDetails || null,
      }
    })

    if (isPriceSorting) {
      modifiedReservations.sort((a, b) => {
        const priceA = a.room?.price || 0
        const priceB = b.room?.price || 0
        return req.query.sort === 'price-asc'
          ? priceA - priceB
          : priceB - priceA
      })
    }

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
      (room) => room._id.toString() === reservation.room.toString(),
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

    const date = new Date()

    const activeReservations = await Reservation.find({
      status: 'active',
      reservationDate: reservationDate,
    })

    if (activeReservations) {
      throw new Error('Reserved')
    }

    const existsReservations = await Reservation.find({
      user: req.user.id,
      status: 'active',
      reservationDate: {
        $gte: date,
      },
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
    } else if (e.message == 'Reserved') {
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

    await reservation.updateOne({
      status: 'cancelled',
    })

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
      (reservation) => reservation.reservationDate,
    )

    res.status(200).json({
      success: true,
      data: reservedDate,
    })
  } catch (error) {
    next(error)
  }
}

const getTimeslots = async (req, res, next) => {
  const { space_id, id } = req.params
  const { date } = req.query

  try {
    const targetDate = new Date(date)

    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0))
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999))

    const space = await Space.findById(space_id)
    if (!space) {
      throw new Error('Space not found')
    }

    const reservations = await Reservation.find({
      room: id,
      space: space_id,
      reservationDate: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: 'active',
    })

    const openTime = space.opentime
    const closeTime = space.closetime

    const openHour = parseInt(openTime.slice(0, 2))
    const openMinute = parseInt(openTime.slice(2))
    const closeHour = parseInt(closeTime.slice(0, 2))
    const closeMinute = parseInt(closeTime.slice(2))

    let currentHour = openHour
    let currentMinute = openMinute

    const today = new Date()
    const currentTimeHour = today.getHours()

    const timeslots = []

    const reservedTimes = reservations.map((reservation) => {
      const date = new Date(reservation.reservationDate)
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    })

    while (
      currentHour < closeHour ||
      (currentHour === closeHour && currentMinute < closeMinute)
    ) {
      const time = `${currentHour
        .toString()
        .padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`
      let available = !reservedTimes.includes(time)
      if (
        targetDate.getDate() === today.getDate() &&
        targetDate.getMonth() === today.getMonth() &&
        targetDate.getFullYear() === today.getFullYear()
      ) {
        if (currentHour <= currentTimeHour) {
          available = false
        }
      }

      timeslots.push({ time, available })
      currentHour += 1
      if (currentHour != openHour) {
        currentMinute = 0
      }
    }

    res.status(200).json({
      success: true,
      data: timeslots,
    })
  } catch (e) {
    if (e.message == 'Space not found') {
      e.message = `Space not found with id of ${space_id}`
      e.statusCode = 404
    }
    next(e)
  }
}

const completedReservations = async () => {
  try {
    const now = new Date()
    const res = await Reservation.updateMany(
      {
        status: 'active',
        reservationDate: { $lt: now },
      },
      {
        $set: { status: 'completed' },
      },
    )
    return res
  } catch (e) {
    throw e
  }
}

module.exports = {
  getReservations,
  addReservation,
  getReservation,
  updateReservation,
  deleteReservation,
  getReservesByRoom,
  getTimeslots,
  completedReservations,
}
