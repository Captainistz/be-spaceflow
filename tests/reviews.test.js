const request = require('supertest')
const Review = require('../models/Review')
const { connectDB, disconnectDB } = require('./memory-server')
const app = require('../app')
const Space = require('../models/Space')
const User = require('../models/User')
const dotenv = require('dotenv').config({ path: './config/config.env' })

let space, user, userToken

describe('Review', () => {
  beforeAll(async () => {
    await connectDB()
    space = await Space.insertOne({
      name: 'TEST SPACE',
      address: 'TEST ADDR',
      district: 'TEST DISTRICT',
      province: 'TEST',
      postalcode: '10110',
      tel: '02-111-1111',
      opentime: '0900',
      closetime: '2100',
      rooms: [
        {
          roomNumber: 'R101',
          capacity: 4,
          facilities: ['WiFi', 'Whiteboard'],
          price: 450,
        },
        {
          roomNumber: 'R102',
          capacity: 8,
          facilities: ['WiFi', 'Projector'],
          price: 200,
        },
      ],
    })
    user = await User.insertOne({
      name: 'TEST USER',
      email: 'user@test.com',
      password: '12345678',
      phone: '0000000000',
    })
    userToken = user.getSignedJwtToken()
  })

  afterAll(async () => {
    await disconnectDB()
  })

  beforeEach(async () => {
    await Review.deleteMany({})
  })

  describe('Create Review', () => {
    it('should create a new review', async () => {
      const res = await request(app)
        .post(`/api/v1/spaces/${space._id.toString()}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          comment: 'THIS IS A GOOD ONE',
          rating: 4,
        })
        .expect(200)

      const data = res.body.data

      expect(res.body.success).toBe(true)
      expect(data.userId).toBe(user._id.toString())
      expect(data.spaceId).toBe(space._id.toString())
      expect(data.comment).toBe('THIS IS A GOOD ONE')
      expect(data.rating).toBe(4)
    })

    it('should handle duplicate reviews error', async () => {
      await request(app)
        .post(`/api/v1/spaces/${space._id.toString()}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          comment: 'FIRST REVIEW',
          rating: 3,
        })
        .expect(200)

      const res = await request(app)
        .post(`/api/v1/spaces/${space._id.toString()}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          comment: 'THIS IS A REALLY GOOD ONE',
          rating: 4,
        })
        .expect(500)

      expect(res.body.success).toBe(false)
    })
  })
})
