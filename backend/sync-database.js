const { sequelize } = require('./config/database')
const Revenue = require('./models/Revenue')
const Partner = require('./models/Partner')
const User = require('./models/User')

async function syncDatabase() {
  try {
    console.log('🔄 Syncing database...')
    
    // Create tables
    await Partner.sync({ force: false })
    await Revenue.sync({ alter: true }) // Update existing table
    await User.sync({ force: false })
    
    console.log('✅ Database synced successfully!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Database sync error:', error)
    process.exit(1)
  }
}

syncDatabase()