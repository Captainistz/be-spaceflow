const Review = require('../models/Review.js')

// @desc   Get review of user of space
// @route  GET /api/v1/:space_id/reviews/:user_id
// @access Public
/* istanbul ignore next */
async function getReviewOfUser(req, res, next) {
  const { space_id, user_id } = req.params

  try {
    const result = await Review.findOne({
      spaceId: space_id,
      userId: user_id,
    }).populate({
      path: 'userId',
    })
    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (e) {
    next(e)
  }
}

// @desc   Get review of space
// @route  GET /api/v1/:space_id/reviews
// @access Public
/* istanbul ignore next */
async function getReviews(req, res, next) {
  const { space_id } = req.params

  // if (req.headers['authorization']) {
  //     return getReviewOfuser(req, res, next)
  // }

  try {
    const result = await Review.find({ spaceId: space_id }).populate({
      path: 'userId',
    })
    return res.status(200).json({
      success: true,
      data: result,
    })
  } catch (e) {
    next(e)
  }
}

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

// @desc   update review of user of space
// @route  PUT /api/v1/:space_id/reviews/:review_id
// @access Private
/* istanbul ignore next */
async function updateReview(req, res, next) {
  const { space_id, review_id } = req.params
  // console.log(review_id)

  try {
    const review = await Review.findByIdAndUpdate(
      review_id,
      {
        ...req.body,
        updatedAt: Date.now(),
      },
      {
        new: true,
        runValidators: true,
      },
    )

    if (!review) {
      throw new Error('Not found')
    }

    return res.status(200).json({
      success: true,
      data: review,
    })
  } catch (e) {
    next(e)
  }
}

// @desc   delete review of user of space
// @route  DELETE /api/v1/:space_id/reviews/:review_id
// @access Private
/* istanbul ignore next */
async function deleteReview(req, res, next) {
  const { review_id } = req.params
  try {
    const review = await Review.findById(review_id)
    if (!review) {
      throw new Error('Not found')
    }

    if (
      review.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      throw new Error('Unauthorized')
    }

    await review.deleteOne()

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
      data: {
        upvotes: review.upVote.length,
        downvotes: review.downVote.length,
      },
    })
  } catch (e) {
    if (e.name == 'CastError' || e.message == 'Not found') {
      e.message = `Review not found with id of ${review_id}`
      e.statusCode = 404
    }
    next(e)
  }
}

// @desc   User downvote review
// @route  GET /api/v1/:space_id/reviews/:review_id
// @access Private
async function downvoteReview(req, res, next) {
  const { review_id } = req.params
  try {
    const review = await Review.findById(review_id)
    if (!review) {
      throw new Error('Not found')
    }

    if (review.downVote.includes(req.user._id)) {
      review.downVote = review.downVote.filter(
        (userId) => !userId.equals(req.user._id),
      )
    } else {
      review.downVote.push(req.user._id)
    }
    review.upVote = review.upVote.filter(
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
      data: {
        upvotes: review.upVote.length,
        downvotes: review.downVote.length,
      },
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
  getReviewOfUser,
  getReviews,
  addReviews,
  updateReview,
  deleteReview,
  upvoteReview,
  downvoteReview,
}
