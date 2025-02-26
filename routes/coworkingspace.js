const express = require('express')
const { protect, authorize } = require('../middleware/auth.js')
const { getCoWorkingSpaces, getCoWorkingSpace , addCoWorkingSpace , updateCoworkingSpace ,deleteCoWorkingSpace} = require('../controllers/coworkingspace.js')

const router = express.Router()

const rvsRoute = require('./reservation');

router.use('/:CoWorkingSpaceId/reservations/' , rvsRoute);

router.route('/')
  .get(getCoWorkingSpaces).post(protect,authorize('admin'),addCoWorkingSpace);

router.route('/:id')
  .get(getCoWorkingSpace)
  .put(protect,authorize('admin'),updateCoworkingSpace)
  .delete(protect,authorize('admin'),deleteCoWorkingSpace)
  


module.exports = router