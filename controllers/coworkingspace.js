const CoWorkingSpace = require('../models/CoWorkingSpace.js')
const Reservation = require('../models/Reservation.js')

const getCoWorkingSpaces = async (req,res,next) => {
  try {
    // handle <>= and populating
    const reqQuery = {...req.query};
    const removeFields = ['select','sort','page','limit'];
    removeFields.forEach(param => delete reqQuery[param])
    let queryString = JSON.stringify(reqQuery)
    queryString = queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)
    let query = CoWorkingSpace.find(JSON.parse(queryString)).populate('reservations')
    
    // handle select and sort
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ')
      query = query.select(fields)
    }
    
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ')
      query = query.sort(sortBy)
    } else {
      query = query.sort('-createdAt')
    }
    
    // handle pagination
    const page = parseInt(req.query.page,10) || 1;
    const limit = parseInt(req.query.limit,10) || 25;
    const startIndex = (page-1)*limit
    const endIndex = (page)*limit
    const total = await CoWorkingSpace.countDocuments()
    
    query = query.skip(startIndex).limit(limit)
    
    const pagination = {}
    if (endIndex < total) {
      pagination.next = {
        page: page+1,
        limit
      }
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page-1,
        limit
      }
    }
    
    // actual query
    const coworkingspaces = await query
    res.status(200).json({
      success:true,
      count: coworkingspaces.length,
      pagination,
      data: coworkingspaces
    })
  } catch (err) {
    next(err)
  }
}

const getCoWorkingSpace = async (req,res,next) => {
  try {
    const {id} = req.params
    const coworkingspace = await CoWorkingSpace.findById(id)
    if (!coworkingspace) {
      return res.status(404).json({
        success: false,
        message: `No coworkingspace with id ${id}`
      })
    }
    res.status(200).json({
      success: true,
      data: coworkingspace
    })
  } catch (err) {
    next(err)
  }
}

const addCoWorkingSpace = async (req,res,next) => {
  try {
    const coworkingspace = await CoWorkingSpace.create(req.body)
    res.status(200).json({
      success: true,
      data: coworkingspace
    })
  } catch (err) {
    next(err)
  }
}

const updateCoWorkingSpace = async (req,res,next) => {
  try {
    const {id} = req.params
    const {body} = req
    const coworkingspace = await CoWorkingSpace.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true
    })
    if (!coworkingspace) {
      return res.status(404).json({
        success: false,
        message: `No coworkingspace with id ${id}`
      })
    }

    res.status(200).json({
      success: true,
      data: coworkingspace
    })
  } catch (err) {
    next(err)
  }
}

const deleteCoWorkingSpace = async (req,res,next) => {
  try {
    const {id} = req.params
    const coworkingspace = await CoWorkingSpace.findById(id) // trigger catch should this CoWorkingSpace doesn't exists
    if (!coworkingspace) {
      return res.status(404).json({
        success: false,
        message: `No coworkingspace with id ${id}`
      })
    }

    await Reservation.deleteMany({coworkingspace: id})
    await CoWorkingSpace.findByIdAndDelete(id)

    res.status(200).json({
      success: true,
      data: coworkingspace
    })
  } catch (err) {
    next(err)
  }
}



module.exports = { getCoWorkingSpaces, getCoWorkingSpace, addCoWorkingSpace, updateCoWorkingSpace, deleteCoWorkingSpace }