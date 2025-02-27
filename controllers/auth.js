const User = require('../models/User')

const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken()

  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === 'production') {
    options.secure = true
  }
  res.status(statusCode).cookie('token', token, options).json({
    success: true,
    token: token,
  })
}

// @desc   Register user
// @route  POST /api/v1/auth/register
// @access Public
const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role,
    })
    sendTokenResponse(user, 200, res)
  } catch (e) {
    next(e)
  }
}

// @desc   Login user
// @route  POST /api/v1/auth/login
// @access Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      const error = new Error('Missing email or password')
      error.statusCode = 400
      throw error
    }

    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      const error = new Error('Invalid credentials')
      error.statusCode = 401
      throw error
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      const error = new Error('Invalid credentials')
      error.statusCode = 401
      throw error
    }

    sendTokenResponse(user, 200, res)
  } catch (e) {
    next(e)
  }
}

// @desc   Logout user
// @route  GET /api/v1/auth/logout
// @access Public
const logout = async (_, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true,
    })

    res.status(200).json({ success: true, data: {} })
  } catch (e) {
    next(e)
  }
}

// @desc   Get self
// @route  POST /api/v1/auth/me
// @access Public
const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
    res.status(200).json({ success: true, data: user })
  } catch (e) {
    next(e)
  }
}

module.exports = { register, login, logout, me }
