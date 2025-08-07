const { sequelize } = require('../config/database')
const User = require('./User')
const Revenue = require('./Revenue')
const Partner = require('./Partner') // ✅ Add Partner import

// Define associations
Revenue.belongsTo(Partner, {
  foreignKey: 'partner_id',
  as: 'partner'
})

Partner.hasMany(Revenue, {
  foreignKey: 'partner_id',
  as: 'revenues'
})

// User associations (if needed)
// User.hasMany(Revenue, { foreignKey: 'created_by' })
// Revenue.belongsTo(User, { foreignKey: 'created_by' })

const models = {
  User,
  Revenue,
  Partner, // ✅ Add Partner to exports
  sequelize
}

module.exports = models