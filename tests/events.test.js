const app = require('../app')

const request = require('supertest')

const Event = require('../models/Event')
const Space = require('../models/Space')
const User = require('../models/User')

const { connectDB, disconnectDB } = require('./memory-server')
const { addDays } = require('date-fns')
const { mongo } = require('mongoose')
const EventAttendance = require('../models/EventAttendance')

let space, user

const userData = {
  name: 'TEST USER',
  email: 'user@test.com',
  password: '12345678',
  phone: '0000000000',
}

const adminData = {
  name: 'TEST ADMIN',
  email: 'admin@test.com',
  password: '12345678',
  phone: '0000000000',
  role: 'admin',
}

const spaceData = {
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
}

const eventData = {
  name: 'TEST EVENT',
  space: 'TEST SPACE',
  description: 'A Sample Description.',
  host: 'John Doe',
  capacity: 100,
  startDate: new Date().toISOString(),
  endDate: addDays(new Date(), 4).toISOString(),
  image: '/sample.jpg',
}

describe('800 - Event', () => {
  beforeAll(async () => {
    await connectDB()
    space = await Space.insertOne(spaceData)
    eventData.space = space._id.toHexString()

    user = await User.insertOne(userData)
    admin = await User.insertOne(adminData)

    user.token = user.getSignedJwtToken()
    admin.token = admin.getSignedJwtToken()
  })

  afterAll(async () => {
    await disconnectDB()
  })

  beforeAll(async () => {
    await Event.deleteMany({})
    await EventAttendance.deleteMany({})
  })

  describe('810 - Create Event', () => {
    it('811 - should allow admin to create an event', async () => {
      const res = await request(app)
        .post(`/api/v1/events`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(eventData)
        .expect(201)

      const data = res.body.data

      expect(res.body.success).toBe(true)
      expect(data).toMatchObject(eventData)
    })

    it('812 - should disallow user to create an event', async () => {
      const res = await request(app)
        .post(`/api/v1/events`)
        .set('Authorization', `Bearer ${user.token}`)
        .send(eventData)
        .expect(401)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe(
        'User role user is not authorized to access this route',
      )
    })

    it("813 - should reject event creation when there's missing required field", async () => {
      const res = await request(app)
        .post(`/api/v1/events`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send({})
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('is required')
    })

    it('814 - should reject event creation when date range exceeds 7 days', async () => {
      const invalidEvent = {
        ...eventData,
        endDate: addDays(new Date(), 8).toISOString(),
      }

      const res = await request(app)
        .post(`/api/v1/events`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(invalidEvent)
        .expect(500)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe(
        'Event duration must be between 1 and 7 days',
      )
    })

    it('815 - should reject event creation when endDate is before startDate', async () => {
      const invalidEvent = {
        ...eventData,
        startDate: addDays(new Date(), 4).toISOString(),
      }

      const res = await request(app)
        .post(`/api/v1/events`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(invalidEvent)
        .expect(500)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('End date must be after start date')
    })

    it('816 - should reject event creation when date is not in a valid format', async () => {
      const invalidEvent = {
        ...eventData,
        startDate: '22/10/2023',
      }

      const res = await request(app)
        .post(`/api/v1/events`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(invalidEvent)
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('Cast to date failed')
    })
  })

  describe('820 - Edit Event', () => {
    let event, eid
    beforeEach(async () => {
      event = await Event.insertOne(eventData)
      eid = event._id.toHexString()
    })

    it('821 - should allow admin to edit an event', async () => {
      const editedEvent = {
        ...eventData,
        name: 'TEST EVENT EDITED',
      }

      const res = await request(app)
        .put(`/api/v1/events/${eid}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(editedEvent)
        .expect(200)

      const data = res.body.data

      expect(res.body.success).toBe(true)
      expect(data.name).toBe('TEST EVENT EDITED')
    })

    it('822 - should disallow user to edit an event', async () => {
      const editedEvent = {
        ...eventData,
        name: 'TEST EVENT EDITED',
      }

      const res = await request(app)
        .put(`/api/v1/events/${eid}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send(editedEvent)
        .expect(401)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe(
        'User role user is not authorized to access this route',
      )
    })

    it("823 - should reject event edits when there's no event with eid", async () => {
      const editedEvent = {
        ...eventData,
        name: 'TEST EVENT EDITED',
      }
      const eid = new mongo.ObjectId().toHexString()
      const res = await request(app)
        .put(`/api/v1/events/${eid}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(editedEvent)
        .expect(404)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe('Not found')
    })

    it('824 - should reject event edits when the date is not in a valid format', async () => {
      const invalidEvent = {
        ...eventData,
        startDate: '22/10/2023',
      }

      const res = await request(app)
        .put(`/api/v1/events/${eid}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(invalidEvent)
        .expect(400)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toContain('Cast to date failed')
    })
  })

  describe('830 - Delete Event', () => {
    let event, eid
    beforeEach(async () => {
      event = await Event.insertOne(eventData)
      eid = event._id.toHexString()
    })

    it('831 - should allow admin to delete an event', async () => {
      const res = await request(app)
        .delete(`/api/v1/events/${eid}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toEqual({})
    })

    it('832 - should disallow user to delete an event', async () => {
      const res = await request(app)
        .delete(`/api/v1/events/${eid}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(401)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe(
        'User role user is not authorized to access this route',
      )
    })

    it("833 - should reject event deletion when there's no event with eid", async () => {
      const eid = new mongo.ObjectId().toHexString()
      const res = await request(app)
        .delete(`/api/v1/events/${eid}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .expect(404)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe('Not found')
    })
  })

  describe('840 - Join Event', () => {
    let event, eid
    beforeEach(async () => {
      event = await Event.insertOne(eventData)
      eid = event._id.toHexString()
    })

    it('841 - should allow user to join an event', async () => {
      const res = await request(app)
        .post(`/api/v1/events/attendance/${eid}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toMatchObject({
        event: eid,
        user: user._id.toHexString(),
      })
    })

    it('842 - should reject user to join when event not exists', async () => {
      const eid = new mongo.ObjectId().toHexString()
      const res = await request(app)
        .post(`/api/v1/events/attendance/${eid}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(404)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe('Not found')
    })

    it('843 - should reject user to join an event when user already joined', async () => {
      let res = await request(app)
        .post(`/api/v1/events/attendance/${eid}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.data).toMatchObject({
        event: eid,
        user: user._id.toHexString(),
      })

      res = await request(app)
        .post(`/api/v1/events/attendance/${eid}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(500)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe('This user has already joined this event')
    })

    it('844 - should reject user to join ended event', async () => {
      const ended_event = await Event.insertOne({
        ...eventData,
        startDate: addDays(new Date(), -5),
        endDate: addDays(new Date(), -3),
      })
      const ended_event_eid = ended_event._id.toHexString()

      const res = await request(app)
        .post(`/api/v1/events/attendance/${ended_event_eid}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(500)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe('Event has ended')
    })

    it('845 - should reject user to join full event', async () => {
      const full_event = await Event.insertOne({
        ...eventData,
        capacity: 1,
      })
      const full_event_eid = full_event._id.toHexString()
      await EventAttendance.insertOne({
        event: full_event_eid,
        user: new mongo.ObjectId(),
      })

      const res = await request(app)
        .post(`/api/v1/events/attendance/${full_event_eid}`)
        .set('Authorization', `Bearer ${user.token}`)
        .expect(500)

      expect(res.body.success).toBe(false)
      expect(res.body.message).toBe('The maximum capacity is reached')
    })
  })
})
