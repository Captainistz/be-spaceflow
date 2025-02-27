const Space = require('../models/Space')
const Reservation = require('../models/Reservation')

// @desc   Get all rooms
// @route  GET /api/v1/:space_id/rooms
// @access Public
const getRooms = async (req, res, next) => {
  const { space_id } = req.params
  try {
    const space = await Space.findById(space_id)
    if (!space) {
      throw new Error('Not found')
    }
    return res.status(200).json({ success: true, data: space.rooms })
  } catch (e) {
    if (e.name == 'CastError' || e.message == 'Not found') {
      e.message = `Space not found with id of ${space_id}`
      e.statusCode = 404
    }
    next(e)
  }
}

// @desc   Get room by id
// @route  GET /api/v1/:space_id/rooms/:id
// @access Public
const getRoom = async (req, res, next) => {
  const { space_id, id } = req.params
  try {
    const space = await Space.findById(space_id)
    if (!space) {
      throw new Error('Space not found')
    }

    const room = await space.getRoom(id)
    if (!room) {
      throw new Error('Room not found')
    }

    return res.status(200).json({
      success: true,
      data: room,
    })
  } catch (e) {
    if (e.name == 'CastError') {
      e.message = `Reservation, Space or Room not found`
      e.statusCode = 404
    } else if (e.message == 'Space not found') {
      e.message = `Space not found with id of ${space_id}`
      e.statusCode = 404
    } else if (e.message == 'Room not found') {
      e.message = `Room not found with id of ${id}`
      e.statusCode = 404
    }
    next(e)
  }
}

// @desc   Add room to space
// @route  POST /api/v1/:space_id/rooms
// @access Private
const addRoom = async (req, res, next) => {
  const { space_id } = req.params
  try {
    const space = await Space.findById(space_id)
    if (!space) {
      throw new Error('Space not found')
    }

    space.rooms.push(req.body)

    await space.save()

    return res.status(201).json({
      success: true,
      data: space.rooms[space.rooms.length - 1],
    })
  } catch (e) {
    if (e.name == 'CastError' || e.message == 'Space not found') {
      e.message = `Space not found with id of ${space_id}`
      e.statusCode = 404
    }
    next(e)
  }
}

// @desc   Update room in space
// @route  PUT /api/v1/:space_id/rooms/:id
// @access Private
const updateRoom = async (req, res, next) => {
  const { space_id, id } = req.params
  try {
    const space = await Space.findById(space_id)
    if (!space) {
      throw new Error('Space not found')
    }

    const roomIdx = await space.getRoomIdx(id)
    if (roomIdx == -1) {
      throw new Error('Room not found')
    }

    Object.keys(req.body).forEach((key) => {
      space.rooms[roomIdx][key] = req.body[key]
    })

    await space.save()

    return res.status(200).json({
      success: true,
      data: space.rooms[roomIdx],
    })
  } catch (e) {
    if (e.name == 'CastError') {
      e.message = `Space or Room not found`
      e.statusCode = 404
    } else if (e.message == 'Space not found') {
      e.message = `Space not found with id of ${space_id}`
      e.statusCode = 404
    } else if (e.message == 'Room not found') {
      e.message = `Room not found with id of ${id}`
      e.statusCode = 404
    }
    next(e)
  }
}

// @desc   Delete room from space
// @route  DELETE /api/v1/:space_id/rooms/:id
// @access Private
const deleteRoom = async (req, res, next) => {
  const { space_id, id } = req.params
  try {
    const space = await Space.findById(space_id)
    if (!space) {
      throw new Error('Space not found')
    }

    const roomIdx = await space.getRoomIdx(id)
    if (roomIdx === -1) {
      throw new Error('Room not found')
    }

    await Reservation.deleteMany({ room: id })

    space.rooms.splice(roomIdx, 1)
    await space.save()

    return res.status(200).json({
      success: true,
      data: {},
    })
  } catch (e) {
    if (e.name == 'CastError') {
      e.message = `Space or Room not found`
      e.statusCode = 404
    } else if (e.message == 'Space not found') {
      e.message = `Space not found with id of ${space_id}`
      e.statusCode = 404
    } else if (e.message == 'Room not found') {
      e.message = `Room not found with id of ${id}`
      e.statusCode = 404
    }
    next(e)
  }
}

module.exports = { getRooms, getRoom, addRoom, updateRoom, deleteRoom }
