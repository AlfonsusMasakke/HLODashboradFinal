const express = require('express')
const { body, validationResult } = require('express-validator')
const { Op, fn, col } = require('sequelize')
const Partner = require('../models/Partner')
const Revenue = require('../models/Revenue')
const auth = require('../middleware/auth')

const router = express.Router()

// Get all partners with search
router.get('/', auth, async (req, res) => {
  try {
    const { search, status = 'active', limit = 100 } = req.query
    
    let whereClause = { status }
    
    if (search) {
      whereClause.normalized_name = {
        [Op.like]: `%${search.toLowerCase()}%`
      }
    }

    const partners = await Partner.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
      limit: parseInt(limit),
      attributes: ['id', 'name', 'total_transactions', 'total_amount', 'created_at']
    })

    res.json(partners)
  } catch (error) {
    console.error('Get partners error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Check if partner exists (for duplicate prevention)
router.get('/check', auth, async (req, res) => {
  try {
    const { name } = req.query
    
    if (!name) {
      return res.status(400).json({ message: 'Partner name is required' })
    }

    const existingPartner = await Partner.findOne({
      where: {
        normalized_name: name.toLowerCase().trim()
      }
    })

    res.json({
      exists: !!existingPartner,
      partner: existingPartner ? {
        id: existingPartner.id,
        name: existingPartner.name
      } : null
    })
  } catch (error) {
    console.error('Check partner error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Create new partner
router.post('/', [
  auth,
  body('name')
    .notEmpty()
    .withMessage('Nama partner wajib diisi')
    .isLength({ min: 1, max: 100 })
    .withMessage('Nama partner maksimal 100 karakter')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { name } = req.body
    const normalizedName = name.toLowerCase().trim()

    // Check for duplicates
    const existingPartner = await Partner.findOne({
      where: { normalized_name: normalizedName }
    })

    if (existingPartner) {
      return res.status(400).json({ 
        message: 'Mitra dengan nama ini sudah terdaftar',
        existingPartner: {
          id: existingPartner.id,
          name: existingPartner.name
        }
      })
    }

    const partner = await Partner.create({
      name: name.trim(),
      normalized_name: normalizedName
    })

    res.status(201).json({
      id: partner.id,
      name: partner.name,
      total_transactions: partner.total_transactions,
      total_amount: partner.total_amount
    })

  } catch (error) {
    console.error('Create partner error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Update partner
router.put('/:id', [
  auth,
  body('name')
    .notEmpty()
    .withMessage('Nama partner wajib diisi')
    .isLength({ min: 1, max: 100 })
    .withMessage('Nama partner maksimal 100 karakter')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const { id } = req.params
    const { name } = req.body
    const normalizedName = name.toLowerCase().trim()

    const partner = await Partner.findByPk(id)
    if (!partner) {
      return res.status(404).json({ message: 'Partner tidak ditemukan' })
    }

    // Check for duplicates (exclude current partner)
    const existingPartner = await Partner.findOne({
      where: { 
        normalized_name: normalizedName,
        id: { [Op.ne]: id }
      }
    })

    if (existingPartner) {
      return res.status(400).json({ 
        message: 'Mitra dengan nama ini sudah terdaftar' 
      })
    }

    await partner.update({
      name: name.trim(),
      normalized_name: normalizedName
    })

    res.json({
      id: partner.id,
      name: partner.name,
      total_transactions: partner.total_transactions,
      total_amount: partner.total_amount
    })

  } catch (error) {
    console.error('Update partner error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Delete partner
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    const partner = await Partner.findByPk(id)
    if (!partner) {
      return res.status(404).json({ message: 'Partner tidak ditemukan' })
    }

    // Check if partner has transactions
    const transactionCount = await Revenue.count({
      where: { partner_id: id }
    })

    if (transactionCount > 0) {
      return res.status(400).json({ 
        message: `Tidak dapat menghapus partner. Masih ada ${transactionCount} transaksi terkait.`,
        transactionCount
      })
    }

    await partner.destroy()
    res.json({ message: 'Partner berhasil dihapus' })

  } catch (error) {
    console.error('Delete partner error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

// Get partner statistics
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params

    const partner = await Partner.findByPk(id)
    if (!partner) {
      return res.status(404).json({ message: 'Partner tidak ditemukan' })
    }

    const stats = await Revenue.findAll({
      attributes: [
        [fn('COUNT', col('id')), 'totalTransactions'],
        [fn('SUM', col('amount')), 'totalAmount'],
        [fn('AVG', col('amount')), 'averageAmount'],
        [fn('MAX', col('amount')), 'maxAmount'],
        [fn('MIN', col('amount')), 'minAmount']
      ],
      where: { partner_id: id }
    })

    const monthlyStats = await Revenue.findAll({
      attributes: [
        [fn('DATE_FORMAT', col('date'), '%Y-%m'), 'month'],
        [fn('COUNT', col('id')), 'transactions'],
        [fn('SUM', col('amount')), 'amount']
      ],
      where: { partner_id: id },
      group: [fn('DATE_FORMAT', col('date'), '%Y-%m')],
      order: [[fn('DATE_FORMAT', col('date'), '%Y-%m'), 'DESC']],
      limit: 12
    })

    res.json({
      partner: {
        id: partner.id,
        name: partner.name
      },
      summary: stats[0] ? stats[0].dataValues : {
        totalTransactions: 0,
        totalAmount: 0,
        averageAmount: 0,
        maxAmount: 0,
        minAmount: 0
      },
      monthlyStats: monthlyStats.map(stat => ({
        month: stat.dataValues.month,
        transactions: parseInt(stat.dataValues.transactions),
        amount: parseFloat(stat.dataValues.amount)
      }))
    })

  } catch (error) {
    console.error('Get partner stats error:', error)
    res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router