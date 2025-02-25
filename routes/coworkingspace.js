const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')
const { getCoWorkingSpaces, getCoWorkingSpace, addCoWorkingSpace, updateCoWorkingSpace, deleteCoWorkingSpace } = require('../controllers/coworkingspace.js')

const router = express.Router()

router.route('/')
  .get(getCoWorkingSpaces)
  .post(protect, authorize('admin'), addCoWorkingSpace)

router.route('/:id')
  .get(getCoWorkingSpace)
  .put(protect, authorize('admin'), updateCoWorkingSpace)
  .delete(protect, authorize('admin'), deleteCoWorkingSpace)


module.exports = router