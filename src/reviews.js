const Review = require('../models/Review.js')

// @desc   add user review of space
// @route  POST /api/v1/:space_id/reviews
// @access Private
async function addReviews(req, res, next) {
  const { space_id } = req.params

  try {
    const hasReview = await Review.findOne({
      spaceId: space_id,
      userId: req.user._id,
    })
    if (hasReview) {
      throw Error('User has already been review to this space')
    }

    const result = await Review.create({
      ...req.body,
      userId: req.user._id,
      spaceId: space_id,
    })

    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (e) {
    next(e)
  }
}

// @desc   User upvote review
// @route  GET /api/v1/:space_id/reviews/:review_id
// @access Private
async function upvoteReview(req, res, next) {
  const { review_id } = req.params
  try {
    const review = await Review.findById(review_id)
    if (!review) {
      throw new Error('Not found')
    }

    if (review.upVote.includes(req.user._id)) {
      review.upVote = review.upVote.filter(
        (userId) => !userId.equals(req.user._id),
      )
    } else {
      review.upVote.push(req.user._id)
    }
    review.downVote = review.downVote.filter(
      (userId) => !userId.equals(req.user._id),
    )

    await Review.findByIdAndUpdate(
      review_id,
      {
        upVote: review.upVote,
        downVote: review.downVote,
      },
      {
        new: true,
        runValidators: true,
      },
    )

    return res.status(200).json({
      success: true,
      data: {},
    })
  } catch (e) {
    if (e.name == 'CastError' || e.message == 'Not found') {
      e.message = `Review not found with id of ${review_id}`
      e.statusCode = 404
    }
    next(e)
  }
}

module.exports = {
  addReviews,
  upvoteReview,
}
