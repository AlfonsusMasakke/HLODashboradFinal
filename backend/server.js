const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()
const { connectDB } = require('./config/database')
const authRoutes = require('./routes/auth')
const revenueRoutes = require('./routes/revenue')
const partnerRoutes = require('./routes/partners')

const app = express()

// Connect to MySQL
connectDB()

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan('combined'))
app.use('/api/partners', partnerRoutes)

// Root route - Welcome message
app.get('/', (req, res) => {

  res.json({

    message: '🚀 Bandara Haluoleo Dashboard API',

    version: '1.0.0',

    status: 'running',

    timestamp: new Date().toISOString(),

    endpoints: {

      health: '/api/health',

      authentication: {

        login: 'POST /api/auth/login',

        logout: 'POST /api/auth/logout'

      },

      revenue: {

        all: 'GET /api/revenue',

        monthly: 'GET /api/revenue/monthly?year=YYYY',

        summary: 'GET /api/revenue/summary?year=YYYY',

        create: 'POST /api/revenue',

        update: 'PUT /api/revenue/:id',

        delete: 'DELETE /api/revenue/:id'

      },

      partners: {

        all: 'GET /api/partners',

        check: 'GET /api/partners/check?name=NAME',

        create: 'POST /api/partners',

        update: 'PUT /api/partners/:id',

        delete: 'DELETE /api/partners/:id',

        stats: 'GET /api/partners/:id/stats'

      }

    },

    environment: process.env.NODE_ENV || 'development',

    database: process.env.DB_NAME || 'haluoleo_dashboard'

  })

})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/revenue', revenueRoutes)

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const { sequelize } = require('./config/database')
    await sequelize.authenticate()
   
    res.json({
      message: 'Server is running!',
      timestamp: new Date().toISOString(),
      status: 'OK',
      database: 'Connected'
    })
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      status: 'ERROR',
      database: 'Disconnected'
    })
  }
})

// Handle favicon requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end()
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack)
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/auth/login',
      'GET /api/revenue',
      'GET /api/revenue/monthly?year=YYYY',
      'GET /api/revenue/summary?year=YYYY'
    ]
  })
})

const PORT = process.env.PORT || 3001

app.listen(PORT, () => {
  console.log('\n🚀 ===== BANDARA HALUOLEO DASHBOARD API =====')
  console.log(`📊 Server running on: http://localhost:${PORT}`)
  console.log(`🔗 API Health Check: http://localhost:${PORT}/api/health`)
  console.log(`💾 Database: MySQL - ${process.env.DB_NAME}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`)
  console.log('===============================================\n')
})