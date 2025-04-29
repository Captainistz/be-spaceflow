const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')

const controller = require('../controllers/reviews.js')

const router = express.Router({ mergeParams: true })

/**
 * @swagger
 * tags:
 *   - name: Reviews
 *     description: API operations related to reviews
 */

/**
 * @swagger
 * /spaces/{space_id}/reviews:
 *   get:
 *     summary: Returns the list of all the reviews of one space
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: space_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The space id
 *     responses:
 *       200:
 *         description: The list of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                   userId:
 *                     type: string
 *                   spaceId:
 *                     type: string
 *                   comment:
 *                     type: string
 *                   rating:
 *                     type: number
 *                   upVote:
 *                     type: array
 *                     items:
 *                       type: string
 *                   downVote:
 *                     type: array
 *                     items:
 *                       type: string
 *                 example:
 *                   createdAt: "2025-04-29T10:00:00.000Z"
 *                   updatedAt: "2025-04-29T10:00:00.000Z"
 *                   userId: "661fb282b1e7a421c3e13a7f"
 *                   spaceId: "66202d1ea63e2d1983fbd7a2"
 *                   comment: "The space was well-organized and clean. Would definitely book again!"
 *                   rating: 5
 *                   upVote: ["66203a88e12a4a3ff6ab4913", "66203a88e12a4a3ff6ab4914"]
 *                   downVote: []
 */

/**
 * @swagger
 * /spaces/{space_id}/reviews:
 *   post:
 *     summary: Add a new Review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: [] # Requires Bearer Token
 *     parameters:
 *       - in: path
 *         name: space_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The space id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: "Great space!"
 *     responses:
 *       200:
 *         description: The list of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *
 *
 */

/**
 * @swagger
 * /spaces/{space_id}/reviews/{review_id}:
 *   put:
 *     summary: Update a Review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: [] # Requires Bearer Token
 *     parameters:
 *       - in: path
 *         name: space_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The space id
 *       - in: path
 *         name: review_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The review id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *             example:
 *               rating: 4
 *               comment: "Great space!"
 *     responses:
 *       200:
 *         description: The list of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 */

/**
 * @swagger
 * /spaces/{space_id}/reviews/{review_id}:
 *   delete:
 *     summary: Delete a Review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: [] # Requires Bearer Token
 *     parameters:
 *       - in: path
 *         name: space_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The space id
 *       - in: path
 *         name: review_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The review id
 *     responses:
 *       200:
 *         description: The list of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *             example:
 *               success: true
 *               data: {}
 */

/**
 * @swagger
 * /spaces/{space_id}/reviews/{review_id}/upvote:
 *   get:
 *     summary: Upvote a Review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: [] # Requires Bearer Token
 *     parameters:
 *       - in: path
 *         name: space_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The space id
 *       - in: path
 *         name: review_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The review id
 *     responses:
 *       200:
 *         description: The list of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 message: "Upvoted successfully"
 */

/**
 * @swagger
 * /spaces/{space_id}/reviews/{review_id}/downvote:
 *   get:
 *     summary: Downvote a Review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: [] # Requires Bearer Token
 *     parameters:
 *       - in: path
 *         name: space_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The space id
 *       - in: path
 *         name: review_id
 *         schema:
 *           type: string
 *         required: true
 *         description: The review id
 *     responses:
 *       200:
 *         description: The list of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *             example:
 *               success: true
 *               data:
 *                 message: "Downvoted successfully"
 */

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
