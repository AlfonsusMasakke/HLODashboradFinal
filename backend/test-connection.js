const { sequelize } = require('./config/database')
const User = require('./models/User')
const Revenue = require('./models/Revenue')
require('dotenv').config()

const testConnection = async () => {
  try {
    console.log('🔄 Testing MySQL connection...')
    console.log('📍 Host:', process.env.DB_HOST)
    console.log('📁 Database:', process.env.DB_NAME)
    console.log('👤 User:', process.env.DB_USER)
    
    // Test connection
    await sequelize.authenticate()
    console.log('✅ MySQL connection established successfully!')
    
    // Test database info
    const [results] = await sequelize.query('SELECT VERSION() as version')
    console.log('🔢 MySQL Version:', results[0].version)
    
    // Test table creation
    console.log('🔄 Testing table operations...')
    await sequelize.sync({ force: false })
    console.log('✅ Tables synchronized successfully!')
    
    // Test user table
    const userCount = await User.count()
    console.log('👥 Users in database:', userCount)
    
    // Test revenue table
    const revenueCount = await Revenue.count()
    console.log('💰 Revenue records in database:', revenueCount)
    
    // Test write operation
    console.log('🔄 Testing write operation...')
    const testUser = await User.create({
      username: `test_${Date.now()}`,
      password: 'test123',
      role: 'user',
      fullName: 'Test User'
    })
    console.log('✅ Test user created with ID:', testUser.id)
    
    // Test read operation
    const foundUser = await User.findByPk(testUser.id)
    console.log('✅ Test user retrieved:', foundUser.username)
    
    // Cleanup test data
    await testUser.destroy()
    console.log('✅ Test user deleted')
    
    console.log('\n🎉 All database tests passed!')
    
  } catch (error) {
    console.error('❌ Database test failed:')
    console.error('   Message:', error.message)
    console.error('   Code:', error.original?.code)
    console.error('   SQL State:', error.original?.sqlState)
    
    if (error.original?.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting Tips:')
      console.log('   1. Make sure MySQL service is running')
      console.log('   2. Check MySQL credentials in .env file')
      console.log('   3. Verify database exists')
      console.log('   4. Check MySQL port (default: 3306)')
    }
  } finally {
    await sequelize.close()
    console.log('👋 Database connection closed')
  }
}

testConnection()