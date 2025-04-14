const Review = require('../models/Review.js');
const Space = require('../models/Space.js');

// @desc   Get review of user of space
// @route  GET /api/v1/:space_id/reviews/:user_id
// @access Public
async function getReviewOfuser(req, res, next) {
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

    if (req.headers['authorization']) {
        return getReviewOfuser(req, res, next)
    }

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

async function upadateReview(req,res,next) {
    const {review_id} = req.params;
    console.log(review_id)
    try {
        const review = await Review.findByIdAndUpdate(review_id , req.body, {
            new : true,
            runValidators : true,
        })

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


module.exports = { getReviewOfuser, getReviews, addReviews , upadateReview}