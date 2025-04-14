const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')

const {
    getReviews,
    getReviewOfuser,
    addReviews,
    upadateReview
} = require('../controllers/reviews.js')

const router = express.Router({ mergeParams: true })

router.get('/', getReviews)
router.post('/', protect, authorize('user', 'admin'), addReviews)

router.get('/:user_id', protect, getReviewOfuser)
router.put('/:review_id', protect, authorize('user', 'admin'),upadateReview)

// router.put('/:id', protect, authorize('user', 'admin'), updateReservation)
// router.delete('/:id', protect, authorize('user', 'admin'), deleteReservation)

module.exports = router
