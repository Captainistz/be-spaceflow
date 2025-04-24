const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')

const controller = require('../controllers/reviews.js')

const router = express.Router({ mergeParams: true })

router.get('/', controller.getReviews)
router.post('/', protect, authorize('user', 'admin'), controller.addReviews)

router.get('/:user_id', protect, controller.getReviewOfUser)
router.put(
  '/:review_id',
  protect,
  authorize('user', 'admin'),
  controller.updateReview,
)
router.delete(
  '/:review_id',
  protect,
  authorize('user', 'admin'),
  controller.deleteReview,
)

router.get('/:review_id/upvote', protect, controller.upvoteReview)
router.get('/:review_id/downvote', protect, controller.downvoteReview)

module.exports = router
