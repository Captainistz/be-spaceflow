const Review = require('../models/Review.js');

async function getReviews(req, res, next) {
    const { space_id } = req.params

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

async function addReviews(req, res, next) {
    const { space_id } = req.params

    try {
        const result = await Review.create({
            ...req.body, spaceId: space_id
        });

        return res.status(200).json({
            success: true,
            data: result
        })
    } catch (e) {

    }
}


module.exports = { getReviews, addReviews }