const request = require('supertest')
const app = require('../app')
const Space = require('../models/Space')
const User = require('../models/User')
const Reservation = require('../models/Reservation')
const { connectDB, disconnectDB } = require('./memory-server')

let userToken
let adminToken
let spaceId
let roomId

const testSpace = {
  name: 'Time Test Space',
  address: '123 Time Test Street',
  district: 'Test District',
  province: 'Bangkok',
  postalcode: '10110',
  tel: '02-111-1111',
  opentime: '0900',
  closetime: '2100',
  rooms: [
    {
      roomNumber: 'T101',
      capacity: 4,
      facilities: ['WiFi', 'Whiteboard'],
    },
  ],
}

const testUser = {
  name: 'Time User',
  email: 'time-user@test.com',
  password: '123456',
  phone: '0812345678',
}

const testAdmin = {
  name: 'Time Admin',
  email: 'time-admin@test.com',
  password: '123456',
  phone: '0812345679',
  role: 'admin',
}

const createReservationDate = (days = 0, hours = 12, minutes = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

describe('Reservation Time Constraints Tests', () => {
  beforeAll(async () => {
    await connectDB()
    await Space.deleteMany({})
    await User.deleteMany({})
    await Reservation.deleteMany({})

    const user = await User.create(testUser)
    userToken = await user.getSignedJwtToken()

    const admin = await User.create(testAdmin)
    adminToken = await admin.getSignedJwtToken()

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

  describe('Time Validation on Creation', () => {
    it('should accept reservation within operating hours', async () => {
      // 12:00 PM is within 09:00 AM - 09:00 PM
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(1, 12, 0),
          room: roomId,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.room).toBe(roomId)
    })

    it('should reject reservation before opening time', async () => {
      // 8:30 AM is before 9:00 AM opening
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(1, 8, 30),
          room: roomId,
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it('should reject reservation at closing time', async () => {
      // 9:00 PM is at closing time (not allowed)
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(1, 21, 0),
          room: roomId,
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it('should reject reservation after closing time', async () => {
      // 9:30 PM is after 9:00 PM closing
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(1, 21, 30),
          room: roomId,
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it('should accept reservation at opening time', async () => {
      // 9:00 AM is exactly at opening time (allowed)
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(1, 9, 0),
          room: roomId,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
    })

    it('should accept reservation right before closing time', async () => {
      // 8:59 PM is just before 9:00 PM closing (allowed)
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(1, 20, 59),
          room: roomId,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
    })
  })

  describe('Time Validation on Update', () => {
    let reservationId

    beforeEach(async () => {
      // Create a valid reservation first
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(1, 12, 0),
          room: roomId,
        })

      reservationId = res.body.data._id
    })

    it('should accept update within operating hours', async () => {
      const res = await request(app)
        .put(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(2, 14, 30),
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      const updatedTime = new Date(
        res.body.data.reservationDate
      ).getHours()
      expect(updatedTime).toBe(14)
    })

    it('should reject update to time before opening', async () => {
      const res = await request(app)
        .put(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(2, 8, 30),
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it('should reject update to time after closing', async () => {
      const res = await request(app)
        .put(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(2, 21, 30),
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it('should allow admin to update to valid time', async () => {
      const res = await request(app)
        .put(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reservationDate: createReservationDate(3, 15, 0),
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      const updatedTime = new Date(
        res.body.data.reservationDate
      ).getHours()
      expect(updatedTime).toBe(15)
    })

    it('should not allow admin to update to invalid time', async () => {
      const res = await request(app)
        .put(`/api/v1/reservations/${reservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reservationDate: createReservationDate(3, 22, 0),
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })
  })

  describe('Edge Cases for Operating Hours', () => {
    it('should handle midnight opening hours', async () => {
      // Create a space with midnight operating hours
      const midnightSpace = await Space.create({
        ...testSpace,
        name: 'Midnight Space',
        opentime: '0000',
        closetime: '0600',
        rooms: [
          {
            roomNumber: 'M101',
            capacity: 4,
            facilities: ['WiFi'],
          },
        ],
      })

      const midnightSpaceId = midnightSpace._id.toString()
      const midnightRoomId = midnightSpace.rooms[0]._id.toString()

      // Test valid time at 1:00 AM
      const validRes = await request(app)
        .post(`/api/v1/spaces/${midnightSpaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(1, 1, 0),
          room: midnightRoomId,
        })
        .expect(200)

      expect(validRes.body.success).toBe(true)

      // Test invalid time at 7:00 AM
      const invalidRes = await request(app)
        .post(`/api/v1/spaces/${midnightSpaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(1, 7, 0),
          room: midnightRoomId,
        })
        .expect(400)

      expect(invalidRes.body.success).toBe(false)
    })

    it('should handle 24-hour operating space', async () => {
      // Create a space with 24-hour operation
      const fullDaySpace = await Space.create({
        ...testSpace,
        name: '24-Hour Space',
        opentime: '0000',
        closetime: '2359',
        rooms: [
          {
            roomNumber: 'F101',
            capacity: 4,
            facilities: ['WiFi'],
          },
        ],
      })

      const fullDaySpaceId = fullDaySpace._id.toString()
      const fullDayRoomId = fullDaySpace.rooms[0]._id.toString()

      // Test valid time at midnight
      const midnightRes = await request(app)
        .post(`/api/v1/spaces/${fullDaySpaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(1, 0, 0),
          room: fullDayRoomId,
        })
        .expect(200)

      expect(midnightRes.body.success).toBe(true)

      // Test valid time at late night 11:58 PM
      const lateNightRes = await request(app)
        .post(`/api/v1/spaces/${fullDaySpaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: createReservationDate(1, 23, 58),
          room: fullDayRoomId,
        })
        .expect(200)

      expect(lateNightRes.body.success).toBe(true)
    })
  })

  describe('Time Conflict Prevention on Update', () => {
    it('should prevent updating reservation to already booked time', async () => {
      // Create two initial reservations at different times
      const firstBookingTime = createReservationDate(3, 13, 0)
      const secondBookingTime = createReservationDate(3, 17, 0)

      // Book first time slot
      const firstRes = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reservationDate: firstBookingTime,
          room: roomId,
        })
        .expect(200)

      expect(firstRes.body.success).toBe(true)

      // Book second time slot
      const secondRes = await request(app)
        .post(`/api/v1/spaces/${spaceId}/reservations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reservationDate: secondBookingTime,
          room: roomId,
        })
        .expect(200)

      expect(secondRes.body.success).toBe(true)
      const secondReservationId = secondRes.body.data._id

      // Try to update second reservation to the time of first reservation
      const updateRes = await request(app)
        .put(`/api/v1/reservations/${secondReservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reservationDate: firstBookingTime,
        })
        .expect(400)

      expect(updateRes.body.success).toBe(false)

      // Verify the second reservation remains unchanged
      const checkRes = await request(app)
        .get(`/api/v1/reservations/${secondReservationId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      const reservationTime = new Date(checkRes.body.data.reservationDate)
      expect(reservationTime.getHours()).toBe(17)
    })
  })
})
