const Review = require('../models/Review.js');


// @desc   Get Review of user of branch
// @route  GET /api/v1/:space_id/reviews/
// @access Public
async function getReviewOfuser(req, res, next) {
    const { space_id, user_id } = req.params

    try {
        const result = await Review.findOne({ spaceId: space_id, userId: req.user._id }).populate({
            path: "userId"
        });
        return res.status(200).json({
            success: true,
            data: result
        })
    } catch (e) {
        return res.status(500).json({
            success: false,
            messgage: "Cannot get reviews"
        })
    }
}

// @desc   Get review of space
// @route  GET /api/v1/:space_id/reviews
// @access Public
async function getReviews(req, res, next) {
    const { space_id } = req.params

    if (req.headers['authorization']) {
        return next();
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
        return res.status(500).json({
            success: false,
            messgage: "Cannot get reviews"
        })
    }
}

// @desc   add user review of space
// @route  POST /api/v1/:space_id/reviews
// @access Private
async function addReviews(req, res, next) {
    const { space_id } = req.params

    try {
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

    }
}


module.exports = { getReviewOfuser, getReviews, addReviews }