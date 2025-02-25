const express = require('express')
const dotenv = require('dotenv')
const cookirParser = require('cookie-parser')

const connectDB = require('./config/db')
const globalErrorHandler = require('./middleware/errorHandler')

// Load environment
dotenv.config({ path: './config/config.env' })

connectDB()

const app = express()

// Middleware for parsing JSON bodies
app.use(express.json())
app.use(cookirParser())

// Mount routers
app.use('/api/v1/auth', require('./routes/auth'))
app.use('/api/v1/coworkingspace', require('./routes/coworkingspace'))

// Root endpoint
app.get('/', (_, res) => {
  res.status(200).json({ message: 'Up and running like a rocket 🚀' })
})

app.use(globalErrorHandler)

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`  🚀 Server is running at http://127.0.0.1:${PORT}`)
  console.log(`  📦 Using ${process.env.NODE_ENV} environment`)
})

process.on('unhandledRejection', (e, _) => {
  console.error(e)
  server.close(() => {
    process.exit(1)
  })
})
