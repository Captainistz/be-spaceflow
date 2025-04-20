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
  price: {
    type: Number,
    required: [true, 'Please add a price'],
  },
  facilities: {
    type: [String],
    default: [],
  },
  image: {
    type: String,
    default: '/placehold.jpg',
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
  },
  image: {
    type: String,
    default: '/placehold.jpg',
  },
})

SpaceSchema.index({ 'rooms.roomNumber': 1 }, { unique: true })

SpaceSchema.path('rooms').validate(function (rooms) {
  const roomNumbers = rooms.map((room) => room.roomNumber)
  const uniqueRoomNumbers = new Set(roomNumbers)
  return roomNumbers.length === uniqueRoomNumbers.size
}, 'Room numbers must be unique within a space')

SpaceSchema.methods.getRoomIdx = function (room_id) {
  if (!room_id) return -1
  const idx = this.rooms.findIndex((room) => room._id.toString() === room_id)
  return idx
}

SpaceSchema.methods.getRoom = function (room_id) {
  if (!room_id) return null
  const foundRoom = this.rooms.find((room) => room._id.toString() === room_id)
  return foundRoom
}

SpaceSchema.methods.checkOpeningHours = function (reservationDate) {
  const date = new Date(reservationDate)

  const openDateTime = new Date(date)
  const closeDateTime = new Date(date)

  const openHour = parseInt(this.opentime.substring(0, 2))
  const openMinute = parseInt(this.opentime.substring(2, 4))
  let openHourUTC = openHour - 7
  if (openHourUTC < 0) openHourUTC += 24

  openDateTime.setUTCHours(openHourUTC, openMinute)

  const closeHour = parseInt(this.closetime.substring(0, 2))
  const closeMinute = parseInt(this.closetime.substring(2, 4))
  let closeHourUTC = closeHour - 7
  if (closeHourUTC < 0) closeHourUTC += 24

  closeDateTime.setUTCHours(closeHourUTC, closeMinute)

  return openDateTime <= date && date < closeDateTime
}

SpaceSchema.virtual('reservations', {
  ref: 'Reservation',
  localField: '_id',
  foreignField: 'space',
  justOne: false,
})

module.exports = mongoose.model('Space', SpaceSchema)
