const request = require('supertest')
const app = require('../app')
const Space = require('../models/Space')
const User = require('../models/User')
const Reservation = require('../models/Reservation')
const { connectDB, disconnectDB } = require('./memory-server')

let adminToken
let userToken
let user2Token
let userId
let spaceId
let roomId
let reservationId
let reservation2Id
let reservation3Id

const testSpace = {
  name: 'Test Space for Requirements',
  address: '123 Requirements Street',
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
  ],
}

const testUser = {
  name: 'Test User',
  email: 'testuser@requirements.com',
  password: '123456',
  phone: '0811111111',
}

const testUser2 = {
  name: 'Test User 2',
  email: 'testuser2@requirements.com',
  password: '123456',
  phone: '0822222222',
}

const testAdmin = {
  name: 'Admin User',
  email: 'admin@requirements.com',
  password: '123456',
  phone: '0833333333',
  role: 'admin',
}

const testReservation = {
  reservationDate: new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ).toISOString(),
}

describe('System Requirements Tests', () => {
  // Connect to test database before all tests
  beforeAll(async () => {
    await connectDB()
    await User.deleteMany({})
    await Space.deleteMany({})
    await Reservation.deleteMany({})

    // Create test space
    const space = await Space.create(testSpace)
    spaceId = space._id.toString()
    roomId = space.rooms[0]._id.toString()
  })

  // Cleanup after all tests
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
      expect(res.body.token).toBeDefined()
      userToken = res.body.token

      // Get user ID for future tests
      const userRes = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)

      userId = userRes.body.data._id

      // Register second user for testing
      const res2 = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser2)
        .expect(200)

      expect(res2.body.success).toBe(true)
      user2Token = res2.body.token

      const user2Res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${user2Token}`)

      user2Id = user2Res.body.data._id

      // Register admin for testing
      const adminRes = await request(app)
        .post('/api/v1/auth/register')
        .send(testAdmin)
        .expect(200)

      adminToken = adminRes.body.token

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
          // Missing phone and password
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
      expect(res.body.token).toBeDefined()
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
      // Check cookie clearing in response headers
      expect(res.headers['set-cookie'][0]).toMatch(/token=none/)
    })
  })

  // Requirement 3: Reservation Creation
  describe('Requirement 3: Make Reservations (Up to 3)', () => {
    it('should allow a registered user to view co-working space list', async () => {
      const res = await request(app).get('/api/v1/spaces').expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].name).toBe(testSpace.name)
      expect(res.body.data[0].tel).toBe(testSpace.tel)
      expect(res.body.data[0].opentime).toBe(testSpace.opentime)
      expect(res.body.data[0].closetime).toBe(testSpace.closetime)
    })

    it('should allow a registered user to make a first reservation', async () => {
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
      reservationId = res.body.data._id
    })

    it('should allow a registered user to make a second reservation', async () => {
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: new Date(
            Date.now() + 48 * 60 * 60 * 1000
          ).toISOString(),
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
          reservationDate: new Date(
            Date.now() + 72 * 60 * 60 * 1000
          ).toISOString(),
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
          reservationDate: new Date(
            Date.now() + 96 * 60 * 60 * 1000
          ).toISOString(),
          room: roomId,
        })
        .expect(409) // Conflict - over maximum allowed

      expect(res.body.success).toBe(false)
    })

    it('should allow admin to make more than three reservations', async () => {
      // First make 3 reservations
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post(`/api/v1/spaces/${spaceId}/reservations`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reservationDate: new Date(
              Date.now() + (i + 1) * 24 * 60 * 60 * 1000
            ).toISOString(),
            room: roomId,
          })
      }

      // Try to make a fourth reservation
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reservationDate: new Date(
            Date.now() + 96 * 60 * 60 * 1000
          ).toISOString(),
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

      // Verify all reservations belong to the user
      const allUserReservations = res.body.data.every(
        (reservation) => reservation.user === userId
      )
      expect(allUserReservations).toBe(true)
    })

    it("should not show other users' reservations", async () => {
      // Create a reservation for second user
      await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reservationDate: new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toISOString(),
          room: roomId,
        })

      // First user should still only see their own reservations
      const res = await request(app)
        .get('/api/v1/reservations')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.count).toBe(3)

      // Verify all reservations belong to the user
      const allUserReservations = res.body.data.every(
        (reservation) => reservation.user === userId
      )
      expect(allUserReservations).toBe(true)
    })
  })

  // Requirement 5: Edit Reservations
  describe('Requirement 5: Edit User Reservations', () => {
    it('should allow a registered user to edit their reservation', async () => {
      const newDate = new Date(
        Date.now() + 120 * 60 * 60 * 1000
      ).toISOString()

      const res = await request(app)
        .put(`/api/v1/reservations/${reservationId}`)
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

    it("should prevent a registered user from editing other users' reservations", async () => {
      // Create a reservation for second user
      const otherRes = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reservationDate: new Date(
            Date.now() + 36 * 60 * 60 * 1000
          ).toISOString(),
          room: roomId,
        })

      const otherReservationId = otherRes.body.data._id

      // First user should not be able to edit second user's reservation
      await request(app)
        .put(`/api/v1/reservations/${otherReservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: new Date(
            Date.now() + 48 * 60 * 60 * 1000
          ).toISOString(),
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

      // Verify the reservation was deleted
      const verifyRes = await request(app)
        .get(`/api/v1/reservations/${reservation3Id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)
    })

    it("should prevent a registered user from deleting other users' reservations", async () => {
      // Create a reservation for second user
      const otherRes = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          reservationDate: new Date(
            Date.now() + 84 * 60 * 60 * 1000
          ).toISOString(),
          room: roomId,
        })

      const otherReservationId = otherRes.body.data._id

      // First user should not be able to delete second user's reservation
      await request(app)
        .delete(`/api/v1/reservations/${otherReservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(401)

      // Verify the reservation still exists
      const verifyRes = await request(app)
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

      // Should see both user's and admin's reservations
      expect(res.body.count).toBeGreaterThan(5) // At least 6 reservations from all tests
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
      const newDate = new Date(
        Date.now() + 144 * 60 * 60 * 1000
      ).toISOString()

      const res = await request(app)
        .put(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reservationDate: newDate,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(new Date(res.body.data.reservationDate).toISOString()).toBe(
        newDate
      )
      expect(res.body.data.user).toBe(userId) // Still belongs to original user
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

      // Verify the reservation was deleted
      const verifyRes = await request(app)
        .get(`/api/v1/reservations/${reservation2Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
    })
  })
})
