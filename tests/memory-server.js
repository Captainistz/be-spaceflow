const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

let mongoServer

const connectDB = async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
}

const disconnectDB = async () => {
  await mongoose.connection.close()
  await mongoServer.stop()
}

module.exports = {
  connectDB,
  disconnectDB,
}
