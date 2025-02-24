const globalErrorHandler = (err, req, res, next) => {
  // TODO : Implement better error handler + prodHandler
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack)
  }

  if (err.code === 11000) {
    err.statusCode = 400
    err.message = 'Duplicate entries'
  }
  err.statusCode = err.statusCode || 500
  err.message = err.message || 'Internal Server Error'
  res.status(err.statusCode).json({ success: false, message: err.message })
}

module.exports = globalErrorHandler
