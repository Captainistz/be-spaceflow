const request = require('supertest')
const app = require('../app')
const User = require('../models/User')
const { connectDB, disconnectDB } = require('./memory-server')

const testUser = {
  name: 'Test User',
  email: 'testuser@test.com',
  password: '123456',
  phone: '0812345670',
}

const testAdmin = {
  name: 'Test Admin',
  email: 'testadmin@test.com',
  password: '123456',
  phone: '0812345671',
  role: 'admin',
}

let userToken
let adminToken
let userId

describe('User Authentication Tests', () => {
  // Connect to test database before all tests
  beforeAll(async () => {
    await connectDB()
  })

  // Cleanup after all tests
  afterAll(async () => {
    await disconnectDB()
  })

  // Clear user collection before each test group
  beforeEach(async () => {
    await User.deleteMany({})
  })

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.token).toBeDefined()

      // Save token for later tests
      userToken = res.body.data.token
    })

    it('should register a new admin user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(testAdmin)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.token).toBeDefined()

      // Save token for later tests
      adminToken = res.body.data.token
    })

    it('should reject registration with missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Incomplete User',
          email: 'incomplete@test.com',
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it('should reject registration with duplicate email', async () => {
      // First create a user
      await request(app).post('/api/v1/auth/register').send(testUser)

      // Try to create another user with the same email
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate User',
          email: testUser.email,
          password: '123456',
          phone: '0899999999',
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it('should reject registration with invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: '123456',
          phone: '0899999999',
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })

    it('should reject registration with password less than 6 characters', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Short Password User',
          email: 'short@test.com',
          password: '12345',
          phone: '0899999999',
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })
  })

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await User.create(testUser)
      await User.create(testAdmin)
    })

    it('should login with correct credentials', async () => {
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

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401)

      expect(res.body.success).toBe(false)
    })

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: testUser.password,
        })
        .expect(401)

      expect(res.body.success).toBe(false)
    })

    it('should not login with missing credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: testUser.email,
        })
        .expect(400)

      expect(res.body.success).toBe(false)
    })
  })

  describe('GET /api/v1/auth/me', () => {
    beforeEach(async () => {
      // Create user and get token
      const user = await User.create(testUser)
      userId = user._id.toString()

      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      })

      userToken = loginRes.body.data.token
    })

    it('should get current user profile', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.name).toBe(testUser.name)
      expect(res.body.data.email).toBe(testUser.email)
      expect(res.body.data.role).toBe('user')
      expect(res.body.data.password).toBeUndefined() // Password should not be returned
    })

    it('should not access profile without token', async () => {
      const res = await request(app).get('/api/v1/auth/me').expect(401)

      expect(res.body.success).toBe(false)
    })

    it('should not access profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401)

      expect(res.body.success).toBe(false)
    })
  })

  describe('GET /api/v1/auth/logout', () => {
    it('should logout user', async () => {
      const res = await request(app).get('/api/v1/auth/logout').expect(200)

      expect(res.body.success).toBe(true)

      // Check that cookie is cleared (expires in the past)
      expect(res.headers['set-cookie'][0]).toMatch(/token=none/)
    })
  })
})
