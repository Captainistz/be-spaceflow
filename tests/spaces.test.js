const mongoose = require('mongoose')
const request = require('supertest')
const app = require('../app')
const Space = require('../models/Space')
const User = require('../models/User')

let adminToken
let userToken

const testSpace = {
  name: 'Test Space',
  address: '123 Test Street',
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

describe('Spaces endpoint tests', () => {
  // Connect to test database before all tests
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI)
    await Space.deleteMany({})
    await User.deleteMany({})

    // Create test users and get tokens
    const adminRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testAdmin)
    adminToken = adminRes.body.token

    const userRes = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser)
    userToken = userRes.body.token
  })

  // Cleanup after all tests
  afterAll(async () => {
    await mongoose.connection.close()
  })

  // Clear database before each test
  beforeEach(async () => {
    await Space.deleteMany({})
  })

  describe('GET /api/v1/spaces', () => {
    it('should return empty array when no spaces exist', async () => {
      const res = await request(app).get('/api/v1/spaces').expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(0)
    })

    it('should return all spaces', async () => {
      await Space.create(testSpace)

      const res = await request(app).get('/api/v1/spaces').expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].name).toBe(testSpace.name)
    })
  })

  describe('POST /api/v1/spaces', () => {
    it('should prevent unauthorized creation', async () => {
      await request(app).post('/api/v1/spaces').send(testSpace).expect(401)
    })

    it('should prevent non-admin creation', async () => {
      await request(app)
        .post('/api/v1/spaces')
        .set('Authorization', `Bearer ${userToken}`)
        .send(testSpace)
        .expect(403)
    })

    it('should allow admin to create space', async () => {
      const res = await request(app)
        .post('/api/v1/spaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(testSpace)
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe(testSpace.name)
    })

    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/v1/spaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Invalid Space',
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })
  })

  describe('GET /api/v1/spaces/:id', () => {
    it('should return 404 for non-existent space', async () => {
      await request(app)
        .get(`/api/v1/spaces/${new mongoose.Types.ObjectId()}`)
        .expect(404)
    })

    it('should return space by id', async () => {
      const space = await Space.create(testSpace)

      const res = await request(app)
        .get(`/api/v1/spaces/${space._id}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe(testSpace.name)
    })
  })

  describe('PUT /api/v1/spaces/:id', () => {
    it('should prevent unauthorized update', async () => {
      const space = await Space.create(testSpace)

      await request(app)
        .put(`/api/v1/spaces/${space._id}`)
        .send({ name: 'Updated Space' })
        .expect(401)
    })

    it('should allow admin to update space', async () => {
      const space = await Space.create(testSpace)

      const res = await request(app)
        .put(`/api/v1/spaces/${space._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Space' })
        .expect(200)

      expect(res.body.data.name).toBe('Updated Space')
    })
  })

  describe('DELETE /api/v1/spaces/:id', () => {
    it('should prevent unauthorized deletion', async () => {
      const space = await Space.create(testSpace)

      await request(app).delete(`/api/v1/spaces/${space._id}`).expect(401)
    })

    it('should allow admin to delete space', async () => {
      const space = await Space.create(testSpace)

      await request(app)
        .delete(`/api/v1/spaces/${space._id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      const deletedSpace = await Space.findById(space._id)
      expect(deletedSpace).toBeNull()
    })
  })
})
