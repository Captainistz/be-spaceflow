const mongoose = require('mongoose')
const request = require('supertest')
const app = require('../app')
const Space = require('../models/Space')
const User = require('../models/User')
const Reservation = require('../models/Reservation')
const { connectDB, disconnectDB } = require('./memory-server')

let adminToken
let userToken

let adminId
let userId
let spaceId
let roomId

const testSpace = {
  name: 'Test Space for Rooms',
  address: '123 Room Test Street',
  district: 'Test District',
  province: 'Bangkok',
  postalcode: '10110',
  tel: '02-111-1111',
  opentime: '0900',
  closetime: '2100',
  rooms: [
    {
      roomNumber: 'R101',
      capacity: 4,
      facilities: ['WiFi', 'Whiteboard'],
    },
    {
      roomNumber: 'R102',
      capacity: 8,
      facilities: ['WiFi', 'Projector'],
    },
    {
      roomNumber: 'R103',
      capacity: 4,
      facilities: ['WiFi', 'Printer', 'Whiteboard'],
    },
  ],
}

const testAdmin = {
  name: 'Admin User',
  email: 'admin@test.com',
  password: '123456',
  phone: '0812345678',
  role: 'admin',
}

const testUser = {
  name: 'Regular User',
  email: 'user@test.com',
  password: '123456',
  phone: '0812345679',
}

const testReservation = {
  reservationDate: new Date(
    Date.now() + 48 * 60 * 60 * 1000
  ).toISOString(), // 2 days in future
}

describe('Reservations endpoint tests', () => {
  beforeAll(async () => {
    await connectDB()
    await Space.deleteMany({})
    await User.deleteMany({})
    await Reservation.deleteMany({})

    const admin = await User.create(testAdmin)
    adminToken = await admin.getSignedJwtToken()
    adminId = admin._id.toString()

    const user = await User.create(testUser)
    userToken = await user.getSignedJwtToken()
    userId = user._id.toString()

    const space = await Space.create(testSpace)
    spaceId = space._id.toString()
    roomId = space.rooms[0]._id.toString()
  })

  afterAll(async () => {
    await disconnectDB()
  })

  beforeEach(async () => {
    await Reservation.deleteMany({})
  })

  describe('POST /api/v1/spaces/:space_id/reservations', () => {
    it('should prevent unauthorized reservation creation', async () => {
      await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .send({
          ...testReservation,
          room: roomId,
        })
        .expect(401)
    })

    it('should allow user to create a reservation', async () => {
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...testReservation,
          room: roomId,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.user).toBe(userId)
      expect(res.body.data.space).toBe(spaceId)
      expect(res.body.data.room).toBe(roomId)

      reservationId = res.body.data._id
    })

    it('should allow admin to create a reservation', async () => {
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ...testReservation,
          room: roomId,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.user).toBe(adminId)
    })

    it('should validate required fields', async () => {
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          // Missing reservationDate
          room: roomId,
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it('should return 404 for non-existent space', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .post(`/api/v1/spaces/${fakeId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...testReservation,
          room: roomId,
        })
        .expect(404)
    })

    it('should return 404 for non-existent room', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...testReservation,
          room: fakeId,
        })
        .expect(404)
    })

    it('should enforce maximum reservations limit for users', async () => {
      // Create maximum allowed reservations
      const maxReservations = process.env.MAXIMUM_RESERVATIONS || 3
      const reservationPromises = []

      for (let i = 0; i < maxReservations; i++) {
        reservationPromises.push(
          request(app)
            .post(`/api/v1/spaces/${spaceId}/reservations`)
            .set('Authorization', `Bearer ${userToken}`)
            .send({
              reservationDate: new Date(
                Date.now() + (i + 1) * 24 * 60 * 60 * 1000
              ).toISOString(), // different dates
              room: roomId,
            })
        )
      }

      await Promise.all(reservationPromises)

      // Try to create one more reservation
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          ...testReservation,
          room: roomId,
        })
        .expect(409)

      expect(res.body.success).toBe(false)
    })

    it('should not enforce maximum reservations limit for admins', async () => {
      // Create more than maximum allowed reservations for admin
      const maxReservations = process.env.MAXIMUM_RESERVATIONS || 3
      const reservationPromises = []

      for (let i = 0; i < maxReservations + 1; i++) {
        reservationPromises.push(
          request(app)
            .post(`/api/v1/spaces/${spaceId}/reservations`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              reservationDate: new Date(
                Date.now() + (i + 1) * 24 * 60 * 60 * 1000
              ).toISOString(), // different dates
              room: roomId,
            })
        )
      }

      const results = await Promise.all(reservationPromises)
      const lastResult = results[results.length - 1]

      expect(lastResult.status).toBe(200)
      expect(lastResult.body.success).toBe(true)
    })
  })

  describe('GET /api/v1/reservations', () => {
    beforeEach(async () => {
      // Create test reservations
      await Reservation.create({
        user: userId,
        space: spaceId,
        room: roomId,
        reservationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })

      await Reservation.create({
        user: adminId,
        space: spaceId,
        room: roomId,
        reservationDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      })
    })

    it('should get user reservations for regular user', async () => {
      const res = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].user).toBe(userId)
    })

    it('should get all reservations for admin', async () => {
      const res = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(2)
    })

    it('should prevent unauthorized access', async () => {
      await request(app).get('/api/v1/reservations').expect(401)
    })

    it('should allow admin to filter by space', async () => {
      const res = await request(app)
        .get(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.data[0].space._id).toBe(spaceId)
    })
  })

  describe('GET /api/v1/reservations/:id', () => {
    let userReservationId
    let adminReservationId

    beforeEach(async () => {
      // Create test reservations
      const userReservation = await Reservation.create({
        user: userId,
        space: spaceId,
        room: roomId,
        reservationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      userReservationId = userReservation._id.toString()

      const adminReservation = await Reservation.create({
        user: adminId,
        space: spaceId,
        room: roomId,
        reservationDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      })
      adminReservationId = adminReservation._id.toString()
    })

    it('should get specific reservation for owner user', async () => {
      const res = await request(app)
        .get(`/api/v1/reservations/${userReservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data._id).toBe(userReservationId)
      expect(res.body.data.user).toBe(userId)
    })

    it('should get any reservation for admin', async () => {
      const res = await request(app)
        .get(`/api/v1/reservations/${userReservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data._id).toBe(userReservationId)
    })

    it('should return 404 for non-existent reservation', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .get(`/api/v1/reservations/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)
    })

    it('should prevent unauthorized access', async () => {
      await request(app)
        .get(`/api/v1/reservations/${userReservationId}`)
        .expect(401)
    })
  })

  describe('PUT /api/v1/reservations/:id', () => {
    let userReservationId
    let adminReservationId

    beforeEach(async () => {
      // Create test reservations
      const userReservation = await Reservation.create({
        user: userId,
        space: spaceId,
        room: roomId,
        reservationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      userReservationId = userReservation._id.toString()

      const adminReservation = await Reservation.create({
        user: adminId,
        space: spaceId,
        room: roomId,
        reservationDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      })
      adminReservationId = adminReservation._id.toString()
    })

    it('should allow user to update their own reservation', async () => {
      const newDate = new Date(
        Date.now() + 72 * 60 * 60 * 1000
      ).toISOString()
      const res = await request(app)
        .put(`/api/v1/reservations/${userReservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: newDate,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(new Date(res.body.data.reservationDate).toISOString()).toBe(
        newDate
      )
    })

    it('should prevent user from updating other users reservations', async () => {
      await request(app)
        .put(`/api/v1/reservations/${adminReservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: new Date(
            Date.now() + 96 * 60 * 60 * 1000
          ).toISOString(),
        })
        .expect(401)
    })

    it('should allow admin to update any reservation', async () => {
      const newDate = new Date(
        Date.now() + 72 * 60 * 60 * 1000
      ).toISOString()
      const res = await request(app)
        .put(`/api/v1/reservations/${userReservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reservationDate: newDate,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(new Date(res.body.data.reservationDate).toISOString()).toBe(
        newDate
      )
    })

    it('should return 404 for non-existent reservation', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .put(`/api/v1/reservations/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: new Date(
            Date.now() + 96 * 60 * 60 * 1000
          ).toISOString(),
        })
        .expect(404)
    })

    it('should prevent unauthorized access', async () => {
      await request(app)
        .put(`/api/v1/reservations/${userReservationId}`)
        .send({
          reservationDate: new Date(
            Date.now() + 96 * 60 * 60 * 1000
          ).toISOString(),
        })
        .expect(401)
    })
  })

  describe('DELETE /api/v1/reservations/:id', () => {
    let userReservationId
    let adminReservationId

    beforeEach(async () => {
      // Create test reservations
      const userReservation = await Reservation.create({
        user: userId,
        space: spaceId,
        room: roomId,
        reservationDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })
      userReservationId = userReservation._id.toString()

      const adminReservation = await Reservation.create({
        user: adminId,
        space: spaceId,
        room: roomId,
        reservationDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      })
      adminReservationId = adminReservation._id.toString()
    })

    it('should allow user to delete their own reservation', async () => {
      const res = await request(app)
        .delete(`/api/v1/reservations/${userReservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)

      // Verify reservation is deleted
      const deleted = await Reservation.findById(userReservationId)
      expect(deleted).toBeNull()
    })

    it('should prevent user from deleting other users reservations', async () => {
      await request(app)
        .delete(`/api/v1/reservations/${adminReservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401)

      // Verify reservation still exists
      const stillExists = await Reservation.findById(adminReservationId)
      expect(stillExists).not.toBeNull()
    })

    it('should allow admin to delete any reservation', async () => {
      const res = await request(app)
        .delete(`/api/v1/reservations/${userReservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)

      // Verify reservation is deleted
      const deleted = await Reservation.findById(userReservationId)
      expect(deleted).toBeNull()
    })

    it('should return 404 for non-existent reservation', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .delete(`/api/v1/reservations/${fakeId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)
    })

    it('should prevent unauthorized access', async () => {
      await request(app)
        .delete(`/api/v1/reservations/${userReservationId}`)
        .expect(401)
    })
  })
})
