const { sequelize } = require('../config/database')
const Revenue = require('../models/Revenue')
require('dotenv').config()

const resetDatabase = async () => {
  try {
    console.log('🔄 Resetting database...')
    
    await sequelize.authenticate()
    console.log('✅ Connected to database')
    
    // Clear all revenue data
    await Revenue.destroy({ where: {}, truncate: true })
    console.log('🗑️ All revenue data cleared')
    
    console.log('\n🎉 Database reset completed!')
    console.log('💡 You can now add new data through the dashboard')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error resetting database:', error.message)
    process.exit(1)
  }
}

resetDatabase()