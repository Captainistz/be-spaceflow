const mongoose = require('mongoose')

const EventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  spaceId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Space',
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  host: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  capacity: {
    type: Number,
    required: true,
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
})

EventSchema.pre('validate', function (next) {
  const startDate = new Date(this.startDate)
  const endDate = new Date(this.endDate)

  if (startDate >= endDate)
    return next(new Error('End date must be after start date'))

  const diffInDays = (endDate - startDate) / (1000 * 60 * 60 * 24)

  if (diffInDays > 7 || diffInDays < 1)
    return next(new Error('Event duration must be between 1 and 7 days'))

  next()
})

EventSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate()
  const data = update.$set || update

  if (data.startDate && data.endDate) {
    const startDate = new Date(data.startDate)
    const endDate = new Date(data.endDate)

    if (startDate >= endDate)
      return next(new Error('End date must be after start date'))

    const diffInDays = (endDate - startDate) / (1000 * 60 * 60 * 24)

    if (diffInDays > 7 || diffInDays < 1)
      return next(new Error('Event duration must be between 1 and 7 days'))
  }

  next()
})

module.exports = mongoose.model('Event', EventSchema)
