const mongoose = require('mongoose')

const EventAttendanceSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.ObjectId,
    ref: 'Event',
    required: true,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  // space: {
  //   type: mongoose.Schema.ObjectId,
  //   ref: 'Space',
  //   required: true,
  // },
  // status: {
  //   type: String,
  //   enum: ['upcoming', 'happening', 'ended'],
  //   default: 'upcoming',
  // },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

EventAttendanceSchema.index({ unique: true })

module.exports = mongoose.model('EventAttendance', EventAttendanceSchema)
