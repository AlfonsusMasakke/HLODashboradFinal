<template>
  <div class="widget contribution-widget">
    <div class="widget-header">
      <h3>Kontribusi Nilai Pendapatan dari Tagihan</h3>
      <p>Disajikan dengan presentase pendapatan</p>
    </div>
    
    <div v-if="loading" class="widget-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Memuat data...</span>
    </div>
    
    <div v-else-if="revenueData.length > 0" class="contribution-content">
      <!-- Pie Chart -->
      <div class="chart-container">
        <canvas ref="contributionChart"></canvas>
      </div>
      
      <!-- Service Breakdown -->
      <div class="service-breakdown">
        <div 
          v-for="(service, index) in topServiceBreakdown" 
          :key="service.name"
          class="service-item"
          :style="{ animationDelay: `${index * 0.1}s` }"
        >
          <div class="service-color" :style="{ backgroundColor: getServiceColor(index) }"></div>
          <div class="service-info">
            <span class="service-name">{{ getServiceLabel(service.name) }}</span>
            <span class="service-percentage">{{ service.percentage }}%</span>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="widget-empty">
      <i class="fas fa-chart-pie"></i>
      <span>Belum ada data untuk ditampilkan</span>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default {
  name: 'ContributionWidget',
  props: {
    revenueData: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const contributionChart = ref(null)
    let chartInstance = null
    
    const serviceColors = [
      '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
      '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
    ]
    
    const topServiceBreakdown = computed(() => {
      if (!props.revenueData.length) return []
      
      const serviceMap = {}
      let total = 0
      
      props.revenueData.forEach(item => {
        const amount = parseFloat(item.amount || 0)
        if (!serviceMap[item.service_type]) {
          serviceMap[item.service_type] = 0
        }
        serviceMap[item.service_type] += amount
        total += amount
      })
      
      return Object.entries(serviceMap)
        .map(([name, amount]) => ({
          name,
          amount,
          percentage: total > 0 ? ((amount / total) * 100).toFixed(1) : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 6)
    })
    
    const getServiceColor = (index) => {
      return serviceColors[index % serviceColors.length]
    }
    
    const getServiceLabel = (serviceType) => {
      const serviceLabels = {
        'pjp2u': 'PJP2U',
        'pjp4u': 'PJP4U',
        'garbarata': 'Garbarata',
        'checkin_counter': 'Check-in',
        'jpkp2u': 'JPKP2U',
        'sewa_ruang': 'Sewa Ruang',
        'sewa_lahan': 'Sewa Lahan',
        'listrik': 'Listrik',
        'konsesi_tenant': 'Konsesi Tenant',
        'konsesi_parkir_reguler': 'Parkir Reguler',
        'konsesi_parkir_inap': 'Parkir Inap',
        'fuel_throughput': 'Fuel',
        'konsesi_iklan': 'Iklan',
        'pas_bandara': 'Pas Bandara',
        'ground_handling': 'Ground Handling'
      }
      return serviceLabels[serviceType] || serviceType
    }
    
    const createChart = () => {
      if (!contributionChart.value || !topServiceBreakdown.value.length) return
      
      if (chartInstance) {
        chartInstance.destroy()
      }
      
      const ctx = contributionChart.value.getContext('2d')
      
      chartInstance = new ChartJS(ctx, {
        type: 'doughnut',
        data: {
          labels: topServiceBreakdown.value.map(service => getServiceLabel(service.name)),
          datasets: [{
            data: topServiceBreakdown.value.map(service => service.percentage),
            backgroundColor: topServiceBreakdown.value.map((_, index) => getServiceColor(index)),
            borderWidth: 0,
            cutout: '60%'
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
                  return `${context.label}: ${context.parsed}%`
                }
              }
            }
          },
          animation: {
            animateRotate: true,
            duration: 1000
          }
        }
      })
    }
    
    watch(() => props.revenueData, () => {
      setTimeout(() => createChart(), 100)
    }, { deep: true })
    
    onMounted(() => {
      if (props.revenueData.length > 0) {
        createChart()
      }
    })
    
    return {
      contributionChart,
      topServiceBreakdown,
      getServiceColor,
      getServiceLabel
    }
  }
}
</script>

<style scoped>
.widget {
  background: white;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.05);
}

.widget-header h3 {
  margin: 0 0 8px 0;
  color: #1f2937;
  font-size: 14px;
  font-weight: 700;
}

.widget-header p {
  margin: 0 0 20px 0;
  color: #6b7280;
  font-size: 11px;
  line-height: 1.4;
}

.widget-loading, .widget-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  font-size: 12px;
  padding: 20px 0;
}

.widget-loading i, .widget-empty i {
  font-size: 24px;
  color: #9ca3af;
}

.contribution-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-container {
  height: 140px;
  position: relative;
}

.service-breakdown {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 0;
  animation: slideInLeft 0.5s ease-out forwards;
  opacity: 0;
  transform: translateX(-20px);
}

@keyframes slideInLeft {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.service-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.service-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.service-name {
  font-size: 11px;
  font-weight: 500;
  color: #374151;
}

.service-percentage {
  font-size: 11px;
  font-weight: 700;
  color: #1f2937;
}
</style>