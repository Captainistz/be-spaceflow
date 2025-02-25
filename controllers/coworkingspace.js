const CoWorkingSpace = require('../models/CoWorkingSpace.js')
const Reservation = require('../models/Reservation.js')

const getCoWorkingSpaces = async (req,res,next) => {
  try {
    // handle <>= and populating
    const reqQuery = {...req.query};
    const removeFields = ['select','sort','page','limit'];
    removeFields.forEach(param => delete reqQuery[param])
    let queryString = JSON.stringify(reqQuery)
    queryString = queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`)
    let query = CoWorkingSpace.find(JSON.parse(queryString)).populate('reservations')
    
    // handle select and sort
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ')
      query = query.select(fields)
    }
    
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ')
      query = query.sort(sortBy)
    } else {
      query = query.sort('-createdAt')
    }
    
    // handle pagination
    const page = parseInt(req.query.page,10) || 1;
    const limit = parseInt(req.query.limit,10) || 25;
    const startIndex = (page-1)*limit
    const endIndex = (page)*limit
    const total = await CoWorkingSpace.countDocuments()
    
    query = query.skip(startIndex).limit(limit)
    
    const pagination = {}
    if (endIndex < total) {
      pagination.next = {
        page: page+1,
        limit
      }
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page-1,
        limit
      }
    }
    
    // actual query
    const coworkingspaces = await query
    res.status(200).json({
      success:true,
      count: coworkingspaces.length,
      pagination,
      data: coworkingspaces
    })
  } catch (err) {
    next(err)
  }
}

const getCoWorkingSpace = async (req,res,next) => {
  try {
    const {id} = req.params
    const coworkingspace = await CoWorkingSpace.findById(id)
    res.status(200).json({
      success: true,
      data: coworkingspace
    })
  } catch (err) {
    next(err);
  }
}


const addCoWorkingSpace = async (req,res,next) => {
  try {
      const coworkingspace = await CoWorkingSpace.create(req.body);
      return res.status(201).json({
        success: true,
        data: coworkingspace
      });
  } catch (error) {
    next(error);
  }
}


const updateCoworkingSpace = async (req,res,next) => {
  try {
   // console.log("use update /////////// \n");
    const coworkingspace = await CoWorkingSpace.findByIdAndUpdate(req.params.id , req.body , {
      new : true,
      runValidators : true
    });

    if(!coworkingspace){
      return res.status(400).json({
        success : false,
        msg : `not found ${req.params.id}`
      });
    }

    return res.status(200).json({
      success : true,
      data : coworkingspace
    })

  } catch (error) {
    next(error);
  }
}


const deleteCoWorkingSpace = async (req,res,next) => {
  try {
    const coworkingspace = await CoWorkingSpace.findById(req.params.id);

    if(!coworkingspace){
      return res.status(400).json({
        success : false,
        msg :  `not found ${req.params.id}`
      })
    }

    await CoWorkingSpace.deleteOne({_id : req.params.id});

    res.status(200).json({
      success : true
    })
  } catch (error) {
    next(error)
  }
}


module.exports = { getCoWorkingSpaces, getCoWorkingSpace , addCoWorkingSpace , updateCoworkingSpace , deleteCoWorkingSpace};