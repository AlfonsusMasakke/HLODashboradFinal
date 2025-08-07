const { sequelize } = require('../config/database')
const User = require('../models/User')
require('dotenv').config()

const seedUsers = async () => {
  try {
    console.log('🌱 Starting user seeding...')
    
    await sequelize.authenticate()
    console.log('✅ Connected to MySQL')
    
    // Clear existing users
    await User.destroy({ where: {}, truncate: true })
    console.log('🧹 Cleared existing users')
    
    // Create users
    const users = [
      {
        username: 'admin',
        password: 'admin123',
        role: 'admin',
        fullName: 'Administrator Sistem',
        email: 'admin@haluoleo.com'
      },
      {
        username: 'user',
        password: 'user123',
        role: 'user',
        fullName: 'User Biasa',
        email: 'user@haluoleo.com'
      },
      {
        username: 'manager',
        password: 'manager123',
        role: 'admin',
        fullName: 'Manager Keuangan',
        email: 'manager@haluoleo.com'
      },
      {
        username: 'staff',
        password: 'staff123',
        role: 'user',
        fullName: 'Staff Penagihan',
        email: 'staff@haluoleo.com'
      }
    ]
    
    for (const userData of users) {
      const user = await User.create(userData)
      console.log(`✅ User created: ${userData.username} (${userData.role}) - ID: ${user.id}`)
    }
    
    console.log('\n🎉 ===== USERS SEEDED SUCCESSFULLY =====')
    console.log('👤 Login Credentials:')
    console.log('   Admin: admin / admin123')
    console.log('   Manager: manager / manager123')
    console.log('   User: user / user123')
    console.log('   Staff: staff / staff123')
    console.log('=======================================\n')
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding users:', error.message)
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`   - ${err.message}`)
      })
    }
    process.exit(1)
  }
}

seedUsers()