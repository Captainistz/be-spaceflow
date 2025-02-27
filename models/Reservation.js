const mongoose = require('mongoose')

const ReservationSchema = mongoose.Schema({
  reservationDate: {
    type: Date,
    require: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    require: true,
  },
  room: {
    type: mongoose.Schema.ObjectId,
    ref: 'Room',
    require: true,
  },
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
    require: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Reservation', ReservationSchema)
