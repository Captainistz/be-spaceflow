const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')

const {
    getReviews,
    addReviews
} = require('../controllers/reviews.js')

const router = express.Router({ mergeParams: true })

router.get('/', getReviews)
router.post('/', protect, authorize('user', 'admin'), addReviews)

// router.put('/:id', protect, authorize('user', 'admin'), updateReservation)
// router.delete('/:id', protect, authorize('user', 'admin'), deleteReservation)

module.exports = router
