const mongoose = require('mongoose')
const { Schema } = mongoose

const ReviewSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: Schema.Types.ObjectId,
    require: [true, 'Please insert user ID'],
    ref: 'User',
  },
  spaceId: {
    type: Schema.Types.ObjectId,
    require: [true, 'Please insert space ID'],
    ref: 'Space',
  },
  comment: {
    type: String,
    require: [true, 'Please insert a comment'],
    maxlength: [200, 'Comment cannot be longer than 200 character'],
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
    require: [true, 'Please insert a rating'],
  },
  upVote: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    default: [],
  },
  downVote: {
    type: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    default: [],
  },
})

module.exports = mongoose.model('Review', ReviewSchema)
