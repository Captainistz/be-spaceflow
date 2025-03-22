const mongoose = require('mongoose')

const RoomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Please add a roomNumber'],
  },
  capacity: {
    type: Number,
    required: [true, 'Please add a capacity'],
  },
  price:{
    type : Number,
    required : [true , 'Please add a price']
  },  
  facilities: {
    type: [String],
    default: [],
  },
})

const SpaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    unique: true,
    trim: true,
    maxLength: [50, 'Name cannot be more than 50 characters'],
  },
  address: {
    type: String,
    required: [true, 'Please add an addresss'],
  },
  district: {
    type: String,
    required: [true, 'Please add a district'],
  },
  province: {
    type: String,
    required: [true, 'Please add a province'],
  },
  postalcode: {
    type: String,
    required: [true, 'Please add a postalcode'],
    match: [/^\d{5}$/, 'Postalcode can not be more than 5 digits'],
  },
  tel: {
    type: String,
    require: [true, 'Please add a telephone number'],
  },
  opentime: {
    type: String,
    required: [true, 'Please add an open time'],
    match: [
      /^([0-1][0-9]|2[0-3])[0-5][0-9]$/,
      'Open time format must be HHmm (0000-2359)',
    ],
  },
  closetime: {
    type: String,
    required: [true, 'Please add a close time'],
    match: [
      /^([0-1][0-9]|2[0-3])[0-5][0-9]$/,
      'Close time format must be HHmm (0000-2359)',
    ],
  },
  rooms: {
    type: [RoomSchema],
    required: [true, 'Please add a list of rooms'],
  },
})

SpaceSchema.index({ 'rooms.roomNumber': 1 }, { unique: true })

SpaceSchema.path('rooms').validate(function (rooms) {
  return rooms.length > 0
}, 'Rooms must contains at least 1 room')

SpaceSchema.path('rooms').validate(function (rooms) {
  const roomNumbers = rooms.map((room) => room.roomNumber)
  const uniqueRoomNumbers = new Set(roomNumbers)
  return roomNumbers.length === uniqueRoomNumbers.size
}, 'Room numbers must be unique within a space')

SpaceSchema.methods.getRoomIdx = function (room_id) {
  if (!room_id) return -1
  const idx = this.rooms.findIndex(
    (room) => room._id.toString() === room_id
  )
  return idx
}

SpaceSchema.methods.getRoom = function (room_id) {
  if (!room_id) return null
  const foundRoom = this.rooms.find(
    (room) => room._id.toString() === room_id
  )
  return foundRoom
}

SpaceSchema.methods.checkOpeningHours = function (reservationDate) {
  const openDateTime = new Date(reservationDate)
  const closeDateTime = new Date(reservationDate)
  const rsvDateTime = new Date(reservationDate)

  openDateTime.setHours(
    parseInt(this.opentime.substring(0, 2)),
    parseInt(this.opentime.substring(2, 4))
  )

  closeDateTime.setHours(
    parseInt(this.closetime.substring(0, 2)),
    parseInt(this.closetime.substring(2, 4))
  )

  return openDateTime <= rsvDateTime && rsvDateTime < closeDateTime
}

SpaceSchema.virtual('reservations', {
  ref: 'Reservation',
  localField: '_id',
  foreignField: 'space',
  justOne: false,
})

module.exports = mongoose.model('Space', SpaceSchema)
