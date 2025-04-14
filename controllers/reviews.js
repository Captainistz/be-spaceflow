const Review = require('../models/Review.js');

// @desc   Get review of user of space
// @route  GET /api/v1/:space_id/reviews/:user_id
// @access Public
async function getReviewOfUser(req, res, next) {
    const { space_id, user_id } = req.params

    try {
        const result = await Review.findOne({ spaceId: space_id, userId: user_id }).populate({
            path: "userId"
        });
        return res.status(200).json({
            success: true,
            data: result
        })
    } catch (e) {
        next(e)
    }
}

// @desc   Get review of space
// @route  GET /api/v1/:space_id/reviews
// @access Public
async function getReviews(req, res, next) {
    const { space_id } = req.params

    // if (req.headers['authorization']) {
    //     return getReviewOfuser(req, res, next)
    // }

    try {
        const result = await Review.find({ spaceId: space_id }).populate({
            path: "userId"
        });
        return res.status(200).json({
            success: true,
            data: result
        })
    } catch (e) {
        next(e)
    }
}

// @desc   add user review of space
// @route  POST /api/v1/:space_id/reviews
// @access Private
async function addReviews(req, res, next) {
    const { space_id } = req.params;

    try {
        const hasReview = await Review.findOne({ spaceId: space_id, userId: req.user._id });
        if (hasReview) {
            throw Error("User has already been review to this space");
        }
    
        const result = await Review.create({
            ...req.body,
            userId: req.user._id,
            spaceId: space_id
        });

        return res.status(200).json({
            success: true,
            data: result
        })
    } catch (e) {
        next(e)
    }
}

// @desc   update review of user of space
// @route  PUT /api/v1/:space_id/reviews/:review_id
// @access Private
async function updateReview(req,res,next) {
    const { space_id, review_id } = req.params;
    // console.log(review_id)

    let tmp = {...req.body}
    if (!req.body.upVote && !req.body.downVote) {
        tmp.updatedAt = Date.now();
    }

    try {
        const review = await Review.findByIdAndUpdate(
            review_id, tmp,
            {
                new : true,
                runValidators : true,
            }
        )

        if(!review){
            throw new Error('Not found')
        }

        return res.status(200).json({
            success : true,
            data : review,
        })
    } catch (e) {
        next(e)
    }
}

// @desc   delete review of user of space
// @route  DELETE /api/v1/:space_id/reviews/:review_id
// @access Private
async function deleteReview(req, res, next) {
    const { id } = req.params
    try {
      const review = await Review.findById(id)
      if (!review) {
        throw new Error('Not found')
      }
  
      if (review.userId !== req.user._id && req.user.role !== 'admin') {
        throw new Error('Unauthorized')
      }
  
      await review.deleteOne()
  
      return res.status(200).json({
        success: true,
        data: {},
      })
    } catch (e) {
      if (e.name == 'CastError' || e.message == 'Not found') {
        e.message = `Review not found with id of ${id}`
        e.statusCode = 404
      }
      next(e)
    }
  }

module.exports = { getReviewOfUser, getReviews, addReviews, updateReview, deleteReview }