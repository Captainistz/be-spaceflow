const mongoose = require('mongoose')

const connectDB = async () => {
  mongoose.set('strictQuery', false)

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(`  🍃 MongoDB connected at ${conn.connection.host}`)
  } catch (e) {
    console.error(`Error: ${e}`)
    process.exit(1)
  }
}

module.exports = connectDB
