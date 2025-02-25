const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')
const { getCoWorkingSpaces, getCoWorkingSpace } = require('../controllers/coworkingspace.js')

const router = express.Router()

router.route('/')
  .get(getCoWorkingSpaces)

router.route('/:id')
  .get(getCoWorkingSpace)


module.exports = router