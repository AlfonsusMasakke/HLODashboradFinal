const { sequelize } = require('../config/database')
const models = require('../models')

const migrate = async () => {
  try {
    console.log('🔄 Starting database migration...')
    
    // Test connection
    await sequelize.authenticate()
    console.log('✅ Database connection established')
    
    // Sync all models
    await sequelize.sync({ force: false, alter: true })
    console.log('✅ Database tables created/updated successfully')
    
    console.log('\n🎉 Migration completed successfully!')
    process.exit(0)
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

migrate()