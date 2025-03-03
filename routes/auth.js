const express = require('express')

const { register, login, me, logout } = require('../controllers/auth')
const { protect } = require('../middleware/auth')

const router = express.Router()

router.get('/me', protect, me)
router.get('/logout', logout)

router.post('/register', register)
router.post('/login', login)

module.exports = router
