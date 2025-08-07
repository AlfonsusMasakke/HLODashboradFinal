const express = require('express')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User = require('../models/User')
const auth = require('../middleware/auth')

const router = express.Router()

// Register user
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('Username minimal 3 karakter'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('email').optional().isEmail().withMessage('Format email tidak valid')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username, password, role, fullName, email } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ where: { username } })
    if (existingUser) {
      return res.status(400).json({ message: 'Username sudah terdaftar' })
    }

    // Check email if provided
    if (email) {
      const existingEmail = await User.findOne({ where: { email } })
      if (existingEmail) {
        return res.status(400).json({ message: 'Email sudah terdaftar' })
      }
    }

    // Create user
    const user = await User.create({
      username,
      password,
      role: role || 'user',
      fullName,
      email
    })

    // Generate token
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d'
    })

    res.status(201).json({
      token,
      user: user.toJSON()
    })

  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Login
router.post('/login', [
  body('username').notEmpty().withMessage('Username wajib diisi'),
  body('password').notEmpty().withMessage('Password wajib diisi')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { username, password } = req.body

    // Find user
    const user = await User.findOne({ where: { username, isActive: true } })
    if (!user) {
      return res.status(400).json({ message: 'Username atau password salah' })
    }

    // Check password
    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: 'Username atau password salah' })
    }

    // Update last login
    await user.update({ lastLogin: new Date() })

    // Generate token
    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role
    }

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '7d'
    })

    res.json({
      token,
      user: user.toJSON()
    })

  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id)
    if (!user) {
      return res.status(404).json({ message: 'User tidak ditemukan' })
    }

    res.json({ user: user.toJSON() })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router