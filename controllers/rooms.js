const CoWorkingSpace = require('../models/CoWorkingSpace')

const getRooms = async (req, res, next) => {
  try {
    const coworkingspace = await CoWorkingSpace.findById(
      req.params.CoWorkingSpaceID
    )

    return res
      .status(200)
      .json({ success: true, data: coworkingspace.rooms })
  } catch (e) {
    next(e)
  }
}

const getRoom = async (req, res, next) => {
  try {
    const coworkingspace = await CoWorkingSpace.find({
      _id: req.params.CoWorkingSpaceID,
      'rooms.roomNumber': parseInt(req.params.room_id),
    })

    res.status(200).json({ success: true, data: coworkingspace })
  } catch (e) {
    next(e)
  }
}

module.exports = { getRooms, getRoom }
