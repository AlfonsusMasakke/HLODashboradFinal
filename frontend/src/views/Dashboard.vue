<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="dashboard-header">
      <div class="header-left">
        <img src="/logo-haluoleo.png" alt="Haluoleo Airport" class="header-logo">
        <div class="header-title">
          <h1>DASHBOARD</h1>
          <p>CAPAIAN KINERJA PENAGIHAN</p>
        </div>
      </div>
      <div class="header-right">
        <div class="user-info">
          <span class="user-name">{{ authStore.user?.username || 'User' }}</span>
          <button @click="logout" class="logout-btn">
            <i class="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>
    </div>

    <!-- Dashboard Body dengan Sidebar Layout -->
    <div class="dashboard-body">
      <!-- Left Sidebar -->
      <div class="left-sidebar">
        <!-- Filter Tahun Widget -->
        <div class="widget year-filter-widget">
          <div class="widget-header">
            <h3>Tahun</h3>
            <p>Disini tempat user dapat mengganti garis tahun dan bulan</p>
          </div>
          <div class="filter-controls">
            <select v-model="selectedYear" @change="handleYearChange" class="year-select">
              <option v-for="year in years" :key="year" :value="year">{{ year }}</option>
            </select>
          </div>
        </div>

        <!-- Jenis Layanan Terbesar Widget -->
        <div class="widget service-widget">
          <div class="widget-header">
            <div class="widget-icon">
              <i class="fas fa-trophy"></i>
            </div>
            <h3>Jenis Layanan Terbesar</h3>
          </div>
          <div v-if="revenueStore.loading" class="widget-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Memuat...</span>
          </div>
          <div v-else-if="topServices.length > 0" class="service-content">
            <div class="service-name">{{ getServiceLabel(topServices[0].name) }}</div>
            <div class="service-amount">{{ formatCurrency(topServices[0].amount) }}</div>
          </div>
          <div v-else class="widget-empty">
            <span>Belum ada data</span>
          </div>
        </div>

        <!-- Kategori Tertinggi Widget -->
        <div class="widget category-widget">
          <div class="widget-header">
            <div class="widget-icon">
              <i class="fas fa-globe"></i>
            </div>
            <h3>Kategori Tertinggi</h3>
          </div>
          <div v-if="revenueStore.loading" class="widget-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Memuat...</span>
          </div>
          <div v-else class="category-content">
            <div class="category-name">{{ topCategory.name }}</div>
            <div class="category-amount">{{ formatCurrency(topCategory.amount) }}</div>
            <div class="category-percentage">{{ topCategory.percentage }}%</div>
          </div>
        </div>
      </div>

      <!-- Center Content -->
      <div class="center-content">
        <!-- Stats Cards -->
        <div class="stats-overview">
          <div class="stat-card aeronautika">
            <div class="stat-icon">
              <i class="fas fa-plane"></i>
            </div>
            <div class="stat-content">
              <h3>AERONAUTIKA</h3>
              <p class="stat-value">{{ formatCurrency(aeronautikaTotal) }}</p>
            </div>
          </div>

          <div class="stat-card non-aeronautika">
            <div class="stat-icon">
              <i class="fas fa-building"></i>
            </div>
            <div class="stat-content">
              <h3>NON-AERONAUTIKA</h3>
              <p class="stat-value">{{ formatCurrency(nonAeronautikaTotal) }}</p>
            </div>
          </div>

          <div class="stat-card total">
            <div class="stat-icon">
              <i class="fas fa-chart-line"></i>
            </div>
            <div class="stat-content">
              <h3>TOTAL PENDAPATAN</h3>
              <p class="stat-value">{{ formatCurrency(totalRevenue) }}</p>
            </div>
          </div>

          <div class="stat-card transactions">
            <div class="stat-icon">
              <i class="fas fa-file-invoice"></i>
            </div>
            <div class="stat-content">
              <h3>TOTAL TRANSAKSI</h3>
              <p class="stat-value">{{ revenueStore.revenueData.length }}</p>
            </div>
          </div>
        </div>

        <!-- Main Chart -->
        <div class="main-chart-section">
          <div class="chart-header">
            <div class="chart-title">
              <h3>Grafik Total Pendapatan Bulanan</h3>
              <p>Disajikan dengan Stack Bar dan Line yang menghubungkan garis pendapatan</p>
            </div>
            <div class="chart-controls">
              <button @click="goToDetail" class="detail-btn">
                <i class="fas fa-chart-pie"></i>
                Lihat Detail
              </button>
              <button @click="refreshAllData" class="refresh-btn" :disabled="isRefreshing">
                <i class="fas fa-sync-alt" :class="{ 'fa-spin': isRefreshing }"></i>
                Refresh
              </button>
            </div>
          </div>
          
          <div v-if="revenueStore.monthlyLoading" class="chart-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Memuat grafik...</span>
          </div>
          
          <div v-else-if="revenueStore.monthlyData.length === 0" class="chart-empty">
            <i class="fas fa-chart-bar"></i>
            <span>Belum ada data untuk ditampilkan</span>
          </div>
          
          <div v-else class="chart-container">
            <MainChart :data="revenueStore.monthlyData" />
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div class="right-sidebar">
        <!-- Jenis Pendapatan Widget -->
        <div class="widget revenue-types-widget">
          <div class="widget-header">
            <h3>Jenis Pendapatan</h3>
          </div>
          <div class="revenue-types">
            <div class="revenue-type aeronautika">
              <div class="type-header">
                <div class="type-icon">
                  <i class="fas fa-plane"></i>
                </div>
                <h4>Aeronautika</h4>
              </div>
              <ul class="service-list">
                <li>PJP2U</li>
                <li>PJP4U</li>
                <li>Jasa pemakaian garbarata (aviobridge)</li>
                <li>Pemakaian check-in counter</li>
                <li>JPKP2U</li>
              </ul>
            </div>
            
            <div class="revenue-type non-aeronautika">
              <div class="type-header">
                <div class="type-icon">
                  <i class="fas fa-building"></i>
                </div>
                <h4>Non-Aeronautika</h4>
              </div>
              <ul class="service-list">
                <li>Sewa ruang/tempat</li>
                <li>Sewa lahan</li>
                <li>Pemakaian listrik (110%)</li>
                <li>Konsesi 5% dari tenant</li>
                <li>Konsesi 10% parkir reguler</li>
                <li>Konsesi 15% parkir inap</li>
                <li>Fuel throughput</li>
                <li>Konsesi iklan</li>
                <li>Pembuatan pas bandara</li>
                <li>Ground handling 15%</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Top 10 Mitra Widget -->
        <div class="widget top-partners-widget">
          <div class="widget-header">
            <h3>10 Mitra Sumber Pendapatan Terbesar</h3>
            <p>Di urutkan dari yang tertinggi hingga yang terendah</p>
          </div>
          
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Cari mitra..."
              class="search-input"
            >
          </div>
          
          <div v-if="revenueStore.loading" class="widget-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <span>Memuat mitra...</span>
          </div>
          
          <div v-else-if="filteredPartners.length > 0" class="partners-list">
            <div 
              v-for="(partner, index) in filteredPartners" 
              :key="`${partner.name}-${index}`"
              class="partner-item"
              :class="{ 'top-three': index < 3 }"
              @click="handlePartnerClick(partner)"
            >
              <div class="partner-rank">
                <span v-if="index < 3" class="medal">
                  <i :class="getMedalIcon(index)"></i>
                </span>
                <span v-else class="rank-number">{{ index + 1 }}</span>
              </div>
              
              <div class="partner-info">
                <div class="partner-name" :title="partner.name">{{ partner.name }}</div>
                <div class="partner-amount">{{ formatCurrency(partner.amount) }}</div>
                <div class="partner-percentage">{{ partner.percentage }}%</div>
              </div>
              
              <div class="partner-arrow">
                <i class="fas fa-chevron-right"></i>
              </div>
            </div>
          </div>
          
          <div v-else class="widget-empty">
            <i class="fas fa-users"></i>
            <span>{{ searchQuery ? 'Tidak ada mitra yang ditemukan' : 'Belum ada data mitra' }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- FAB -->
    <router-link to="/data-entry" class="fab" title="Tambah Data Pendapatan">
      <i class="fas fa-plus"></i>
    </router-link>

    <!-- Partner Detail Modal -->
    <div v-if="showPartnerModal" class="modal-overlay" @click="closePartnerModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ selectedPartner.name }}</h3>
          <button @click="closePartnerModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Total Pendapatan: {{ formatCurrency(selectedPartner.amount) }}</p>
          <p>Total Transaksi: {{ selectedPartner.transactions }}</p>
          <p>Kontribusi: {{ selectedPartner.percentage }}%</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useRevenueStore } from '../stores/revenue'
import MainChart from '../components/MainChart.vue'

export default {
  name: 'Dashboard',
  components: {
    MainChart
  },
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    const revenueStore = useRevenueStore()
    
    const selectedYear = ref(new Date().getFullYear())
    const years = ref([2020, 2021, 2022, 2023, 2024, 2025])
    const isRefreshing = ref(false)
    const searchQuery = ref('')
    
    // Modal
    const showPartnerModal = ref(false)
    const selectedPartner = ref(null)
    
    // ✅ Enhanced computed values with proper partner handling
    const aeronautikaTotal = computed(() => {
      return revenueStore.revenueData
        .filter(item => item.category === 'aeronautika')
        .reduce((total, item) => {
          const amount = parseFloat(item.amount || 0)
          return total + amount
        }, 0)
    })
    
    const nonAeronautikaTotal = computed(() => {
      return revenueStore.revenueData
        .filter(item => item.category === 'non-aeronautika')
        .reduce((total, item) => {
          const amount = parseFloat(item.amount || 0)
          return total + amount
        }, 0)
    })
    
    const totalRevenue = computed(() => {
      return aeronautikaTotal.value + nonAeronautikaTotal.value
    })

    const topServices = computed(() => {
      if (!revenueStore.revenueData.length) return []
      
      const serviceMap = {}
      revenueStore.revenueData.forEach(item => {
        if (!serviceMap[item.service_type]) {
          serviceMap[item.service_type] = 0
        }
        serviceMap[item.service_type] += parseFloat(item.amount || 0)
      })
      
      return Object.entries(serviceMap)
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5)
    })

    const topCategory = computed(() => {
      const aero = aeronautikaTotal.value
      const non = nonAeronautikaTotal.value
      const total = aero + non
      
      if (total === 0) return { name: 'Tidak ada data', amount: 0, percentage: 0 }
      
      if (aero >= non) {
        return { 
          name: 'Aeronautika', 
          amount: aero, 
          percentage: ((aero / total) * 100).toFixed(1) 
        }
      } else {
        return { 
          name: 'Non-Aeronautika', 
          amount: non, 
          percentage: ((non / total) * 100).toFixed(1) 
        }
      }
    })

    // ✅ Fixed topPartners computed with proper partner name extraction
    const topPartners = computed(() => {
      if (!revenueStore.revenueData.length) return []
      
      const partnerMap = {}
      const total = totalRevenue.value
      
      revenueStore.revenueData.forEach(item => {
        // ✅ Handle partner object vs string properly
        let partnerName, partnerId
        
        if (typeof item.partner === 'object' && item.partner !== null) {
          partnerName = item.partner.name || 'Unknown Partner'
          partnerId = item.partner.id
        } else if (typeof item.partner === 'string') {
          partnerName = item.partner
          partnerId = item.partner_id
        } else {
          partnerName = 'Unknown Partner'
          partnerId = item.partner_id || null
        }
        
        if (!partnerMap[partnerName]) {
          partnerMap[partnerName] = {
            id: partnerId,
            name: partnerName,
            amount: 0,
            transactions: 0
          }
        }
        partnerMap[partnerName].amount += parseFloat(item.amount || 0)
        partnerMap[partnerName].transactions += 1
      })
      
      return Object.values(partnerMap)
        .map(partner => ({
          ...partner,
          percentage: total > 0 ? ((partner.amount / total) * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10) // ✅ Ensure we get top 10
    })

const filteredPartners = computed(() => {
      if (!searchQuery.value) return topPartners.value
      
      const query = searchQuery.value.toLowerCase()
      return topPartners.value.filter(partner => 
        partner.name && partner.name.toLowerCase().includes(query)
      )
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

    const goToDetail = () => {
      router.push({
        name: 'MonthlyDetail',
        query: {
          year: selectedYear.value,
          month: new Date().getMonth() + 1
        }
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
    
    const getMedalIcon = (index) => {
      const icons = ['fas fa-medal gold', 'fas fa-medal silver', 'fas fa-medal bronze']
      return icons[index]
    }
    
    const logout = () => {
      authStore.logout()
      router.push('/login')
    }

    const handleYearChange = async () => {
      await refreshAllData()
    }

    const refreshAllData = async () => {
      isRefreshing.value = true
      try {
        console.log('🔄 Refreshing data for year:', selectedYear.value)
        
      await revenueStore.fetchRevenueData({ 
      year: selectedYear.value,
})
        
        await revenueStore.fetchMonthlyData(selectedYear.value)
        console.log('✅ Monthly data detail:')
        revenueStore.monthlyData.forEach(month => {
  console.log(`${month.month}: Total=${month.total}, Aero=${month.aeronautika}, NonAero=${month.nonAeronautika}`)
})
        
      } catch (error) {
        console.error('❌ Error refreshing data:', error)
      } finally {
        isRefreshing.value = false
      }
    }

    const handlePartnerClick = (partner) => {
      selectedPartner.value = partner
      showPartnerModal.value = true
    }

    const closePartnerModal = () => {
      showPartnerModal.value = false
      selectedPartner.value = null
    }
    const monthlyTotal = revenueStore.monthlyData.reduce((sum, m) => sum + m.total, 0)
    console.log('📊 Total from monthly data:', monthlyTotal)
    console.log('📊 Total from revenue data:', totalRevenue.value)
    console.log('📊 Difference:', monthlyTotal - totalRevenue.value)
    
    // ✅ Enhanced onMounted with better debugging
    onMounted(async () => {
      console.log('🚀 Dashboard mounted, initializing...')
      authStore.checkAuth()
      await refreshAllData()
      
      // ✅ Debug computed values
      console.log('💰 Computed totals:', {
        aeronautika: aeronautikaTotal.value,
        nonAeronautika: nonAeronautikaTotal.value,
        total: totalRevenue.value
      })
      console.log('🏢 Top partners computed:', topPartners.value)
    })
    
    return {
      authStore,
      revenueStore,
      selectedYear,
      years,
      isRefreshing,
      searchQuery,
      showPartnerModal,
      selectedPartner,
      aeronautikaTotal,
      nonAeronautikaTotal,
      totalRevenue,
      topServices,
      topCategory,
      topPartners,
      filteredPartners,
      formatCurrency,
      getServiceLabel,
      getMedalIcon,
      logout,
      handleYearChange,
      refreshAllData,
      handlePartnerClick,
      closePartnerModal,
      goToDetail
    }
  }
}
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  background: #f8fafc;
}

.dashboard-header {
  background: linear-gradient(135deg, #6b46c1 0%, #3b82f6 50%, #8b5cf6 100%);
  color: white;
  padding: 20px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.header-logo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
}

.header-title h1 {
  font-size: 28px;
  font-weight: 900;
  color: #fbbf24;
  margin: 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.header-title p {
  font-size: 14px;
  font-weight: 600;
  color: #fbbf24;
  margin: 5px 0 0 0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-name {
  background: rgba(255,255,255,0.2);
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 600;
  font-size: 14px;
}

.logout-btn {
  background: rgba(239, 68, 68, 0.9);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 1);
  transform: translateY(-2px);
}

.dashboard-body {
  display: grid;
  grid-template-columns: 280px 1fr 300px;
  gap: 20px;
  padding: 20px;
  min-height: calc(100vh - 100px);
}

.left-sidebar, .right-sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.center-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Widget Styles */
.widget {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
}

.widget:hover {
  transform: translateY(-2px);
}

.widget-header {
  margin-bottom: 15px;
}

.widget-header h3 {
  margin: 0 0 5px 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 700;
}

.widget-header p {
  margin: 0;
  color: #6b7280;
  font-size: 11px;
  line-height: 1.4;
}

.widget-loading, .widget-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #6b7280;
  font-size: 12px;
  padding: 20px;
}

/* Stats Overview */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.3s ease;
  min-height: 100px;
}

.stat-card:hover {
  transform: translateY(-3px);
}

.stat-card.aeronautika {
  border-left: 4px solid #3b82f6;
}

.stat-card.non-aeronautika {
  border-left: 4px solid #8b5cf6;
}

.stat-card.total {
  border-left: 4px solid #10b981;
}

.stat-card.transactions {
  border-left: 4px solid #f59e0b;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
}

.stat-card.aeronautika .stat-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
}

.stat-card.non-aeronautika .stat-icon {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.stat-card.total .stat-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-card.transactions .stat-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-content h3 {
  margin: 0 0 8px 0;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.2;
  word-break: break-all;
}

/* Partners List Improvements */
.partners-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 350px;
  overflow-y: auto;
}

.partner-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 10px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 4px;
}

.partner-item:hover {
  background: #f8fafc;
  border-color: #e5e7eb;
  transform: translateX(3px);
}

.partner-item.top-three {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-color: #f59e0b;
}

.partner-item.top-three:hover {
  background: linear-gradient(135deg, #fde68a 0%, #fcd34d 100%);
}

.partner-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.medal {
  font-size: 18px;
}

.medal .gold { color: #f59e0b; }
.medal .silver { color: #6b7280; }
.medal .bronze { color: #d97706; }

.rank-number {
  background: #6b7280;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
}

.partner-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.partner-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 13px;
  line-height: 1.3;
  word-wrap: break-word;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.partner-amount {
  font-size: 11px;
  font-weight: 700;
  color: #059669;
}

.partner-percentage {
  font-size: 10px;
  color: #6b7280;
}

.partner-arrow {
  color: #d1d5db;
  font-size: 12px;
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.partner-item:hover .partner-arrow {
  color: #6b7280;
  transform: translateX(2px);
}

/* Main Chart Section */
.main-chart-section {
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.05);
  flex: 1;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.chart-title h3 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
}

.chart-title p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
  line-height: 1.4;
  max-width: 400px;
}

.chart-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.detail-btn, .refresh-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.detail-btn {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
}

.refresh-btn {
  background: linear-gradient(135deg, #6b46c1 0%, #8b5cf6 100%);
  color: white;
}

.detail-btn:hover, .refresh-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 70, 193, 0.3);
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .dashboard-body {
    grid-template-columns: 250px 1fr 280px;
    gap: 15px;
    padding: 15px;
  }
}

@media (max-width: 992px) {
  .dashboard-body {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .left-sidebar, .right-sidebar {
    order: 2;
  }
  
  .center-content {
    order: 1;
  }
  
  .stats-overview {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
    gap: 15px;
    text-align: center;
    padding: 20px;
  }
  
  .header-left {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .stats-overview {
    grid-template-columns: 1fr;
    gap: 15px;
  }
  
  .stat-card {
    padding: 15px;
  }
  
  .stat-value {
    font-size: 16px;
  }
  
  .dashboard-body {
    padding: 15px;
  }
  
  .chart-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .chart-controls {
    width: 100%;
    justify-content: flex-end;
  }
}

@media (max-width: 480px) {
  .dashboard-body {
    padding: 10px;
    gap: 15px;
  }
  
  .fab {
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    font-size: 18px;
  }
  
  .widget {
    padding: 15px;
  }
  
  .stat-card {
    padding: 12px;
    min-height: 80px;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 16px;
  }
  
  .stat-value {
    font-size: 14px;
  }
  
  .partner-name {
    font-size: 12px;
  }
  
  .partner-amount {
    font-size: 10px;
  }
}

/* Additional improvements for partner list */
.search-box {
  position: relative;
  margin-bottom: 15px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 12px;
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 35px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12px;
  background: #f9fafb;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-color: #6b46c1;
  background: white;
  box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.1);
}

/* Year filter and other widgets */
.year-filter-widget {
  background: #f8fafc;
  border: 2px solid #e5e7eb;
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.year-select {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.year-select:focus {
  outline: none;
  border-color: #6b46c1;
}

/* Service Widget */
.service-widget {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
}

.service-widget .widget-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.widget-icon {
  font-size: 16px;
}

.service-content {
  text-align: center;
}

.service-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.service-amount {
  font-size: 12px;
  opacity: 0.9;
}

/* Category Widget */
.category-widget {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
  color: white;
}

.category-widget .widget-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.category-content {
  text-align: center;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
}

.category-amount {
  font-size: 12px;
  opacity: 0.9;
  margin-bottom: 4px;
}

.category-percentage {
  font-size: 11px;
  opacity: 0.8;
}

/* Revenue Types Widget */
.revenue-types {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.revenue-type {
  border-radius: 12px;
  padding: 15px;
  transition: transform 0.3s ease;
}

.revenue-type.aeronautika {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
}

.revenue-type.non-aeronautika {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.revenue-type:hover {
  transform: translateY(-2px);
}

.type-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.type-icon {
  font-size: 14px;
}

.revenue-type.aeronautika .type-icon {
  color: #3b82f6;
}

.revenue-type.non-aeronautika .type-icon {
  color: #8b5cf6;
}

.type-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.service-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.service-list li {
  padding: 4px 0;
  font-size: 11px;
  color: #4b5563;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  transition: color 0.3s ease;
}

.service-list li:last-child {
  border-bottom: none;
}

.service-list li:hover {
  color: #1f2937;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 25px 0 25px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 25px;
}

.modal-body p {
  margin: 0 0 10px 0;
  color: #374151;
  font-size: 14px;
}

/* FAB */
.fab {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 32px rgba(16, 185, 129, 0.4);
  transition: all 0.3s ease;
  text-decoration: none;
  font-size: 20px;
  z-index: 1000;
}

.fab:hover {
  transform: translateY(-5px) scale(1.1);
  box-shadow: 0 12px 40px rgba(16, 185, 129, 0.6);
  color: white;
}

.chart-container {
  height: 400px;
  position: relative;
}

.chart-loading, .chart-empty {
  height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  color: #6b7280;
  font-size: 16px;
}

.chart-loading i, .chart-empty i {
  font-size: 48px;
  opacity: 0.5;
}
</style>