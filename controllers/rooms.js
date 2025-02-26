const CoWorkingSpace = require('../models/CoWorkingSpace')
const Reservation = require('../models/Reservation')

const getRooms = async (req, res, next) => {
  try {
    const coworkingspace = await CoWorkingSpace.findById(
      req.params.CoWorkingSpaceID
    )

    return res
      .status(200)
      .json({ success: true, data: coworkingspace.rooms })
  } catch (e) {
    next(e)
  }
}

const getRoom = async (req, res, next) => {
  try {
    const coworkingspace = await CoWorkingSpace.find({
      _id: req.params.CoWorkingSpaceID,
      'rooms._id': (req.params.room_id),
    })

    if(!coworkingspace){
      res.status(400).json({success : false , msg : `not found ${req.params.room_id}`});
    }

    res.status(200).json({ success: true, data: coworkingspace })
  } catch (e) {
    next(e)
  }
}

const createRoom = async (req,res,next) => {
  try {
    const room = req.body;
    let coworkingspace = await CoWorkingSpace.findById(req.params.CoWorkingSpaceID);

    if(!coworkingspace){
      res.status(400).json({success : false , mag : `not found ${req.params.CoWorkingSpaceID}`});
    }

    const existedRoom = await CoWorkingSpace.find({_id: req.params.CoWorkingSpaceID,
      'rooms.roomNumber' : room.roomNumber});
    

    //console.log(existedRoom);  
    if(existedRoom.length === 0){
        await CoWorkingSpace.updateOne({_id : req.params.CoWorkingSpaceID} , {$push : {rooms : room}});
        coworkingspace = await CoWorkingSpace.findById(req.params.CoWorkingSpaceID);
        res.status(201).json({success : true , data : coworkingspace});
    }
    else{
      res.status(400).json({success : false , msg : `This room number has already created`});
    }  


   // console.log(coworkingspace);
    
    //res.status(201).json({success : true , data : coworkingspace});

  } catch (error) {
    next(error);
  }
}


const deleteRoom = async (req,res,next) => {
  try {
    const coworkingspace = await CoWorkingSpace.findOne({
      _id: req.params.CoWorkingSpaceID,
      'rooms._id': (req.params.room_id),
    })

    if(!coworkingspace){
      res.status(400).json({success : false , msg : `not found ${req.params.room_id}`});
    }


    const roomToDelete = coworkingspace.rooms.find(room => room._id.toString() === req.params.room_id);
    if (!roomToDelete) {
      return res.status(404).json({ success: false, msg: "Room not found" });
    }


    await CoWorkingSpace.findByIdAndUpdate(req.params.CoWorkingSpaceID , 
      {$pull :
        { rooms :
          { 
            _id : req.params.room_id
          }
        }
      },{ safe: true });

    //cascade delete when deleted room
    await Reservation.deleteMany({
      coWorkingSpace: req.params.CoWorkingSpaceID,
      roomNumber: roomToDelete.roomNumber // Ensure you're deleting the correct reservations
    });

    res.status(200).json({success : true});
  } catch (error) {
    next(error);
  }
}


const updateRoom = async (req,res,next) => {
  try {
    const coworkingspace = await CoWorkingSpace.find({
      _id: req.params.CoWorkingSpaceID,
      'rooms._id': (req.params.room_id),
    })

    if(!coworkingspace){
      res.status(400).json({success : false , msg : `not found ${req.params.room_id}`});
    }

    // console.log(req.body.capacity);
    await CoWorkingSpace.findOneAndUpdate({_id :req.params.CoWorkingSpaceID , 
       rooms : {$elemMatch : {_id : req.params.room_id} }}  ,
      {
        $set : {
          'rooms.$.capacity' : req.body.capacity,
          'rooms.$.facilities' : req.body.facilities
        }
      }
    );

// 'rooms.$.roomNumber' : req.body.roomNumber,

    res.status(200).json({success : true});
  } catch (error) {
    next(error);
  }
}

module.exports = { getRooms, getRoom ,createRoom , deleteRoom , updateRoom};
