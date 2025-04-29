const cors = require('cors')
const hpp = require('hpp')
const dotenv = require('dotenv')
const helmet = require('helmet')
const morgan = require('morgan')
const express = require('express')
const cookirParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const { xss } = require('express-xss-sanitizer')
const mongoSanitize = require('express-mongo-sanitize')
const connectDB = require('./utils/db')
const globalErrorHandler = require('./middleware/errorHandler')
const initCronjobs = require('./utils/cron')

const swaggerJSDoc = require('swagger-jsdoc')
const swaggerUI = require('swagger-ui-express')

// Load environment
var configPath = './config/config.env'
if (process.env.NODE_ENV === 'test') {
  configPath = './config/config.test.env'
}

dotenv.config({ path: configPath })

const app = express()

const PORT = process.env.PORT || 5000

// Swagger
const swggerOption = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'Library API',
      version: '1.0.0',
      description: 'CWS Express API',
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api/v1`,
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // Optional, but recommended
        },
      },
    },
    security: [
      {
        bearerAuth: [], // Apply globally to all routes
      },
    ],
  },
  apis: ['./routes/*.js'],
}

const swaggerDocs = swaggerJSDoc(swggerOption)
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs))

// Setup express
app.use(cors())
app.use(express.json())
app.use(cookirParser())
app.use(mongoSanitize())
app.use(xss())
app.use(helmet())
app.use(hpp())

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Rate limit
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 10 * 60 * 100,
    limit: 100,
  })
  app.use(limiter)
}

// Mount routers
app.use('/api/v1/auth', require('./routes/auth'))
app.use('/api/v1/spaces', require('./routes/spaces'))
app.use('/api/v1/events', require('./routes/event'))
app.use('/api/v1/reservations', require('./routes/reservations'))
app.use('/api/v1/getReservationByRoom', require('./routes/getReservesByRoom'))
app.use('/api/v1/users', require('./routes/users'))

// Root endpoint
app.get('/', (_, res) => {
  res.status(200).json({ message: 'Up and running like a rocket 🚀' })
})

app.use(globalErrorHandler)

if (process.env.NODE_ENV !== 'test') {
  connectDB().then(async () => {
    await initCronjobs()
  })

  app.listen(PORT, () => {
    console.log(`  🚀 Server is running at http://127.0.0.1:${PORT}`)
    console.log(`  📦 Using ${process.env.NODE_ENV} environment`)
  })
}

module.exports = app
