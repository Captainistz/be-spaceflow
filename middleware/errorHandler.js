const { JsonWebTokenError } = require('jsonwebtoken')

const globalErrorHandler = (err, req, res, next) => {
  // TODO : Implement better error handler + prodHandler

  if (err instanceof JsonWebTokenError || err.message == 'Unauthorized') {
    err.statusCode = 401
    err.message = 'Unauthorized'
  }

  if (err.name === 'ValidationError') {
    err.statusCode = 400
    err.message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ')
  }

  if (err.code === 11000) {
    err.statusCode = 400
    err.message = 'Duplicate entries'
  }
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'
  if (process.env.NODE_ENV === 'development' && err.statusCode === 500) {
    console.error(err.stack)
  }
  res.status(err.statusCode).json({ success: false, message: err.message })
}

module.exports = globalErrorHandler
