const express = require('express')
const dotenv = require('dotenv')

// Load environment
dotenv.config({ path: './config/config.env' })

const app = express()

// Middleware for parsing JSON bodies
app.use(express.json())

// Root endpoint
app.get('/', (_, res) => {
  res.status(200).json({ message: 'Up and running like a rocket 🚀' })
})

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
