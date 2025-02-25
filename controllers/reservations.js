const Reservation = require('../models/Reservation');

exports.getReservations  = async (req,res ,next) => {
    let query;

    if(req.user.role !== 'admin'){
        query = Reservation.find()
    }


}