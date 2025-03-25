const User = require('../models/User')

// @desc   Update user
// @route  PUT /api/v1/user/:id
// @access Public
const updateUser = async (req, res, next) => {
  const { id } = req.params
  try {
    const user = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!user) {
      throw new Error('Not found')
    }

    const token = user.getSignedJwtToken()

    return res.status(200).json({
      success: true,
      data: {
        token: token,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        image: user.img,
      },
    })
  } catch (e) {
    next(e)
  }
}

module.exports = { updateUser }
