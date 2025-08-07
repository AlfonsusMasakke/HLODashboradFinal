const { DataTypes } = require('sequelize')

const { sequelize } = require('../config/database')
const Revenue = sequelize.define('Revenue', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true,
      notEmpty: true
    }
  },
  partner_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'partners',
      key: 'id'
    },
    validate: {
      notEmpty: true
    }
  },
  category: {
    type: DataTypes.ENUM('aeronautika', 'non-aeronautika'),
    allowNull: false
  },
  service_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  amount: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    validate: {
      isDecimal: true,
      min: 0
    }
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  payment_status: {
    type: DataTypes.ENUM('paid', 'pending', 'overdue'),
    allowNull: false,
    defaultValue: 'pending'
  },
  payment_method: {
    type: DataTypes.ENUM('transfer', 'cash', 'check', 'credit'),
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  period_start: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  period_end: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: 'revenues',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['date']
    },
    {
      fields: ['category']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['partner_id']
    }
  ]
})

module.exports = Revenue