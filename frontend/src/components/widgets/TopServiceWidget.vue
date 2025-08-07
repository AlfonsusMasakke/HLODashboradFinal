<template>
  <div class="widget top-service-widget">
    <div class="widget-header">
      <div class="widget-icon">
        <i class="fas fa-trophy"></i>
      </div>
      <h3>Jenis Layanan Terbesar</h3>
    </div>
    
    <div v-if="loading" class="widget-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Memuat data...</span>
    </div>
    
    <div v-else-if="services.length > 0" class="services-list">
      <div class="service-chart">
        <canvas ref="serviceChart"></canvas>
      </div>
      
      <div class="service-top">
        <div class="service-name">{{ topService.name }}</div>
        <div class="service-amount">{{ formatCurrency(topService.amount) }}</div>
      </div>
    </div>
    
    <div v-else class="widget-empty">
      <i class="fas fa-chart-bar"></i>
      <span>Belum ada data layanan</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip)

export default {
  name: 'TopServiceWidget',
  props: {
    services: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const serviceChart = ref(null)
    let chartInstance = null
    
    const topService = computed(() => {
      return props.services.length > 0 ? props.services[0] : { name: '-', amount: 0 }
    })
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(amount)
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
    
    const createChart = () => {
      if (!serviceChart.value || !props.services.length) return
      
      if (chartInstance) {
        chartInstance.destroy()
      }
      
      const ctx = serviceChart.value.getContext('2d')
      const chartData = props.services.slice(0, 5)
      
      chartInstance = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: chartData.map(service => getServiceLabel(service.name)),
          datasets: [{
            data: chartData.map(service => service.amount / 1000000),
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(139, 92, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(239, 68, 68, 1)'
            ],
            borderWidth: 2,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Rp ${context.parsed.y.toFixed(1)} Juta`
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              display: false
            },
            x: {
              display: false
            }
          }
        }
      })
    }
    
    watch(() => props.services, () => {
      createChart()
    }, { deep: true })
    
    onMounted(() => {
      if (props.services.length > 0) {
        createChart()
      }
    })
    
    return {
      serviceChart,
      topService,
      formatCurrency,
      getServiceLabel
    }
  }
}
</script>

<style scoped>
.top-service-widget {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.widget-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.widget-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
}

.widget-loading, .widget-empty {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.services-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.service-chart {
  height: 80px;
  position: relative;
}

.service-top {
  text-align: center;
}

.service-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 5px;
}

.service-amount {
  font-size: 12px;
  opacity: 0.9;
}
</style>