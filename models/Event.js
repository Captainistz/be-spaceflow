const mongoose = require('mongoose')

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  space: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  host: {
    type: String,
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['upcoming', 'happening', 'ended'],
    default: 'upcoming',
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  image: {
    type: String,
    default: '/placehold.jpg',
  },
  attendee: {
    type: Number,
    default: 0,
  },
})

EventSchema.pre('validate', function (next) {
  if (!this.startDate || !this.endDate) return next()

  const startDate = new Date(this.startDate)
  const endDate = new Date(this.endDate)

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
    return next(new Error('Invalid date format'))

  if (startDate >= endDate)
    return next(new Error('End date must be after start date'))

  const diffInDays = (endDate - startDate) / (1000 * 60 * 60 * 24)

  if (diffInDays > 7 || diffInDays < 1)
    return next(new Error('Event duration must be between 1 and 7 days'))

  next()
})

module.exports = mongoose.model('Event', EventSchema)
