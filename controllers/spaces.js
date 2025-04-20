const Space = require('../models/Space.js')
const Reservation = require('../models/Reservation.js')

// @desc   Get all spaces
// @route  GET /api/v1/spaces
// @access Public
const getSpaces = async (req, res, next) => {
  try {
    // Build filter query
    const reqQuery = { ...req.query }
    const removeFields = ['select', 'sort', 'page', 'limit']
    removeFields.forEach((param) => delete reqQuery[param])

    // Create query string with MongoDB operators
    let queryString = JSON.stringify(reqQuery)
    queryString = queryString.replace(
      /\b(gt|gte|lt|lte|in)\b/g,
      (match) => `$${match}`,
    )
    const parsedQuery = JSON.parse(queryString)

    // Prepare base query
    let query = Space.find(parsedQuery)

    // Handle select fields
    if (req.query.select) {
      query = query.select(req.query.select.split(',').join(' '))
    }

    // Handle sorting
    // const sortBy = req.query.sort
    //   ? req.query.sort.split(',').join(' ')
    //   : 'name'
    // query = query.sort(sortBy)

    // Pagination
    const page = parseInt(req.query.page, 10) || 1
    const limit = parseInt(req.query.limit, 10) || 6
    const startIndex = (page - 1) * limit

    // Execute queries in parallel
    const [total, spaces] = await Promise.all([
      Space.countDocuments(parsedQuery),
      query.skip(startIndex).limit(limit).populate('reservations'),
    ])

    // Build pagination object
    const totalPages = Math.ceil(total / limit)
    const pagination = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    }

    res.status(200).json({
      success: true,
      data: {
        spaces,
        pagination,
      },
    })
  } catch (err) {
    next(err)
  }
}

// @desc   Get space by id
// @route  GET /api/v1/spaces/:id
// @access Public
const getSpace = async (req, res, next) => {
  const { id } = req.params

  try {
    const space = await Space.findById(id)
    if (!space) {
      throw new Error('Not found')
    }
    res.status(200).json({
      success: true,
      data: space,
    })
  } catch (e) {
    if (e.name == 'CastError' || e.message == 'Not found') {
      e.message = `Space not found with id of ${id}`
      e.statusCode = 404
    }
    next(e)
  }
}

// @desc   Add new space
// @route  POST /api/v1/spaces/
// @access Private
const addSpace = async (req, res, next) => {
  try {
    const space = await Space.create(req.body)
    return res.status(201).json({
      success: true,
      data: space,
    })
  } catch (e) {
    next(e)
  }
}

// @desc   Update space
// @route  PUT /api/v1/spaces/:id
// @access Private
const updateSpace = async (req, res, next) => {
  const { id } = req.params
  try {
    const space = await Space.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!space) {
      throw new Error('Not found')
    }

    return res.status(200).json({
      success: true,
      data: space,
    })
  } catch (e) {
    if (e.name == 'CastError' || e.message == 'Not found') {
      e.message = `Space not found with id of ${id}`
      e.statusCode = 404
    }
    next(e)
  }
}

// @desc   Delete space
// @route  DELETE /api/v1/spaces/:id
// @access Private
const deleteSpace = async (req, res, next) => {
  const { id } = req.params
  try {
    const space = await Space.findById(id)

    if (!space) {
      throw new Error('Not found')
    }

    await Reservation.deleteMany({ space: id })
    await Space.deleteOne({ _id: id })

    res.status(200).json({
      success: true,
    })
  } catch (e) {
    if (e.name == 'CastError' || e.message == 'Not found') {
      e.message = `Space not found with id of ${id}`
      e.statusCode = 404
    }
    next(e)
  }
}

module.exports = {
  getSpaces,
  getSpace,
  addSpace,
  updateSpace,
  deleteSpace,
}
