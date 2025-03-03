const mongoose = require('mongoose')
const request = require('supertest')
const app = require('../app')
const Space = require('../models/Space')
const User = require('../models/User')
const { connectDB, disconnectDB } = require('./memory-server')

let adminToken
let userToken
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
  ],
}

const testRoom = {
  roomNumber: 'R102',
  capacity: 8,
  facilities: ['Projector', 'Conference Phone', 'WiFi'],
}

const testAdmin = {
  name: 'Admin User',
  email: 'admin-room@test.com',
  password: '123456',
  phone: '0812345678',
  role: 'admin',
}

const testUser = {
  name: 'Regular User',
  email: 'user-room@test.com',
  password: '123456',
  phone: '0812345679',
}

describe('Rooms endpoint tests', () => {
  // Connect to test database before all tests
  beforeAll(async () => {
    await connectDB()
    await Space.deleteMany({})
    await User.deleteMany({})

    // Create test users and get tokens
    const admin = await User.create(testAdmin)
    adminToken = await admin.getSignedJwtToken()

    const user = await User.create(testUser)
    userToken = await user.getSignedJwtToken()

    // Create a test space
    const space = await Space.create(testSpace)
    spaceId = space._id.toString()
    roomId = space.rooms[0]._id.toString()
  })

  // Cleanup after all tests
  afterAll(async () => {
    await disconnectDB()
  })

  describe('GET /api/v1/spaces/:space_id/rooms', () => {
    it('should get all rooms for a space', async () => {
      const res = await request(app)
        .get(`/api/v1/spaces/${spaceId}/rooms`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].roomNumber).toBe(
        testSpace.rooms[0].roomNumber
      )
    })

    it('should return 404 for non-existent space', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app).get(`/api/v1/spaces/${fakeId}/rooms`).expect(404)
    })
  })

  describe('GET /api/v1/spaces/:space_id/rooms/:id', () => {
    it('should get a specific room', async () => {
      const res = await request(app)
        .get(`/api/v1/spaces/${spaceId}/rooms/${roomId}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.roomNumber).toBe(testSpace.rooms[0].roomNumber)
      expect(res.body.data.capacity).toBe(testSpace.rooms[0].capacity)
    })

    it('should return 404 for non-existent room', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .get(`/api/v1/spaces/${spaceId}/rooms/${fakeId}`)
        .expect(404)
    })
  })

  describe('POST /api/v1/spaces/:space_id/rooms', () => {
    it('should prevent unauthorized room creation', async () => {
      await request(app)
        .post(`/api/v1/spaces/${spaceId}/rooms`)
        .send(testRoom)
        .expect(401)
    })

    it('should prevent non-admin room creation', async () => {
      await request(app)
        .post(`/api/v1/spaces/${spaceId}/rooms`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(testRoom)
        .expect(403)
    })

    it('should allow admin to create room', async () => {
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/rooms`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testRoom)
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.roomNumber).toBe(testRoom.roomNumber)
      expect(res.body.data.capacity).toBe(testRoom.capacity)
    })

    it('should validate required room fields', async () => {
      const res = await request(app)
        .post(`/api/v1/spaces/${spaceId}/rooms`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          // Missing required fields
          facilities: ['WiFi'],
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it('should return 404 when adding room to non-existent space', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .post(`/api/v1/spaces/${fakeId}/rooms`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testRoom)
        .expect(404)
    })
  })

  describe('PUT /api/v1/spaces/:space_id/rooms/:id', () => {
    let newRoomId
    let timestamp

    beforeEach(async () => {
      // Create a new room for update tests with timestamp to ensure uniqueness
      timestamp = Date.now().toString().slice(-4)
      const uniqueRoomNumber = `R${timestamp}`
      const space = await Space.findById(spaceId)
      const newRoom = {
        roomNumber: uniqueRoomNumber,
        capacity: 6,
        facilities: ['TV', 'WiFi'],
      }
      space.rooms.push(newRoom)
      await space.save()
      newRoomId = space.rooms[space.rooms.length - 1]._id.toString()
    })

    it('should prevent unauthorized room update', async () => {
      await request(app)
        .put(`/api/v1/spaces/${spaceId}/rooms/${newRoomId}`)
        .send({ capacity: 10 })
        .expect(401)
    })

    it('should prevent non-admin room update', async () => {
      await request(app)
        .put(`/api/v1/spaces/${spaceId}/rooms/${newRoomId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ capacity: 10 })
        .expect(403)
    })

    it('should allow admin to update room', async () => {
      const res = await request(app)
        .put(`/api/v1/spaces/${spaceId}/rooms/${newRoomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          capacity: 10,
          facilities: ['Updated', 'Facilities'],
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.capacity).toBe(10)
      expect(res.body.data.facilities).toEqual(['Updated', 'Facilities'])
      expect(res.body.data.roomNumber).toBe(`R${timestamp}`) // Should keep original roomNumber
    })

    it('should allow admin to update roomNumber to a new unique value', async () => {
      const newUniqueRoomNumber = `RU${timestamp}`
      const res = await request(app)
        .put(`/api/v1/spaces/${spaceId}/rooms/${newRoomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roomNumber: newUniqueRoomNumber,
          capacity: 10,
        })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.roomNumber).toBe(newUniqueRoomNumber)
    })

    it('should prevent updating to a duplicate roomNumber', async () => {
      // Try to update the room to have the same number as the existing first room
      const res = await request(app)
        .put(`/api/v1/spaces/${spaceId}/rooms/${newRoomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          roomNumber: 'R101', // This roomNumber already exists in testSpace
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it('should return 404 for non-existent room', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .put(`/api/v1/spaces/${spaceId}/rooms/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ capacity: 10 })
        .expect(404)
    })
  })

  describe('DELETE /api/v1/spaces/:space_id/rooms/:id', () => {
    let deleteRoomId

    beforeEach(async () => {
      // Create a new room for deletion tests
      const space = await Space.findById(spaceId)
      space.rooms = space.rooms.filter(
        (room) => room.roomNumber !== 'R199'
      )
      const roomToDelete = {
        roomNumber: 'R199',
        capacity: 15,
        facilities: ['Whiteboard', 'WiFi'],
      }
      space.rooms.push(roomToDelete)
      await space.save()
      deleteRoomId = space.rooms[space.rooms.length - 1]._id.toString()
    })

    it('should prevent unauthorized room deletion', async () => {
      await request(app)
        .delete(`/api/v1/spaces/${spaceId}/rooms/${deleteRoomId}`)
        .expect(401)
    })

    it('should prevent non-admin room deletion', async () => {
      await request(app)
        .delete(`/api/v1/spaces/${spaceId}/rooms/${deleteRoomId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403)
    })

    it('should allow admin to delete room', async () => {
      const res = await request(app)
        .delete(`/api/v1/spaces/${spaceId}/rooms/${deleteRoomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)

      // Verify room is removed
      const space = await Space.findById(spaceId)
      const deletedRoom = space.rooms.find(
        (r) => r._id.toString() === deleteRoomId
      )
      expect(deletedRoom).toBeUndefined()
    })

    it('should return 404 for non-existent room', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .delete(`/api/v1/spaces/${spaceId}/rooms/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
    })

    it('should return 404 for non-existent space', async () => {
      const fakeId = new mongoose.Types.ObjectId()
      await request(app)
        .delete(`/api/v1/spaces/${fakeId}/rooms/${deleteRoomId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
    })
  })
})
