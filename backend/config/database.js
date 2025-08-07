const { Sequelize } = require('sequelize')
require('dotenv').config()

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'mysql',
    dialectOptions: {
      charset: 'utf8mb4',
      // Hapus collate dari sini
      dateStrings: true,
      typeCast: true
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    timezone: '+07:00' // Timezone Indonesia
  }
)

const connectDB = async () => {
  try {
    await sequelize.authenticate()
    console.log('✅ MySQL Database Connected Successfully!')
    console.log(`📁 Database: ${process.env.DB_NAME}`)
    console.log(`🏠 Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`)
  } catch (error) {
    console.error('❌ Database connection error:', error.message)
    process.exit(1)
  }
}

module.exports = { sequelize, connectDB }