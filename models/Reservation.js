const mongoose = require('mongoose')

const ReservationSchema = mongoose.Schema({
  rsvDate: {
    type: Date,
    require: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    require: true
  },
  roomNumber: {
    type: Number,
    require: true
  },
  coWorkingSpace: {
    type: mongoose.Schema.ObjectId,
    require: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

module.exports = mongoose.model('Reservation', ReservationSchema)