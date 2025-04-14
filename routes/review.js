const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')

const {
    getReviews,
    getReviewOfUser,
    addReviews,
    updateReview,
    deleteReview
} = require('../controllers/reviews.js')

const router = express.Router({ mergeParams: true })

router.get('/', getReviews)
router.post('/', protect, authorize('user', 'admin'), addReviews)

router.get('/:user_id', protect, getReviewOfUser)
router.put('/:review_id', protect, authorize('user', 'admin'), updateReview)
router.delete('/:review_id', protect, authorize('user', 'admin'), deleteReview)

module.exports = router
