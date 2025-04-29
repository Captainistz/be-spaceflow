const { addReviews, upvoteReview } = require('../src/reviews')
const Review = require('../models/Review')

jest.mock('../models/Review')

describe('Review', () => {
    describe('Create Review', () => {
        it('should create a new review', async () => {
            const req = {
                params: { space_id: 'space1' },
                body: { rating: 4, comment: 'Great space!' },
                user: { _id: 'user1' },
            }

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            }

            const next = jest.fn()

            Review.findOne.mockResolvedValue(null)
            Review.create.mockResolvedValue({
                _id: 'review1',
                ...req.body,
            })

            await addReviews(req, res, next)

            expect(Review.findOne).toHaveBeenCalledWith({
                spaceId: 'space1',
                userId: 'user1',
            })

            expect(Review.create).toHaveBeenCalledWith({
                spaceId: 'space1',
                userId: 'user1',
                rating: 4,
                comment: 'Great space!',
            })

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: { 
                    _id: 'review1',
                    comment: 'Great space!',
                    rating: 4,
                },
            })
        })

        it('should handle duplicate reviews error', async () => {
            const req = {
                params: { space_id: 'space1' },
                body: { rating: 4, comment: 'Great space!' },
                user: { _id: 'user1' },
            }

            const res = {}
            const next = jest.fn()

            Review.findOne.mockResolvedValue({ _id: 'review1' })

            await addReviews(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(Error))
            expect(next.mock.calls[0][0].message).toBe(
                'User has already been review to this space',
            )
        })
    })

    describe('Upvote Review', () => {
        it('should upvote a review', async () => {
            const mockReview = {
                _id: 'review1',
                upVote: [],
                downVote: [],
            }

            const req = {
                params: { review_id: 'review1' },
                user: { _id: 'user1' },
            }

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            }

            const next = jest.fn()

            Review.findById.mockResolvedValue(mockReview)
            Review.findByIdAndUpdate.mockResolvedValue(mockReview)

            await upvoteReview(req, res, next)

            expect(Review.findById).toHaveBeenCalledWith(req.params.review_id)
            expect(Review.findByIdAndUpdate).toHaveBeenCalledWith(
                req.params.review_id,
                {
                    upVote: ['user1'],
                    downVote: [],
                },
                {
                    new: true,
                    runValidators: true,
                },
            )

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {},
            })
        })

        it('should handle review not found error', async () => {
            const req = {
                params: { review_id: 'review1' },
                user: { _id: 'user1' },
            }

            const res = {}
            const next = jest.fn()

            Review.findById.mockResolvedValue(null)

            await upvoteReview(req, res, next)

            expect(next).toHaveBeenCalledWith(expect.any(Error))
            expect(next.mock.calls[0][0].message).toBe(
                'Review not found with id of review1',
            )
            expect(next.mock.calls[0][0].statusCode).toBe(404)
        })

        it('should remove upvote if user already upvoted', async () => {
            const mockReview = {
                _id: 'review1',
                upVote: ['user1'],
                downVote: [],
            }

            const req = {
                params: { review_id: 'review1' },
                user: { _id: 'user1' },
            }

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            }

            const next = jest.fn()

            Review.findById.mockResolvedValue(mockReview)
            Review.findByIdAndUpdate.mockResolvedValue({
                _id: 'review1',
                upVote: [],
                downVote: [],
            })

            await upvoteReview(req, res, next)

            expect(Review.findById).toHaveBeenCalledWith('review1')
            expect(Review.findByIdAndUpdate).toHaveBeenCalledWith(
                'review1',
                {
                    upVote: [],
                    downVote: [],
                },
                {
                    new: true,
                    runValidators: true,
                }
            )

            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {},
            })
        })

        it('should remove downvote if user already downvoted', async () => {
            const mockReview = {
                _id: 'review1',
                upVote: [],
                downVote: ['user1'],
            }

            const req = {
                params: { review_id: 'review1' },
                user: { _id: 'user1' },
            }

            const res = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
            }

            const next = jest.fn()

            Review.findById.mockResolvedValue(mockReview)
            Review.findByIdAndUpdate.mockResolvedValue({
                _id: 'review1',
                upVote: [],
                downVote: [],
            })

            await upvoteReview(req, res, next)

            expect(Review.findById).toHaveBeenCalledWith('review1')
            expect(Review.findByIdAndUpdate).toHaveBeenCalledWith(
                'review1',
                {
                    upVote: ['user1'],
                    downVote: [],
                },
                {
                    new: true,
                    runValidators: true,
                }
            )
            expect(res.status).toHaveBeenCalledWith(200)
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {},
            })
        })
    })
})