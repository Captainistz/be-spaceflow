const express = require('express')

const { register, login, me, logout } = require('../controllers/auth')
const { protect } = require('../middleware/auth')

const router = express.Router()

/**
 * @swagger
 * tags:
 *   - name: "Auth"
 *     description: API operations related to authentication
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *    summary: Register a new user
 *    tags: [Auth]
 *    requestBody:
 *      required: true
 *      content:
 *        application/json:
 *         schema:
 *           type: object
 *           properties:
 *           name:
 *             type: string
 *           email:
 *             type: string
 *           password:
 *             type: string
 *           example:
 *              name: "John Doe"
 *              email: "sample@gmail.com"
 *              password: "12345678"
 * */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             example:
 *               email: "user@example.com"
 *               password: "yourpassword"
 *     responses:
 *       200:
 *         description: User successfully logged in
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

router.get('/me', protect, me)
router.get('/logout', logout)

router.post('/register', register)
router.post('/login', login)

module.exports = router
