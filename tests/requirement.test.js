const request = require('supertest')
const app = require('../app')
const Space = require('../models/Space')
const User = require('../models/User')
const Reservation = require('../models/Reservation')
const { connectDB, disconnectDB } = require('./memory-server')
const { testUser, testUser2, testAdmin, testSpace } = require('./data')

let adminToken
let userToken
let user2Token
let userId
let spaceId
let roomId
let reservationId
let reservation2Id
let reservation3Id

const createValidReservationDate = (nextNDays, hour, minute = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + nextNDays)
  date.setUTCHours(hour, minute, 0, 0)
  return date.toISOString()
}

const reservationDate = (nextNDays, timeOffset = 0) => {
  const openHour = parseInt(testSpace.opentime.substring(0, 2))
  const closeHour = parseInt(testSpace.closetime.substring(0, 2)) - 1

  const validHour = openHour + 1 + (timeOffset % (closeHour - openHour - 1))

  return createValidReservationDate(nextNDays, validHour, 30)
}

const invalidReservationDate = (nextNDays, beforeOpening = true) => {
  const openHour = parseInt(testSpace.opentime.substring(0, 2))
  const closeHour = parseInt(testSpace.closetime.substring(0, 2))

  const hour = beforeOpening ? openHour - 1 : closeHour + 1

  return createValidReservationDate(nextNDays, hour, 0)
}

describe('System Requirements Tests', () => {
  beforeAll(async () => {
    await connectDB()
    await User.deleteMany({})
    await Space.deleteMany({})
    await Reservation.deleteMany({})

    const space = await Space.create(testSpace)
    spaceId = space._id.toString()
    roomId = space.rooms[0]._id.toString()
  })

  afterAll(async () => {
    await disconnectDB()
  })

  // Requirement 1: User Registration
  describe('Requirement 1: User Registration', () => {
    it('should allow a user to register with name, phone, email, and password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.token).toBeDefined()
      userToken = res.body.data.token

      const userRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)

      userId = userRes.body.data._id

      const res2 = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser2)
        .expect(200)

      expect(res2.body.success).toBe(true)
      user2Token = res2.body.data.token

      const user2Res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${user2Token}`)

      user2Id = user2Res.body.data._id

      const adminRes = await request(app)
        .post('/api/v1/auth/register')
        .send(testAdmin)
        .expect(200)

      adminToken = adminRes.body.data.token

      const adminMeRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)

      adminId = adminMeRes.body.data._id
    })

    it('should reject registration with missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Incomplete User',
          email: 'incomplete@test.com',
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })
  })

  // Requirement 2: Login and Logout
  describe('Requirement 2: Login and Logout', () => {
    it('should allow a registered user to log in with email and password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.token).toBeDefined()
    })

    it('should reject login with incorrect credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401)

      expect(res.body.success).toBe(false)
    })

    it('should allow a registered user to log out', async () => {
      const res = await request(app).get('/api/v1/auth/logout').expect(200)

      expect(res.body.success).toBe(true)
      expect(res.headers['set-cookie'][0]).toMatch(/token=none/)
    })
  })

  // Requirement 3: Reservation Creation
  describe('Requirement 3: Make Reservations (Up to 3)', () => {
    it('should allow a registered user to view co-working space list', async () => {
      const res = await request(app).get('/api/v1/spaces').expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.spaces).toHaveLength(1)
      expect(res.body.data.spaces[0].name).toBe(testSpace.name)
      expect(res.body.data.spaces[0].tel).toBe(testSpace.tel)
      expect(res.body.data.spaces[0].opentime).toBe(testSpace.opentime)
      expect(res.body.data.spaces[0].closetime).toBe(testSpace.closetime)
    })

    it('should allow a registered user to make a first reservation', async () => {
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: reservationDate(1),
          room: roomId,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.user).toBe(userId)
      expect(res.body.data.space).toBe(spaceId)
      reservationId = res.body.data._id
    })

    it('should allow a registered user to make a second reservation', async () => {
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: reservationDate(2, 1),
          room: roomId,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.user).toBe(userId)
      reservation2Id = res.body.data._id
    })

    it('should allow a registered user to make a third reservation', async () => {
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: reservationDate(3, 2),
          room: roomId,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.user).toBe(userId)
      reservation3Id = res.body.data._id
    })

    it('should prevent a registered user from making a fourth reservation', async () => {
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: reservationDate(4),
          room: roomId,
        })
        .expect(409)

      expect(res.body.success).toBe(false)
    })

    it('should reject reservations outside operating hours', async () => {
      const resBefore = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reservationDate: invalidReservationDate(1, true),
          room: roomId,
        })
        .expect(400)

      expect(resBefore.body.success).toBe(false)

      const resAfter = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reservationDate: invalidReservationDate(1, false),
          room: roomId,
        })
        .expect(400)

      expect(resAfter.body.success).toBe(false)
    })

    it('should allow admin to make more than three reservations', async () => {
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/api/v1/spaces/${spaceId}/reservations`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reservationDate: reservationDate(i + 1, i + 3),
            room: roomId,
          })
      }

      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reservationDate: reservationDate(4, 6),
          room: roomId,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
    })
  })

  // Requirement 4: View Reservations
  describe('Requirement 4: View User Reservations', () => {
    it('should allow a registered user to view their reservations', async () => {
      const res = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.count).toBe(3)
      expect(res.body.data.length).toBe(3)

      const allUserReservations = res.body.data.every(
        (reservation) => reservation.user === userId,
      )
      expect(allUserReservations).toBe(true)
    })

    it("should not show other users' reservations", async () => {
      await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reservationDate: reservationDate(1, 7),
          room: roomId,
        })

      const res = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.count).toBe(3)

      const allUserReservations = res.body.data.every(
        (reservation) => reservation.user === userId,
      )
      expect(allUserReservations).toBe(true)
    })
  })

  // Requirement 5: Edit Reservations
  describe('Requirement 5: Edit User Reservations', () => {
    it('should allow a registered user to edit their reservation', async () => {
      const newDate = reservationDate(5, 8)
      const res = await request(app)
        .put(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: newDate,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(new Date(res.body.data.reservationDate).toISOString()).toBe(
        newDate,
      )
    })

    it('should prevent updating to a time outside operating hours', async () => {
      const res = await request(app)
        .put(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: invalidReservationDate(2, false),
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it("should prevent a registered user from editing other users' reservations", async () => {
      const otherRes = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reservationDate: reservationDate(3, 9),
          room: roomId,
        })

      const otherReservationId = otherRes.body.data._id
      await request(app)
        .put(`/api/v1/reservations/${otherReservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: reservationDate(2),
        })
        .expect(401)
    })
  })

  // Requirement 6: Delete Reservations
  describe('Requirement 6: Delete User Reservations', () => {
    it('should allow a registered user to delete their reservation', async () => {
      const res = await request(app)
        .delete(`/api/v1/reservations/${reservation3Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)

      await request(app)
        .get(`/api/v1/reservations/${reservation3Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)
    })

    it("should prevent a registered user from deleting other users' reservations", async () => {
      const otherRes = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reservationDate: reservationDate(3, 10),
          room: roomId,
        })

      const otherReservationId = otherRes.body.data._id
      await request(app)
        .delete(`/api/v1/reservations/${otherReservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401)

      await request(app)
        .get(`/api/v1/reservations/${otherReservationId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(200)
    })
  })

  // Requirement 7: Admin View Any Reservation
  describe('Requirement 7: Admin View Any Reservation', () => {
    it('should allow admin to view all reservations', async () => {
      const res = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)

      expect(res.body.count).toBeGreaterThan(5)
    })

    it('should allow admin to view specific user reservations', async () => {
      const res = await request(app)
        .get(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data._id).toBe(reservationId)
    })
  })

  // Requirement 8: Admin Edit Any Reservation
  describe('Requirement 8: Admin Edit Any Reservation', () => {
    it("should allow admin to edit any user's reservation", async () => {
      const newDate = reservationDate(6, 11)
      const res = await request(app)
        .put(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reservationDate: newDate,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(new Date(res.body.data.reservationDate).toISOString()).toBe(
        newDate,
      )
      expect(res.body.data.user).toBe(userId)
    })
  })

  // Requirement 9: Admin Delete Any Reservation
  describe('Requirement 9: Admin Delete Any Reservation', () => {
    it("should allow admin to delete any user's reservation", async () => {
      const res = await request(app)
        .delete(`/api/v1/reservations/${reservation2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)

      await request(app)
        .get(`/api/v1/reservations/${reservation2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
    })
  })
})
