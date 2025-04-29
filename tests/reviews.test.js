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
    space = await Space.create({
      name: 'TEST SPACE',
      address: 'TEST ADDR',
      district: 'TEST DISTRICT',
      province: 'TEST',
      postalcode: '10110',
      tel: '02-111-1111',
      opentime: '0900',
      closetime: '2100',
      rooms: [],
    })
    user = await User.create({
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

  describe('POST /api/v1/:space_id/reviews (addReviews)', () => {
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

    it('should return error if user already reviewed', async () => {
      await Review.create({
        userId: user._id,
        spaceId: space._id,
        comment: 'First review',
        rating: 4,
      })

      const res = await request(app)
        .post(`/api/v1/spaces/${space._id}/reviews`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          comment: 'Second review',
          rating: 4,
        })
        .expect(500)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe(
        'User has already been review to this space',
      )
    })
  })
  describe('GET /api/v1/:space_id/reviews/:review_id/upvote (upvoteReview)', () => {
    it('should up vote a review', async () => {
      const review = await Review.create({
        userId: user._id,
        spaceId: space._id,
        comment: 'Test review',
        rating: 3,
      })

      const res = await request(app)
        .get(
          `/api/v1/spaces/${space._id.toString()}/reviews/${review._id}/upvote`,
        )
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.upvotes).toBe(1)
    })
    it('should remove upvote if already upvoted', async () => {
      const review = await Review.create({
        userId: user._id,
        spaceId: space._id,
        comment: 'Test review',
        rating: 3,
        upVote: [user._id],
      })

      const res = await request(app)
        .get(
          `/api/v1/spaces/${space._id.toString()}/reviews/${review._id}/upvote`,
        )
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.data.upvotes).toBe(0)
    })
    it('should remove downvote when upvoting', async () => {
      const review = await Review.create({
        userId: user._id,
        spaceId: space._id,
        comment: 'Test review',
        rating: 3,
        downVote: [user._id],
      })

      const res = await request(app)
        .get(`/api/v1/spaces/${space._id}/reviews/${review._id}/upvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.upvotes).toBe(1)
      expect(res.body.data.downvotes).toBe(0)
    })
    it('should return 404 if review not found', async () => {
      const fakeId = '65e6a84e25cb8f0bca0fa999'

      const res = await request(app)
        .get(`/api/v1/spaces/${space._id}/reviews/${fakeId}/upvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe(`Review not found with id of ${fakeId}`)
    })
  })
  describe('GET /api/v1/:space_id/reviews/:review_id/downvote (downvoteReview)', () => {
    it('should up vote a review', async () => {
      const review = await Review.create({
        userId: user._id,
        spaceId: space._id,
        comment: 'Test review',
        rating: 3,
      })

      const res = await request(app)
        .get(
          `/api/v1/spaces/${space._id.toString()}/reviews/${review._id}/upvote`,
        )
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.upvotes).toBe(1)
    })

    it('should down vote a review', async () => {
      const review = await Review.create({
        userId: user._id,
        spaceId: space._id,
        comment: 'Test review',
        rating: 3,
      })

      const res = await request(app)
        .get(`/api/v1/spaces/${space._id.toString()}/reviews/${review._id}/downvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.downvotes).toBe(1)
    })
    it('should remove downvote if already downvoted', async () => {
      const review = await Review.create({
        userId: user._id,
        spaceId: space._id,
        comment: 'Test review',
        rating: 3,
        downVote: [user._id],
      })

      const res = await request(app)
        .get(`/api/v1/spaces/${space._id.toString()}/reviews/${review._id}/downvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.downvotes).toBe(0)
    })
    it('should remove upvote when downvoting', async () => {
      const review = await Review.create({
        userId: user._id,
        spaceId: space._id,
        comment: 'Test review',
        rating: 3,
        upVote: [user._id],
      })

      const res = await request(app)
        .get(`/api/v1/spaces/${space._id}/reviews/${review._id}/downvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data.upvotes).toBe(0)
      expect(res.body.data.downvotes).toBe(1)
    })
    it('should return 404 if review not found', async () => {
      const fakeId = '65e6a84e25cb8f0bca0fa999'

      const res = await request(app)
        .get(`/api/v1/spaces/${space._id}/reviews/${fakeId}/downvote`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404)
      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe(`Review not found with id of ${fakeId}`)
    })
  })
})
