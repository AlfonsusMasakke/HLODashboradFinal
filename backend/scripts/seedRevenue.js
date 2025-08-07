const { sequelize } = require('../config/database')
const Revenue = require('../models/Revenue')
require('dotenv').config()

const seedRevenue = async () => {
  try {
    console.log('🌱 Starting revenue seeding...')
    
    await sequelize.authenticate()
    console.log('✅ Connected to MySQL')
    
    // Clear existing revenue data
    await Revenue.destroy({ where: {}, truncate: true })
    console.log('🧹 Cleared existing revenue data')
    
    // Sample revenue data
    const sampleData = [
      // Aeronautika Data - Januari 2024
      {
        date: '2024-01-15',
        partner: 'Lion Air Group',
        category: 'aeronautika',
        service_type: 'pjp2u',
        amount: 150000000,
            invoice_number: 'INV-2024-001',
        payment_status: 'paid',
        payment_method: 'transfer',
        description: 'Pembayaran PJP2U bulan Januari 2024'
      },
      {
        date: '2024-01-20',
        partner: 'Garuda Indonesia',
        category: 'aeronautika',
        service_type: 'pjp4u',
        amount: 200000000,
        invoice_number: 'INV-2024-002',
        payment_status: 'paid',
        payment_method: 'transfer',
        description: 'Pembayaran PJP4U bulan Januari 2024'
      },
      {
        date: '2024-01-25',
        partner: 'Citilink Indonesia',
        category: 'aeronautika',
        service_type: 'garbarata',
        amount: 75000000,
        invoice_number: 'INV-2024-003',
        payment_status: 'pending',
        payment_method: 'transfer',
        description: 'Jasa pemakaian garbarata (aviobridge)'
      },
      {
        date: '2024-02-01',
        partner: 'Sriwijaya Air',
        category: 'aeronautika',
        service_type: 'checkin_counter',
        amount: 45000000,
        invoice_number: 'INV-2024-004',
        payment_status: 'paid',
        payment_method: 'transfer',
        description: 'Pemakaian check-in counter Februari 2024'
      },
      {
        date: '2024-02-10',
        partner: 'Wings Air',
        category: 'aeronautika',
        service_type: 'jpkp2u',
        amount: 120000000,
        invoice_number: 'INV-2024-005',
        payment_status: 'overdue',
        payment_method: 'transfer',
        description: 'JPKP2U Februari 2024'
      },
      
      // Non-Aeronautika Data
      {
        date: '2024-01-10',
        partner: 'PT Retail Bandara',
        category: 'non-aeronautika',
        service_type: 'sewa_ruang',
        amount: 300000000,
        invoice_number: 'INV-2024-006',
        payment_status: 'paid',
        payment_method: 'transfer',
        description: 'Sewa ruang retail area terminal'
      },
      {
        date: '2024-01-12',
        partner: 'CV Parkir Mandiri',
        category: 'non-aeronautika',
        service_type: 'konsesi_parkir_reguler',
        amount: 85000000,
        invoice_number: 'INV-2024-007',
        payment_status: 'paid',
        payment_method: 'transfer',
        description: 'Konsesi 10% dari parkir reguler (roda 2 dan 4)'
      },
      {
        date: '2024-01-18',
        partner: 'PT Food Court Bandara',
        category: 'non-aeronautika',
        service_type: 'konsesi_tenant',
        amount: 125000000,
        invoice_number: 'INV-2024-008',
        payment_status: 'paid',
        payment_method: 'transfer',
        description: 'Konsesi 5% dari tenant atas penjualan produk/jasa'
      },
      {
        date: '2024-02-05',
        partner: 'PT Fuel Services',
        category: 'non-aeronautika',
        service_type: 'fuel_throughput',
        amount: 450000000,
        invoice_number: 'INV-2024-009',
        payment_status: 'pending',
        payment_method: 'transfer',
        description: 'Fuel throughput Februari 2024'
      },
      {
        date: '2024-02-08',
        partner: 'PT Ground Handling',
        category: 'non-aeronautika',
        service_type: 'ground_handling',
        amount: 180000000,
        invoice_number: 'INV-2024-010',
        payment_status: 'paid',
        payment_method: 'transfer',
        description: 'Ground handling 15% Februari 2024'
      },
      {
        date: '2024-02-12',
        partner: 'PLN Kendari',
        category: 'non-aeronautika',
        service_type: 'listrik',
        amount: 95000000,
        invoice_number: 'INV-2024-011',
        payment_status: 'paid',
        payment_method: 'transfer',
        description: 'Pemakaian listrik (110%) Februari 2024'
      },
      {
        date: '2024-02-15',
        partner: 'PT Advertising Bandara',
        category: 'non-aeronautika',
        service_type: 'konsesi_iklan',
        amount: 65000000,
        invoice_number: 'INV-2024-012',
        payment_status: 'pending',
        payment_method: 'transfer',
        description: 'Konsesi iklan area terminal'
      },
      {
        date: '2024-03-01',
        partner: 'PT Lahan Sejahtera',
        category: 'non-aeronautika',
        service_type: 'sewa_lahan',
        amount: 220000000,
        invoice_number: 'INV-2024-013',
        payment_status: 'paid',
        payment_method: 'transfer',
        description: 'Sewa lahan area komersial Maret 2024'
      },
      {
        date: '2024-03-05',
        partner: 'Koperasi Karyawan',
        category: 'non-aeronautika',
        service_type: 'pas_bandara',
        amount: 25000000,
        invoice_number: 'INV-2024-014',
        payment_status: 'paid',
        payment_method: 'cash',
        description: 'Pembuatan pas bandara karyawan'
      },
      {
        date: '2024-03-10',
        partner: 'PT VIP Parking',
        category: 'non-aeronautika',
        service_type: 'konsesi_parkir_inap',
        amount: 110000000,
        invoice_number: 'INV-2024-015',
        payment_status: 'overdue',
        payment_method: 'transfer',
        description: 'Konsesi 15% dari parkir inap (roda 4)'
      }
    ]
    
    // Generate additional data for multiple months
    const additionalMonths = [
      { month: 3, multiplier: 1.1 }, // April
      { month: 4, multiplier: 0.9 }, // Mei
      { month: 5, multiplier: 1.3 }, // Juni
      { month: 6, multiplier: 1.15 }, // Juli
      { month: 7, multiplier: 1.25 }, // Agustus
      { month: 8, multiplier: 1.4 }, // September
      { month: 9, multiplier: 1.2 }, // Oktober
      { month: 10, multiplier: 1.1 }, // November
      { month: 11, multiplier: 1.5 }  // Desember
    ]
    
    let allData = [...sampleData]
    let invoiceCounter = 16
    
    additionalMonths.forEach(({ month, multiplier }) => {
      sampleData.forEach((item) => {
        const newItem = {
          ...item,
          date: `2024-${String(month + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
          amount: Math.floor(item.amount * multiplier),
          invoice_number: `INV-2024-${String(invoiceCounter).padStart(3, '0')}`,
          payment_status: ['paid', 'pending', 'overdue'][Math.floor(Math.random() * 3)]
        }
        allData.push(newItem)
        invoiceCounter++
      })
    })
    
    // Insert data in batches
    const batchSize = 50
    for (let i = 0; i < allData.length; i += batchSize) {
      const batch = allData.slice(i, i + batchSize)
      await Revenue.bulkCreate(batch)
      console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1} - ${batch.length} records`)
    }
    
    console.log(`\n📊 Total ${allData.length} revenue records seeded successfully!`)
    
    // Show summary
    const summary = await Revenue.findAll({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN category = 'aeronautika' THEN amount ELSE 0 END")), 'aeronautika'],
        [sequelize.fn('SUM', sequelize.literal("CASE WHEN category = 'non-aeronautika' THEN amount ELSE 0 END")), 'nonAeronautika']
      ]
    })
    
    if (summary.length > 0) {
      const data = summary[0].dataValues
      console.log('\n=== REVENUE SUMMARY ===')
      console.log(`Total Records: ${data.count}`)
      console.log(`Total Revenue: Rp ${parseFloat(data.total).toLocaleString('id-ID')}`)
      console.log(`Aeronautika: Rp ${parseFloat(data.aeronautika).toLocaleString('id-ID')}`)
      console.log(`Non-Aeronautika: Rp ${parseFloat(data.nonAeronautika).toLocaleString('id-ID')}`)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding revenue:', error.message)
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`   - ${err.message}`)
      })
    }
    process.exit(1)
  }
}

seedRevenue()