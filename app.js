const express = require('express')
const dotenv = require('dotenv')
const cookirParser = require('cookie-parser')

const connectDB = require('./config/db')
const globalErrorHandler = require('./middleware/errorHandler')

// Load environment
var configPath = './config/config.env'
if (process.env.NODE_ENV === 'test') {
  configPath = './config/config.test.env'
}
dotenv.config({ path: configPath })

const app = express()

// Middleware for parsing JSON bodies
app.use(express.json())
app.use(cookirParser())

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
