const Reservation = require('../models/Reservation');
const CoWorkingSpace = require('../models/CoWorkingSpace');

const getReservations  = async (req,res,next) => {
    let query;
    console.log(req.user);
    if(req.user.role !== 'admin'){
        query = Reservation.find({user : req.user.id}).populate({
            path : 'coWorkingSpace',
            select : 'name province tel'
        });
    }
    else{
        if(req.params.CoWorkingSpaceID){
            console.log(req.params.CoWorkingSpaceID);
            query = Reservation.find({CoWorkingSpace : req.params.CoWorkingSpaceID}).populate({
                path : 'coWorkingSpace',
                select : 'name province tel'
            });
        }
        else{
            query = Reservation.find().populate({
                path : 'coWorkingSpace',
                select : 'name province tel'
            });
        }
    }

    try {
        const reservation = await query;

        res.status(200).json({
            success : true,
            count : reservation.length,
            data : reservation
        })
    } catch (error) {
        next(error);
    }
}


const getReservation = async (req,res,next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate({
            path : 'coWorkingSpace',
            select : 'name province tel'
        });

        if(!reservation){
            return res.status(400).json({
                success : false,
                msg : `not found ${req.params.id}`
            })
        }


        res.status(200).json({
            success : true,
            data : reservation
        })
    } catch (error) {
        next(error);
    }
}


const addReservation = async (req,res,next) => {
    try {
        console.log(req.params.CoWorkingSpaceId);
        req.body.coWorkingSpace = req.params.CoWorkingSpaceId;

        const coworkingspace = await CoWorkingSpace.findById(req.params.CoWorkingSpaceId);

        if (!coworkingspace){
            return res.status(404).json({success:false , message : `No coworkingspace with the id of ${req.params.CoWorkingSpaceId}`});
        }

        //console.log(req.user);
        req.body.user = req.user.id;
        const exitedCoWorkingSpace = await CoWorkingSpace.find({user : req.user.id});

        if(exitedCoWorkingSpace.length >= 3 && req.role !== 'admin'){
            return res.status(400).json({success:false,message:`The user with ID ${req.user.id} has already made 3 reservations`});
        }


        const reservation = await Reservation.create(req.body);

        res.status(200).json({
            sucess : true,
            data : reservation
        });

    } catch (error) {
        next(error);       
    }
}

// need to fix later... room
const updateReservation = async(req,res,next) => {
    try {
        let reservation = await Reservation.findById(req.params.id);

        if(!reservation){
            return res.status(404).json({
                success : false,
                msg : `not found ${req.params.id}`
            })
        }

        if(reservation.user.toString() !== req.user.id && req.user.role !== admin){
            return res.status(401).json({success:false , msg : `User ${req.user.id} is not authorized to update this reservation`})
        }

        reservation = await Reservation.findByIdAndUpdate(req.params.id,req.body ,{
            new : true,
            runValidators : true
        })



        res.status(200).json({
            success : true,
            data : reservation
        })
    } catch (error) {
        next(error);
    }
}


const deleteReservation = async (req,res,next) => {
    try {
        
        const reservation = await Reservation.findById(req.params.id);

        if(!reservation){
            return res.status(404).json({
                success : false,
                msg : `not found ${req.params.id}`
            })
        }
        console.log(reservation);
        if(reservation.user.toString() !== req.user.id && req.user.role !== admin){
            return res.status(401).json({success:false , msg : `User ${req.user.id} is not authorized to dalete this reservation`})
        }


        await reservation.deleteOne();
        res.status(200).json({
            success : true,
        })

    } catch (error) {
        next(error);
    }
}



module.exports = {getReservations , addReservation , getReservation, updateReservation , deleteReservation};