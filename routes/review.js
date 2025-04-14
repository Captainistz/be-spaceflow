const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')

const {
    getReviews,
    getReviewOfuser,
    addReviews
} = require('../controllers/reviews.js')

const router = express.Router({ mergeParams: true })

router.get('/', getReviews, protect, getReviewOfuser)
router.post('/', protect, authorize('user', 'admin'), addReviews)

// router.put('/:id', protect, authorize('user', 'admin'), updateReservation)
// router.delete('/:id', protect, authorize('user', 'admin'), deleteReservation)

module.exports = router
