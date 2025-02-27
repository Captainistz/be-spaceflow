const mongoose = require('mongoose')

const ReservationSchema = new mongoose.Schema({
  reservationDate: {
    type: Date,
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  room: {
    type: mongoose.Schema.ObjectId,
    ref: 'Room',
    required: true,
  },
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

module.exports = mongoose.model('Reservation', ReservationSchema)
