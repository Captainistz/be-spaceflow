const mongoose = require('mongoose')

const RoomSchema = new mongoose.Schema({
  roomNumber: {
    type: Number,
    required: [true, 'Please add a roomNumber']
  },
  capacity: {
    type: Number,
    required: [true, 'Please add a capacity']
  },
  facilities: {
    type: [String],
    default: []
  }
})

const CoWorkingSpaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  address: {
    type: String,
    required: [true, 'Please add an addresss']
  },
  district: {
    type: String,
    required: [true, 'Please add a district']
  },
  province: {
    type: String,
    required: [true, 'Please add a province']
  },
  postalcode: {
    type: String,
    required: [true, 'Please add a postalcode'],
    match: [/^\d{5}$/, 'Postalcode can not be more than 5 digits']
  },
  tel: {
    type: String,
    require: [true, 'Please add a telephone number']
  },
  opentime: {
    type: String,
    required: [true, 'Please add an open time'],
    match: [/^([0-1][0-9]|2[0-3])[0-5][0-9]$/, 'Open time format must be HHmm (0000-2359)']
  },
  closetime: {
    type: String,
    required: [true, 'Please add a close time'],
    match: [/^([0-1][0-9]|2[0-3])[0-5][0-9]$/, 'Close time format must be HHmm (0000-2359)']
  },
  rooms: {
    type: [RoomSchema],
    required: [true, 'Please add a list of rooms'],
    validate: {
      validator: function(value) {
        return value.length > 0;
      },
      message: "The list must include at least 1 room"
    }
  }
})

CoWorkingSpaceSchema.virtual('reservations', {
  ref: 'Reservation',
  localField: '_id',
  foreignField: 'coWorkingSpace',
  justOne: true
})

module.exports = mongoose.model('CoWorkingSpace', CoWorkingSpaceSchema)
