const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, _, next) => {
  let token

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    const error = new Error('Unauthorized')
    error.statusCode = 401
    return next(error)
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id)
    next()
  } catch (e) {
    next(e)
  }
}

const authorize = (...roles) => {
  return (req, _, next) => {
    if (!roles.includes(req.user.role)) {
      const error = new Error(
        `User role ${req.user.role} is not authorized to access this route`
      )
      error.statusCode = 403
      return next(error)
    }
    next()
  }
}

module.exports = { protect, authorize }
