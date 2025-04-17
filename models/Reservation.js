const mongoose = require('mongoose')

const ReservationSchema = new mongoose.Schema({
  reservationDate: {
    type: Date,
    required: true,
    set: function (date) {
      const d = new Date(date)
      return d
    },
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
  status: {
    type: String,
    enum: ['active', 'cancelled', 'completed'],
    default: 'active',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

ReservationSchema.index({ unique: true })

module.exports = mongoose.model('Reservation', ReservationSchema)
