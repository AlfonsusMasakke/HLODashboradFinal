const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Partner = sequelize.define('Partner', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      len: [1, 100],
      notEmpty: true
    }
  },
  normalized_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Lowercase version for case-insensitive comparison'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive'),
    allowNull: false,
    defaultValue: 'active'
  },
  total_transactions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  total_amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'partners',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeSave: (partner) => {
      // Auto-generate normalized name for case-insensitive search
      partner.normalized_name = partner.name.toLowerCase().trim()
    }
  },
  indexes: [
    {
      unique: true,
      fields: ['normalized_name']
    },
    {
      fields: ['status']
    }
  ]
})

module.exports = Partner