const jwt = require('jsonwebtoken')
const User = require('../models/User')

const protect = async (req, _, next) => {
  let token

  try {
    const { authorization } = req.headers
    if (authorization && authorization.startsWith('Bearer')) {
      token = authorization.split(' ')[1]
    }

    if (!token || token == 'null') {
      const error = new Error('Unauthorized')
      error.statusCode = 401
      throw error
    }

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
        `User role ${req.user.role} is not authorized to access this route`,
      )
      error.statusCode = 403
      return next(error)
    }
    next()
  }
}

module.exports = { protect, authorize }
