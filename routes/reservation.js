const express = require('express');
const { protect, authorize } = require('../middleware/auth.js')

const {getReservations , addReservation , getReservation , updateReservation, deleteReservation} = require('../controllers/reservations.js');
const router = express.Router({mergeParams:true});


router.route('/').get(protect,getReservations).post(protect,addReservation);

router.route('/:id').get(protect,getReservation)
.put(protect,authorize('user','admin') , updateReservation)
.delete(protect,authorize('user','admin'),deleteReservation)

module.exports = router;