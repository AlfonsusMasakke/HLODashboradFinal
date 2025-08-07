<template>
  <div class="monthly-detail">
    <!-- Header -->
    <div class="detail-header">
      <div class="header-left">
        <button @click="goBack" class="back-btn">
          <i class="fas fa-arrow-left"></i>
          Kembali ke Dashboard
        </button>
        <div class="header-title">
          <h1>Detail Pendapatan Bulanan</h1>
          <p v-if="detailData">{{ detailData.period.monthName }} {{ detailData.period.year }}</p>
        </div>
      </div>
      <div class="header-right">
        <div class="month-navigator">
          <button @click="previousMonth" class="nav-btn" :disabled="loading">
            <i class="fas fa-chevron-left"></i>
          </button>
          <select v-model="selectedMonth" @change="changeMonth" class="month-select">
            <option v-for="month in months" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
          <select v-model="selectedYear" @change="changeMonth" class="year-select">
            <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
          </select>
          <button @click="nextMonth" class="nav-btn" :disabled="loading">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        <button @click="exportToExcel" class="export-btn" :disabled="loading || !detailData">
          <i class="fas fa-file-excel"></i>
          Export Excel
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Memuat detail pendapatan...</span>
    </div>

    <!-- Content -->
    <div v-else-if="detailData" class="detail-content">
      <!-- Summary Cards -->
      <div class="summary-section">
        <div class="summary-card total">
          <div class="card-icon">
            <i class="fas fa-chart-line"></i>
          </div>
          <div class="card-content">
            <h3>Total Pendapatan</h3>
            <p class="amount">{{ formatCurrency(detailData.summary.totalAmount) }}</p>
            <span class="count">{{ detailData.summary.totalTransactions }} transaksi</span>
          </div>
        </div>

        <div class="summary-card aeronautika">
          <div class="card-icon">
            <i class="fas fa-plane"></i>
          </div>
          <div class="card-content">
            <h3>Aeronautika</h3>
            <p class="amount">{{ formatCurrency(detailData.summary.aeronautikaAmount) }}</p>
            <span class="count">{{ detailData.summary.aeronautikaCount }} transaksi</span>
          </div>
        </div>

        <div class="summary-card non-aeronautika">
          <div class="card-icon">
            <i class="fas fa-building"></i>
          </div>
          <div class="card-content">
            <h3>Non-Aeronautika</h3>
            <p class="amount">{{ formatCurrency(detailData.summary.nonAeronautikaAmount) }}</p>
            <span class="count">{{ detailData.summary.nonAeronautikaCount }} transaksi</span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-container">
          <h3>Breakdown per Partner</h3>
          <PartnerChart :data="detailData.breakdown.byPartner" />
        </div>
        <div class="chart-container">
          <h3>Breakdown per Service Type</h3>
          <ServiceChart :data="detailData.breakdown.byService" />
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-section">
        <div class="filters-header">
          <h3>Filter & Pencarian</h3>
          <button @click="clearFilters" class="clear-filters-btn">
            <i class="fas fa-times"></i>
            Clear Filters
          </button>
        </div>
        <div class="filters-grid">
          <div class="filter-group">
            <label>Cari Partner:</label>
            <input 
              v-model="filters.partner" 
              type="text" 
              placeholder="Nama partner..."
              @input="debounceFilter"
              class="filter-input"
            >
          </div>
          <div class="filter-group">
            <label>Service Type:</label>
            <select v-model="filters.service_type" @change="applyFilters" class="filter-select">
              <option value="">Semua Service</option>
              <option v-for="service in uniqueServices" :key="service" :value="service">
                {{ getServiceLabel(service) }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label>Kategori:</label>
            <select v-model="filters.category" @change="applyFilters" class="filter-select">
              <option value="">Semua Kategori</option>
              <option value="aeronautika">Aeronautika</option>
              <option value="non-aeronautika">Non-Aeronautika</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Sort by:</label>
            <select v-model="filters.sort" @change="applyFilters" class="filter-select">
              <option value="date">Tanggal</option>
              <option value="amount">Jumlah</option>
              <option value="partner">Partner</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="table-section">
        <div class="table-header">
          <h3>Detail Transaksi ({{ filteredTransactions.length }})</h3>
          <div v-if="selectedTransactions.length > 0" class="bulk-actions">
            <span class="selected-count">{{ selectedTransactions.length }} dipilih</span>
            <button @click="handleBulkDelete" class="btn-delete-bulk">
              <i class="fas fa-trash"></i>
              Hapus Terpilih
            </button>
          </div>
        </div>
        <div class="table-container">
          <table class="transactions-table">
            <thead>
              <tr>
                <th class="checkbox-column">
                  <input 
                    type="checkbox" 
                    @change="toggleSelectAll"
                    :checked="isAllSelected"
                    :indeterminate="isIndeterminate"
                  >
                </th>
                <th>Tanggal</th>
                <th>Partner</th>
                <th>Kategori</th>
                <th>Service Type</th>
                <th>Jumlah</th>
                <th>Status</th>
                <th>Invoice</th>
                <th class="actions-column">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="transaction in filteredTransactions" :key="transaction.id" class="transaction-row">
                <td class="checkbox-column">
                  <input 
                    type="checkbox" 
                    :value="transaction.id"
                    v-model="selectedTransactions"
                  >
                </td>
                <td class="date-cell">{{ formatDate(transaction.date) }}</td>
                <td class="partner-cell">{{ transaction.partner }}</td>
                <td class="category-cell">
                  <span class="category-badge" :class="transaction.category">
                    {{ transaction.category === 'aeronautika' ? 'Aeronautika' : 'Non-Aeronautika' }}
                  </span>
                </td>
                <td class="service-cell">{{ getServiceLabel(transaction.service_type) }}</td>
                <td class="amount-cell">{{ formatCurrency(transaction.amount) }}</td>
                <td class="status-cell">
                  <span class="status-badge" :class="transaction.payment_status">
                    {{ getStatusLabel(transaction.payment_status) }}
                  </span>
                </td>
                <td class="invoice-cell">{{ transaction.invoice_number || '-' }}</td>
                <td class="actions-column">
                  <button 
                    @click="handleDeleteSingle(transaction)" 
                    class="btn-delete"
                    title="Hapus transaksi"
                  >
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredTransactions.length === 0" class="no-data">
            <i class="fas fa-inbox"></i>
            <p>Tidak ada transaksi yang ditemukan</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <i class="fas fa-chart-bar"></i>
      <h3>Tidak ada data</h3>
      <p>Tidak ada transaksi untuk periode yang dipilih</p>
    </div>

  <!-- Delete Confirmation Modal -->
<Teleport to="body">
  <Transition name="modal">
    <div v-if="showDeleteModal" class="modal-backdrop" @click="cancelDelete">
      <div class="delete-modal" @click.stop>
        <!-- Modal Header with Animation -->
        <div class="modal-icon-wrapper">
          <div class="modal-icon-bg">
            <svg class="modal-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 9v4m0 4h.01M8.2 7.2l-.2.8m8 0l-.2-.8m-7.6 0L7 12l1.2 4.8m7.6-9.6L17 12l-1.2 4.8m-7.6 0h7.6" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M4 7h16m-1 0v11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7h14z" 
                    stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </div>

        <!-- Modal Content -->
        <div class="modal-content-wrapper">
          <h2 class="modal-title">Konfirmasi Hapus</h2>
          
          <div v-if="deleteType === 'single'" class="delete-info">
            <p class="modal-description">
              Apakah Anda yakin ingin menghapus transaksi ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            
            <div class="transaction-details">
              <div class="detail-item">
                <span class="detail-label">Partner</span>
                <span class="detail-value">{{ deleteTarget.partner }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Jumlah</span>
                <span class="detail-value amount">{{ formatCurrency(deleteTarget.amount) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Tanggal</span>
                <span class="detail-value">{{ formatDate(deleteTarget.date) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Service</span>
                <span class="detail-value">{{ getServiceLabel(deleteTarget.service_type) }}</span>
              </div>
            </div>
          </div>

          <div v-else class="delete-info">
            <p class="modal-description">
              Apakah Anda yakin ingin menghapus <strong>{{ selectedTransactions.length }} transaksi</strong> yang dipilih?
            </p>
            <div class="bulk-delete-warning">
              <svg class="warning-icon" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <span>Aksi ini tidak dapat dibatalkan!</span>
            </div>
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="modal-actions-wrapper">
          <button @click="cancelDelete" class="btn-cancel">
            <span>Batal</span>
          </button>
          <button @click="confirmDelete" class="btn-confirm-delete">
            <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"/>
            </svg>
            <span>Hapus{{ deleteType === 'bulk' ? ` ${selectedTransactions.length} Transaksi` : '' }}</span>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</Teleport>
</div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRevenueStore } from '../stores/revenue'
import PartnerChart from '../components/PartnerChart.vue'
import ServiceChart from '../components/ServiceChart.vue'
import * as XLSX from 'xlsx'

export default {
  name: 'MonthlyDetail',
  components: {
    PartnerChart,
    ServiceChart
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const revenueStore = useRevenueStore()

    // State
    const selectedYear = ref(parseInt(route.query.year) || new Date().getFullYear())
    const selectedMonth = ref(parseInt(route.query.month) || new Date().getMonth() + 1)
    const loading = ref(false)
    
    const filters = ref({
      partner: '',
      service_type: '',
      category: '',
      sort: 'date'
    })

    // Delete functionality
    const selectedTransactions = ref([])
    const showDeleteModal = ref(false)
       const deleteType = ref('') // 'single' or 'bulk'
    const deleteTarget = ref(null)

    const years = ref([2020, 2021, 2022, 2023, 2024, 2025])
    const months = ref([
      { value: 1, label: 'Januari' },
      { value: 2, label: 'Februari' },
      { value: 3, label: 'Maret' },
      { value: 4, label: 'April' },
      { value: 5, label: 'Mei' },
      { value: 6, label: 'Juni' },
      { value: 7, label: 'Juli' },
      { value: 8, label: 'Agustus' },
      { value: 9, label: 'September' },
      { value: 10, label: 'Oktober' },
      { value: 11, label: 'November' },
      { value: 12, label: 'Desember' }
    ])

    // Computed
    const detailData = computed(() => revenueStore.monthlyDetailData)

    const uniqueServices = computed(() => {
      if (!detailData.value) return []
      const services = new Set(detailData.value.transactions.map(t => t.service_type))
      return Array.from(services)
    })

    const filteredTransactions = computed(() => {
      if (!detailData.value) return []
      
      let transactions = [...detailData.value.transactions]
      
      // Apply filters
      if (filters.value.partner) {
        transactions = transactions.filter(t => 
          t.partner.toLowerCase().includes(filters.value.partner.toLowerCase())
        )
      }
      
      if (filters.value.service_type) {
        transactions = transactions.filter(t => t.service_type === filters.value.service_type)
      }
      
      if (filters.value.category) {
        transactions = transactions.filter(t => t.category === filters.value.category)
      }
      
      // Apply sorting
      transactions.sort((a, b) => {
        switch (filters.value.sort) {
          case 'date':
            return new Date(b.date) - new Date(a.date)
          case 'amount':
            return b.amount - a.amount
          case 'partner':
            return a.partner.localeCompare(b.partner)
          default:
            return 0
        }
      })
      
      return transactions
    })

    const isAllSelected = computed(() => {
      if (filteredTransactions.value.length === 0) return false
      return filteredTransactions.value.every(t => 
        selectedTransactions.value.includes(t.id)
      )
    })

    const isIndeterminate = computed(() => {
      if (selectedTransactions.value.length === 0) return false
      return !isAllSelected.value && 
        filteredTransactions.value.some(t => selectedTransactions.value.includes(t.id))
    })

    // Methods
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    }

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }

    const getServiceLabel = (serviceType) => {
      const serviceLabels = {
        'pjp2u': 'PJP2U',
        'pjp4u': 'PJP4U',
        'garbarata': 'Garbarata',
        'checkin_counter': 'Check-in Counter',
        'jpkp2u': 'JPKP2U',
        'sewa_ruang': 'Sewa Ruang',
        'sewa_lahan': 'Sewa Lahan',
        'listrik': 'Listrik',
        'konsesi_tenant': 'Konsesi Tenant',
        'konsesi_parkir_reguler': 'Parkir Reguler',
        'konsesi_parkir_inap': 'Parkir Inap',
        'fuel_throughput': 'Fuel Throughput',
        'konsesi_iklan': 'Iklan',
        'pas_bandara': 'Pas Bandara',
        'ground_handling': 'Ground Handling'
      }
      return serviceLabels[serviceType] || serviceType
    }

    const getStatusLabel = (status) => {
      const statusLabels = {
        'paid': 'Lunas',
        'pending': 'Pending',
        'overdue': 'Terlambat'
      }
      return statusLabels[status] || status
    }

    const loadData = async () => {
      loading.value = true
      try {
        await revenueStore.fetchMonthlyDetail(selectedYear.value, selectedMonth.value, filters.value)
        
        // Reset selections when data changes
        selectedTransactions.value = []
        
        // Update URL without triggering navigation
        router.replace({
          query: {
            year: selectedYear.value,
            month: selectedMonth.value
          }
        })
      } finally {
        loading.value = false
      }
    }

    const goBack = () => {
      router.push('/')
    }

    const changeMonth = () => {
      loadData()
    }

    const previousMonth = () => {
      if (selectedMonth.value === 1) {
        selectedMonth.value = 12
        selectedYear.value--
      } else {
        selectedMonth.value--
      }
      loadData()
    }

    const nextMonth = () => {
      if (selectedMonth.value === 12) {
        selectedMonth.value = 1
        selectedYear.value++
      } else {
        selectedMonth.value++
      }
      loadData()
    }

    const clearFilters = () => {
      filters.value = {
        partner: '',
        service_type: '',
        category: '',
        sort: 'date'
      }
      loadData()
    }

    const applyFilters = () => {
      loadData()
    }

    let debounceTimeout = null
    const debounceFilter = () => {
      clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(() => {
        applyFilters()
      }, 500)
    }

    // Delete functions
    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        // Deselect all
        selectedTransactions.value = selectedTransactions.value.filter(id => 
          !filteredTransactions.value.some(t => t.id === id)
        )
      } else {
        // Select all filtered
        const filteredIds = filteredTransactions.value.map(t => t.id)
        const newIds = filteredIds.filter(id => !selectedTransactions.value.includes(id))
        selectedTransactions.value.push(...newIds)
      }
    }

    const handleDeleteSingle = (transaction) => {
      deleteType.value = 'single'
      deleteTarget.value = transaction
      showDeleteModal.value = true
    }

    const handleBulkDelete = () => {
      deleteType.value = 'bulk'
      deleteTarget.value = null
      showDeleteModal.value = true
    }

    const confirmDelete = async () => {
      try {
        if (deleteType.value === 'single') {
          // Delete single transaction
          const result = await revenueStore.deleteRevenueData(deleteTarget.value.id)
          if (result.success) {
            // Reload data to refresh UI
            await loadData()
          }
        } else {
          // Use bulk delete for multiple transactions
          const result = await revenueStore.bulkDeleteRevenueData(selectedTransactions.value)
          if (result.success) {
            selectedTransactions.value = []
            // Reload data to refresh UI
            await loadData()
          }
        }
        
        showDeleteModal.value = false
      } catch (error) {
        console.error('Error deleting:', error)
      }
    }

    const cancelDelete = () => {
      showDeleteModal.value = false
      deleteType.value = ''
      deleteTarget.value = null
    }

    const exportToExcel = () => {
      if (!detailData.value) return

      const data = filteredTransactions.value.map(transaction => ({
        'Tanggal': formatDate(transaction.date),
        'Partner': transaction.partner,
        'Kategori': transaction.category === 'aeronautika' ? 'Aeronautika' : 'Non-Aeronautika',
        'Service Type': getServiceLabel(transaction.service_type),
        'Jumlah': transaction.amount,
        'Status': getStatusLabel(transaction.payment_status),
        'Invoice': transaction.invoice_number || '-',
        'Metode Pembayaran': transaction.payment_method || '-',
        'Deskripsi': transaction.description || '-'
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Detail Transaksi')

      const fileName = `Detail_Pendapatan_${detailData.value.period.monthName}_${detailData.value.period.year}.xlsx`
      XLSX.writeFile(workbook, fileName)
    }

    onMounted(() => {
      loadData()
    })

    return {
      selectedYear,
      selectedMonth,
      loading,
      filters,
      years,
      months,
      detailData,
      uniqueServices,
      filteredTransactions,
      selectedTransactions,
      showDeleteModal,
      deleteType,
      deleteTarget,
      isAllSelected,
      isIndeterminate,
      formatCurrency,
      formatDate,
      getServiceLabel,
      getStatusLabel,
      loadData,
      goBack,
      changeMonth,
      previousMonth,
      nextMonth,
      clearFilters,
      applyFilters,
      debounceFilter,
      toggleSelectAll,
      handleDeleteSingle,
      handleBulkDelete,
      confirmDelete,
      cancelDelete,
      exportToExcel
    }
  }
}
</script>
<style scoped>
/* Base Layout */
.monthly-detail {
  min-height: 100vh;
  background: #f5f7fa;
}

/* Header Styles */
.detail-header {
  background: white;
  padding: 20px 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  background: #f3f4f6;
  color: #374151;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: #e5e7eb;
  transform: translateX(-2px);
}

.header-title h1 {
  font-size: 24px;
  color: #1f2937;
  margin: 0;
  font-weight: 700;
}

.header-title p {
  color: #6b7280;
  margin: 4px 0 0 0;
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.month-navigator {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #f9fafb;
  padding: 8px;
  border-radius: 10px;
}

.nav-btn {
  background: white;
  border: 1px solid #e5e7eb;
  color: #374151;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.nav-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.nav-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.month-select, .year-select {
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-weight: 500;
  cursor: pointer;
}

.export-btn {
  background: #10b981;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.export-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: #6b7280;
  gap: 12px;
}

.loading-container i {
  font-size: 32px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Content */
.detail-content {
  padding: 0 30px 30px;
  display: flex;
  flex-direction: column;
  gap: 30px;
}

/* Summary Cards */
.summary-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
}

.summary-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.summary-card.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.summary-card.aeronautika {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.summary-card.non-aeronautika {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.card-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.card-content h3 {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  opacity: 0.9;
}

.card-content .amount {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.card-content .count {
  font-size: 14px;
  opacity: 0.8;
}

/* Charts */
.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.chart-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.chart-container h3 {
  font-size: 18px;
  color: #1f2937;
  margin: 0 0 20px 0;
  font-weight: 600;
}

/* Filters */
.filters-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filters-header h3 {
  font-size: 18px;
  color: #1f2937;
  margin: 0;
  font-weight: 600;
}

.clear-filters-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
  font-size: 14px;
}

.clear-filters-btn:hover {
  background: #e5e7eb;
  color: #4b5563;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-group label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
}

.filter-input, .filter-select {
  border: 1px solid #e5e7eb;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
}

.filter-input:focus, .filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Table */
.table-section {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-container {
  overflow-x: auto;
}

.transactions-table {
  width: 100%;
  border-collapse: collapse;
}

.transactions-table th {
  background: #f9fafb;
  padding: 16px 20px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  border-bottom: 1px solid #e5e7eb;
}

.transactions-table td {
  padding: 16px 20px;
  border-bottom: 1px solid #f3f4f6;
  font-size: 14px;
}

.date-cell {
  color: #6b7280;
}

.partner-cell {
  color: #1f2937;
  font-weight: 500;
}

.category-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.category-badge.aeronautika {
  background: #dbeafe;
  color: #1e40af;
}

.category-badge.non-aeronautika {
  background: #d1fae5;
  color: #065f46;
}

.service-cell {
  color: #4b5563;
}

.amount-cell {
  font-weight: 600;
  color: #1f2937;
}

.status-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.paid {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.overdue {
  background: #fee2e2;
  color: #991b1b;
}

.invoice-cell {
  color: #6b7280;
  font-size: 13px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #6b7280;
}

.empty-state i {
  font-size: 64px;
  opacity: 0.2;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 20px;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 16px;
  margin: 0;
}

/* Delete Modal Styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.delete-modal {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: modalSlideIn 0.3s ease-out;
}

@keyframes modalSlideIn {
  from {
    transform: translateY(-30px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

/* Icon Section */
.modal-icon-wrapper {
  padding: 32px 24px 0;
  display: flex;
  justify-content: center;
}

.modal-icon-bg {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  animation: iconPulse 2s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.modal-icon {
  width: 40px;
  height: 40px;
  color: #dc2626;
}

/* Content Section */
.modal-content-wrapper {
  padding: 24px 32px;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  text-align: center;
  margin: 0 0 16px 0;
}

.modal-description {
  font-size: 16px;
  color: #6b7280;
  text-align: center;
  line-height: 1.6;
  margin: 0 0 24px 0;
}

.modal-description strong {
  color: #dc2626;
  font-weight: 600;
}

/* Transaction Details */
.transaction-details {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 14px;
  color: #1f2937;
  font-weight: 500;
}

.detail-value.amount {
  color: #dc2626;
  font-weight: 600;
}

/* Bulk Delete Warning */
.bulk-delete-warning {
  background: #fef3c7;
  border: 1px solid #fde68a;
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}

.warning-icon {
  width: 20px;
  height: 20px;
  color: #f59e0b;
  flex-shrink: 0;
}

.bulk-delete-warning span {
  font-size: 14px;
  color: #92400e;
  font-weight: 500;
}

/* Actions Section */
.modal-actions-wrapper {
  padding: 0 32px 32px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 12px 24px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 100px;
}

.btn-cancel:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.btn-confirm-delete {
  padding: 12px 24px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.btn-confirm-delete:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* Modal Transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .delete-modal {
  animation: modalSlideIn 0.3s ease-out;
}

.modal-leave-active .delete-modal {
  animation: modalSlideOut 0.2s ease-in;
}

@keyframes modalSlideOut {
  from {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateY(-30px) scale(0.95);
    opacity: 0;
  }
}

/* Responsive Design */
@media (max-width: 640px) {
  .delete-modal {
    margin: 20px;
  }

  .modal-content-wrapper {
    padding: 20px;
  }

  .modal-actions-wrapper {
    padding: 0 20px 20px;
    flex-direction: column-reverse;
  }

  .btn-cancel,
  .btn-confirm-delete {
    width: 100%;
    justify-content: center;
  }

  .transaction-details {
    grid-template-columns: 1fr;
  }

  .modal-icon-bg {
    width: 64px;
    height: 64px;
  }

  .modal-icon {
    width: 32px;
    height: 32px;
  }
}

/* Dark mode support (optional) */
@media (prefers-color-scheme: dark) {
  .delete-modal {
    background: #1f2937;
    color: #f3f4f6;
  }

  .modal-title {
    color: #f3f4f6;
  }

  .modal-description {
    color: #d1d5db;
  }

  .transaction-details {
    background: #111827;
    border-color: #374151;
  }

  .detail-label {
    color: #9ca3af;
  }

  .detail-value {
    color: #e5e7eb;
  }

  .btn-cancel {
    background: #374151;
    color: #e5e7eb;
  }

  .btn-cancel:hover {
    background: #4b5563;
  }
}
</style>