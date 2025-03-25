const express = require('express')
const { updateUser } = require('../controllers/users')

const router = express.Router()

router.put('/:id', updateUser)

module.exports = router
