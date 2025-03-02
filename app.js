const hpp = require('hpp')
const dotenv = require('dotenv')
const helmet = require('helmet')
const express = require('express')
const cookirParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const { xss } = require('express-xss-sanitizer')
const mongoSanitize = require('express-mongo-sanitize')

const connectDB = require('./config/db')
const globalErrorHandler = require('./middleware/errorHandler')

// Load environment
var configPath = './config/config.env'
if (process.env.NODE_ENV === 'test') {
  configPath = './config/config.test.env'
}
dotenv.config({ path: configPath })

const app = express()

// Setup express
app.use(express.json())
app.use(cookirParser())
app.use(xss())
app.use(mongoSanitize())
app.use(helmet())
app.use(hpp())

// Rate limit
const limiter = rateLimit({
  windowMs: 10 * 60 * 100,
  limit: 100,
})
app.use(limiter)

// Mount routers
app.use('/api/v1/auth', require('./routes/auth'))
app.use('/api/v1/spaces', require('./routes/spaces'))
app.use('/api/v1/reservations', require('./routes/reservations'))

// Root endpoint
app.get('/', (_, res) => {
  res.status(200).json({ message: 'Up and running like a rocket 🚀' })
})

app.use(globalErrorHandler)

if (process.env.NODE_ENV !== 'test') {
  connectDB()

  const PORT = process.env.PORT || 5000
  app.listen(PORT, () => {
    console.log(`  🚀 Server is running at http://127.0.0.1:${PORT}`)
    console.log(`  📦 Using ${process.env.NODE_ENV} environment`)
  })
}

module.exports = app
