const express = require('express')
const { body, validationResult } = require('express-validator')
const { Op, fn, col, literal } = require('sequelize') // ✅ Add missing import
const { Revenue, Partner } = require('../models') // ✅ Add missing import
const auth = require('../middleware/auth')
const { sequelize } = require('../config/database')
const router = express.Router()

// Get all revenue data
router.get('/', auth, async (req, res) => {
  try {
    const { year, month, category, payment_status, page = 1, limit = 10000  } = req.query
    
    let whereClause = {}
    
    // Filter by year
    if (year) {
      whereClause.date = {
        [Op.between]: [`${year}-01-01`, `${year}-12-31`]
      }
    }
    
    // Filter by month
    if (month && year) {
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0)
      whereClause.date = {
        [Op.between]: [startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
      }
    }
    
    // Filter by category
    if (category) {
      whereClause.category = category
    }
    
    // Filter by payment status
    if (payment_status) {
      whereClause.payment_status = payment_status
    }

    const offset = (page - 1) * limit

    const { count, rows } = await Revenue.findAndCountAll({
      where: whereClause,
      include: [{
        model: Partner,
        as: 'partner',
        attributes: ['id', 'name']
      }],
      order: [['date', 'DESC'], ['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    })

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    })

  } catch (error) {
    console.error('Get revenue error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// Get detailed monthly transactions
router.get('/monthly-detail', auth, async (req, res) => {
  try {
    const { year, month, partner, service_type, category, sort = 'date', order = 'DESC' } = req.query
    
    if (!year || !month) {
      return res.status(400).json({ 
        success: false, 
        message: 'Year and month are required' 
      })
    }

    // Parse year and month to integers
    const yearInt = parseInt(year)
    const monthInt = parseInt(month)

    // Method 1: Using SQL functions (RECOMMENDED for MySQL)
    let whereClause = {
      [Op.and]: [
        sequelize.where(sequelize.fn('YEAR', sequelize.col('date')), yearInt),
        sequelize.where(sequelize.fn('MONTH', sequelize.col('date')), monthInt)
      ]
    }
    
    let partnerWhere = {}
    
    // Additional filters
    if (partner) {
      partnerWhere.name = { [Op.like]: `%${partner}%` }
    }
    
    if (service_type) {
      whereClause.service_type = service_type
    }
    
    if (category) {
      whereClause.category = category
    }

    // Get detailed transactions with partner data
    const transactions = await Revenue.findAll({
      where: whereClause,
      include: [{
        model: Partner,
        as: 'partner',
        attributes: ['id', 'name'],
        where: Object.keys(partnerWhere).length > 0 ? partnerWhere : undefined,
        required: false
      }],
      order: [[sort, order.toUpperCase()]],
      attributes: [
        'id', 'date', 'partner_id', 'category', 'service_type', 
        'amount', 'payment_status', 'payment_method', 'description', 'invoice_number'
      ]
    })

    // Get summary statistics - also use the same where clause
    const summary = await Revenue.findAll({
      attributes: [
        [fn('SUM', col('amount')), 'totalAmount'],
        [fn('COUNT', col('Revenue.id')), 'totalTransactions'],
        [fn('SUM', literal("CASE WHEN category = 'aeronautika' THEN amount ELSE 0 END")), 'aeronautikaAmount'],
        [fn('SUM', literal("CASE WHEN category = 'non-aeronautika' THEN amount ELSE 0 END")), 'nonAeronautikaAmount'],
        [fn('COUNT', literal("CASE WHEN category = 'aeronautika' THEN 1 END")), 'aeronautikaCount'],
        [fn('COUNT', literal("CASE WHEN category = 'non-aeronautika' THEN 1 END")), 'nonAeronautikaCount']
      ],
      where: whereClause,
      include: Object.keys(partnerWhere).length > 0 ? [{
        model: Partner,
        as: 'partner',
        attributes: [],
        where: partnerWhere,
        required: false
      }] : []
    })

    // Get breakdown by partner - also use the same where clause
    const partnerBreakdown = await Revenue.findAll({
      attributes: [
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('Revenue.id')), 'count']
      ],
      where: whereClause,
      include: [{
        model: Partner,
        as: 'partner',
        attributes: ['id', 'name'],
        where: Object.keys(partnerWhere).length > 0 ? partnerWhere : undefined,
        required: false
      }],
      group: ['partner.id', 'partner.name'],
      order: [[fn('SUM', col('amount')), 'DESC']]
    })

    // Get breakdown by service type - also use the same where clause
    const serviceBreakdown = await Revenue.findAll({
      attributes: [
        'service_type',
        'category',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('Revenue.id')), 'count']
      ],
      where: whereClause,
      include: Object.keys(partnerWhere).length > 0 ? [{
        model: Partner,
        as: 'partner',
        attributes: [],
        where: partnerWhere,
        required: false
      }] : [],
      group: ['service_type', 'category'],
      order: [[fn('SUM', col('amount')), 'DESC']]
    })

    const summaryData = summary[0] ? summary[0].dataValues : {
      totalAmount: 0,
      totalTransactions: 0,
      aeronautikaAmount: 0,
      nonAeronautikaAmount: 0,
      aeronautikaCount: 0,
      nonAeronautikaCount: 0
    }

    // Format transactions for frontend compatibility
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction.id,
      date: transaction.date,
      partner: transaction.partner?.name || 'Unknown Partner',
      partner_id: transaction.partner_id,
      category: transaction.category,
      service_type: transaction.service_type,
      amount: parseFloat(transaction.amount),
      payment_status: transaction.payment_status,
      payment_method: transaction.payment_method,
      description: transaction.description,
      invoice_number: transaction.invoice_number
    }))

    // Log for debugging
    console.log(`Monthly detail: Found ${formattedTransactions.length} transactions for ${monthInt}/${yearInt}`)

    res.json({
      success: true,
      period: {
        year: yearInt,
        month: monthInt,
        monthName: new Date(yearInt, monthInt - 1).toLocaleString('id-ID', { month: 'long' })
      },
      summary: {
        totalAmount: parseFloat(summaryData.totalAmount) || 0,
        totalTransactions: parseInt(summaryData.totalTransactions) || 0,
        aeronautikaAmount: parseFloat(summaryData.aeronautikaAmount) || 0,
        nonAeronautikaAmount: parseFloat(summaryData.nonAeronautikaAmount) || 0,
        aeronautikaCount: parseInt(summaryData.aeronautikaCount) || 0,
        nonAeronautikaCount: parseInt(summaryData.nonAeronautikaCount) || 0
      },
      transactions: formattedTransactions,
      breakdown: {
        byPartner: partnerBreakdown.map(item => ({
          partner: item.partner?.name || 'Unknown',
          amount: parseFloat(item.dataValues.total),
          count: parseInt(item.dataValues.count)
        })),
        byService: serviceBreakdown.map(item => ({
          serviceType: item.dataValues.service_type,
          category: item.dataValues.category,
          amount: parseFloat(item.dataValues.total),
          count: parseInt(item.dataValues.count)
        }))
      }
    })

  } catch (error) {
    console.error('Get monthly detail error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    })
  }
})

// Get monthly revenue summary
router.get('/monthly', auth, async (req, res) => {
  try {
    const { year } = req.query
    const currentYear = year || new Date().getFullYear()

    const monthlyData = await Revenue.findAll({
      attributes: [
        [fn('MONTH', col('date')), 'month'],
        [fn('YEAR', col('date')), 'year'],
        'category',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('id')), 'count']
      ],
      where: {
        date: {
          [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
        }
      },
      group: ['month', 'year', 'category'],
      order: [['month', 'ASC']]
    })

    // Process data into monthly format
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const result = months.map((monthName, index) => {
      const monthNumber = index + 1
      const monthData = monthlyData.filter(item => item.dataValues.month === monthNumber)
      
      const aeronautika = monthData.find(item => item.dataValues.category === 'aeronautika')
      const nonAeronautika = monthData.find(item => item.dataValues.category === 'non-aeronautika')
      
      const aeroAmount = aeronautika ? parseFloat(aeronautika.dataValues.total) : 0
      const nonAeroAmount = nonAeronautika ? parseFloat(nonAeronautika.dataValues.total) : 0
      
      return {
        month: monthName,
        aeronautika: aeroAmount,
        nonAeronautika: nonAeroAmount,
        total: aeroAmount + nonAeroAmount,
        transactions: (aeronautika ? parseInt(aeronautika.dataValues.count) : 0) + 
                     (nonAeronautika ? parseInt(nonAeronautika.dataValues.count) : 0)
      }
    })

    res.json(result)

  } catch (error) {
    console.error('Get monthly revenue error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// Get revenue summary
router.get('/summary', auth, async (req, res) => {
  try {
    const { year } = req.query
    const currentYear = year || new Date().getFullYear()

    // Get overall summary
    const summary = await Revenue.findAll({
      attributes: [
        [fn('SUM', col('amount')), 'totalRevenue'],
        [fn('COUNT', col('Revenue.id')), 'totalTransactions'],
        [fn('SUM', literal("CASE WHEN category = 'aeronautika' THEN amount ELSE 0 END")), 'aeronautikaRevenue'],
        [fn('SUM', literal("CASE WHEN category = 'non-aeronautika' THEN amount ELSE 0 END")), 'nonAeronautikaRevenue'],
        [fn('SUM', literal("CASE WHEN payment_status = 'paid' THEN amount ELSE 0 END")), 'paidAmount'],
        [fn('SUM', literal("CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END")), 'pendingAmount'],
        [fn('SUM', literal("CASE WHEN payment_status = 'overdue' THEN amount ELSE 0 END")), 'overdueAmount']
      ],
      where: {
        date: {
          [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
        }
      },
      include: [{
        model: Partner,
        as: 'partner',
        attributes: []
      }]
    })

    // Get top services
    const topServices = await Revenue.findAll({
      attributes: [
        'service_type',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('Revenue.id')), 'count']
      ],
      where: {
        date: {
          [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
        }
      },
      include: [{
        model: Partner,
        as: 'partner',
        attributes: []
      }],
      group: ['service_type'],
      order: [[fn('SUM', col('amount')), 'DESC']],
      limit: 10
    })

    // Get top partners
    const topPartners = await Revenue.findAll({
      attributes: [
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('Revenue.id')), 'count']
      ],
      where: {
        date: {
          [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
        }
      },
      include: [{
        model: Partner,
        as: 'partner',
        attributes: ['id', 'name']
      }],
      group: ['partner.id', 'partner.name'],
      order: [[fn('SUM', col('amount')), 'DESC']],
      limit: 10
    })

    const summaryData = summary[0] ? summary[0].dataValues : {
      totalRevenue: 0,
      totalTransactions: 0,
      aeronautikaRevenue: 0,
      nonAeronautikaRevenue: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue: parseFloat(summaryData.totalRevenue) || 0,
          totalTransactions: parseInt(summaryData.totalTransactions) || 0,
          aeronautikaRevenue: parseFloat(summaryData.aeronautikaRevenue) || 0,
          nonAeronautikaRevenue: parseFloat(summaryData.nonAeronautikaRevenue) || 0,
          paidAmount: parseFloat(summaryData.paidAmount) || 0,
          pendingAmount: parseFloat(summaryData.pendingAmount) || 0,
          overdueAmount: parseFloat(summaryData.overdueAmount) || 0
        },
        topServices: topServices.map(service => ({
          name: service.dataValues.service_type,
          amount: parseFloat(service.dataValues.total),
          count: parseInt(service.dataValues.count)
        })),
        topPartners: topPartners.map(partner => ({
          name: partner.partner.name,
          amount: parseFloat(partner.dataValues.total),
          count: parseInt(partner.dataValues.count)
        }))
      }
    })

  } catch (error) {
    console.error('Get summary error:', error)
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    })
  }
})

// Add new revenue data
router.post('/', [
  auth,
  body('date').isISO8601().withMessage('Format tanggal tidak valid'),
  body('partner_id').isInt().withMessage('Partner ID wajib diisi dan harus berupa angka'),
  body('category').isIn(['aeronautika', 'non-aeronautika']).withMessage('Kategori tidak valid'),
  body('service_type').notEmpty().withMessage('Jenis layanan wajib diisi'),
  body('amount').isNumeric().withMessage('Jumlah harus berupa angka'),
  body('payment_status').isIn(['paid', 'pending', 'overdue']).withMessage('Status pembayaran tidak valid')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: errors.array() 
      })
    }

    const {
      date, partner_id, category, service_type, amount,
      invoice_number, payment_status, payment_method,
      description, period_start, period_end
    } = req.body

    // Verify partner exists
    const partner = await Partner.findByPk(partner_id)
    if (!partner) {
      return res.status(400).json({ 
        success: false,
        message: 'Partner tidak ditemukan' 
      })
    }

    const revenue = await Revenue.create({
      date,
      partner_id,
      category,
      service_type,
      amount: parseFloat(amount),
      invoice_number,
      payment_status,
      payment_method,
      description,
      period_start: period_start || null,
      period_end: period_end || null
    })

    // Get the created revenue with partner data
    const revenueWithPartner = await Revenue.findByPk(revenue.id, {
      include: [{
        model: Partner,
        as: 'partner',
        attributes: ['id', 'name']
      }]
    })

    res.status(201).json({
      success: true,
      data: revenueWithPartner
    })

  } catch (error) {
    console.error('Add revenue error:', error)
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: 'Nomor invoice sudah digunakan' 
      })
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    })
  }
})

// Update revenue data
router.put('/:id', [
  auth,
  body('date').optional().isISO8601().withMessage('Format tanggal tidak valid'),
  body('partner_id').optional().isInt().withMessage('Partner ID harus berupa angka'),
  body('category').optional().isIn(['aeronautika', 'non-aeronautika']).withMessage('Kategori tidak valid'),
  body('service_type').optional().notEmpty().withMessage('Jenis layanan wajib diisi'),
  body('amount').optional().isNumeric().withMessage('Jumlah harus berupa angka'),
  body('payment_status').optional().isIn(['paid', 'pending', 'overdue']).withMessage('Status pembayaran tidak valid')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: errors.array() 
      })
    }

    const revenue = await Revenue.findByPk(req.params.id)
    if (!revenue) {
      return res.status(404).json({ 
        success: false,
        message: 'Data pendapatan tidak ditemukan' 
      })
    }

    const updateData = { ...req.body }
    if (updateData.amount) {
      updateData.amount = parseFloat(updateData.amount)
    }

    // Verify partner exists if partner_id is being updated
    if (updateData.partner_id) {
      const partner = await Partner.findByPk(updateData.partner_id)
      if (!partner) {
        return res.status(400).json({ 
          success: false,
          message: 'Partner tidak ditemukan' 
        })
      }
    }

    await revenue.update(updateData)
    
    // Get updated revenue with partner data
    const updatedRevenue = await Revenue.findByPk(revenue.id, {
      include: [{
        model: Partner,
        as: 'partner',
        attributes: ['id', 'name']
      }]
    })
    
    res.json({
      success: true,
      data: updatedRevenue
    })

  } catch (error) {
    console.error('Update revenue error:', error)
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: 'Nomor invoice sudah digunakan' 
      })
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    })
  }
})

// Delete revenue data
router.delete('/:id', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const revenue = await Revenue.findByPk(req.params.id, {
      include: [{
        model: Partner,
        as: 'partner'
      }]
    });
    
    if (!revenue) {
      await transaction.rollback();
      return res.status(404).json({ 
        success: false,
        message: 'Data pendapatan tidak ditemukan' 
      });
    }

    // Store partner_id and amount before deletion
    const partnerId = revenue.partner_id;
    const amount = parseFloat(revenue.amount);

    // Delete the revenue
    await revenue.destroy({ transaction });

    // Update partner statistics
    if (partnerId) {
      const partner = await Partner.findByPk(partnerId, { transaction });
      if (partner) {
        await partner.update({
          total_transactions: Math.max(0, partner.total_transactions - 1),
          total_amount: Math.max(0, parseFloat(partner.total_amount) - amount)
        }, { transaction });
      }
    }

    await transaction.commit();

    res.json({ 
      success: true,
      message: 'Data pendapatan berhasil dihapus' 
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Delete revenue error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
});

// --- BULK DELETE ENDPOINT ---
router.post('/bulk-delete', auth, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'IDs array is required'
      });
    }

    // Get all revenues with partner data
    const revenues = await Revenue.findAll({
      where: {
        id: {
          [Op.in]: ids
        }
      },
      include: [{
        model: Partner,
        as: 'partner'
      }],
      transaction
    });

    if (revenues.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'No revenues found'
      });
    }

    // Group by partner to update statistics
    const partnerUpdates = {};
    
    revenues.forEach(revenue => {
      const partnerId = revenue.partner_id;
      if (partnerId) {
        if (!partnerUpdates[partnerId]) {
          partnerUpdates[partnerId] = {
            count: 0,
            amount: 0
          };
        }
        partnerUpdates[partnerId].count += 1;
        partnerUpdates[partnerId].amount += parseFloat(revenue.amount);
      }
    });

    // Delete all revenues
    await Revenue.destroy({
      where: {
        id: {
          [Op.in]: ids
        }
      },
      transaction
    });

    // Update partner statistics
    for (const [partnerId, updates] of Object.entries(partnerUpdates)) {
      const partner = await Partner.findByPk(partnerId, { transaction });
      if (partner) {
        await partner.update({
          total_transactions: Math.max(0, partner.total_transactions - updates.count),
          total_amount: Math.max(0, parseFloat(partner.total_amount) - updates.amount)
        }, { transaction });
      }
    }

    await transaction.commit();

    res.json({
      success: true,
      message: `${revenues.length} data pendapatan berhasil dihapus`
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Bulk delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});


// Get revenue by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const revenue = await Revenue.findByPk(req.params.id, {
      include: [{
        model: Partner,
        as: 'partner',
        attributes: ['id', 'name']
      }]
    })

    if (!revenue) {
      return res.status(404).json({ 
        success: false,
        message: 'Data pendapatan tidak ditemukan' 
      })
    }

    res.json({
      success: true,
      data: revenue
    })

  } catch (error) {
    console.error('Get revenue by ID error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    })
  }
})

// Get revenue statistics
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { year } = req.query
    const currentYear = year || new Date().getFullYear()

    // Get current year statistics
    const currentYearStats = await Revenue.findAll({
      attributes: [
        [fn('SUM', col('amount')), 'totalRevenue'],
        [fn('COUNT', col('Revenue.id')), 'totalTransactions'],
        [fn('AVG', col('amount')), 'averageAmount'],
        [fn('MAX', col('amount')), 'maxAmount'],
        [fn('MIN', col('amount')), 'minAmount']
      ],
      where: {
        date: {
          [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
        }
      },
      include: [{
        model: Partner,
        as: 'partner',
        attributes: []
      }]
    })

    // Get previous year for comparison
    const previousYear = currentYear - 1
    const previousYearStats = await Revenue.findAll({
      attributes: [
        [fn('SUM', col('amount')), 'totalRevenue'],
        [fn('COUNT', col('Revenue.id')), 'totalTransactions']
      ],
      where: {
        date: {
          [Op.between]: [`${previousYear}-01-01`, `${previousYear}-12-31`]
        }
      },
      include: [{
        model: Partner,
        as: 'partner',
        attributes: []
      }]
    })

    // Get monthly growth
    const monthlyGrowth = await Revenue.findAll({
      attributes: [
        [fn('MONTH', col('date')), 'month'],
        [fn('SUM', col('amount')), 'total']
      ],
      where: {
        date: {
          [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
        }
      },
      group: ['month'],
      order: [['month', 'ASC']]
    })

    // Get category breakdown
    const categoryBreakdown = await Revenue.findAll({
      attributes: [
        'category',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('Revenue.id')), 'count'],
        [fn('AVG', col('amount')), 'average']
      ],
      where: {
        date: {
          [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
        }
      },
      include: [{
        model: Partner,
        as: 'partner',
        attributes: []
      }],
      group: ['category']
    })

    // Get payment status breakdown
    const paymentStatusBreakdown = await Revenue.findAll({
      attributes: [
        'payment_status',
        [fn('SUM', col('amount')), 'total'],
        [fn('COUNT', col('Revenue.id')), 'count']
      ],
      where: {
        date: {
          [Op.between]: [`${currentYear}-01-01`, `${currentYear}-12-31`]
        }
      },
      group: ['payment_status']
    })

    const currentStats = currentYearStats[0] ? currentYearStats[0].dataValues : {
      totalRevenue: 0,
      totalTransactions: 0,
      averageAmount: 0,
      maxAmount: 0,
      minAmount: 0
    }

    const previousStats = previousYearStats[0] ? previousYearStats[0].dataValues : {
      totalRevenue: 0,
      totalTransactions: 0
    }

    // Calculate growth percentages
    const revenueGrowth = previousStats.totalRevenue > 0 
      ? ((currentStats.totalRevenue - previousStats.totalRevenue) / previousStats.totalRevenue) * 100 
      : 0

    const transactionGrowth = previousStats.totalTransactions > 0 
      ? ((currentStats.totalTransactions - previousStats.totalTransactions) / previousStats.totalTransactions) * 100 
      : 0

    res.json({
      success: true,
      data: {
        overview: {
          totalRevenue: parseFloat(currentStats.totalRevenue) || 0,
          totalTransactions: parseInt(currentStats.totalTransactions) || 0,
          averageAmount: parseFloat(currentStats.averageAmount) || 0,
          maxAmount: parseFloat(currentStats.maxAmount) || 0,
          minAmount: parseFloat(currentStats.minAmount) || 0,
          revenueGrowth: parseFloat(revenueGrowth.toFixed(2)),
          transactionGrowth: parseFloat(transactionGrowth.toFixed(2))
        },
        monthlyGrowth: monthlyGrowth.map(item => ({
          month: item.dataValues.month,
          total: parseFloat(item.dataValues.total)
        })),
        categoryBreakdown: categoryBreakdown.map(item => ({
          category: item.dataValues.category,
          total: parseFloat(item.dataValues.total),
          count: parseInt(item.dataValues.count),
          average: parseFloat(item.dataValues.average)
        })),
        paymentStatusBreakdown: paymentStatusBreakdown.map(item => ({
          status: item.dataValues.payment_status,
          total: parseFloat(item.dataValues.total),
          count: parseInt(item.dataValues.count)
        }))
      }
    })

  } catch (error) {
    console.error('Get revenue statistics error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    })
  }
})

module.exports = router