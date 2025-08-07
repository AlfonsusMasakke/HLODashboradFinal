<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch, onBeforeUnmount } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  BarController,
  LineController
)

export default {
  name: 'MonthlyRevenueChart',
  props: {
    monthlyData: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const chartCanvas = ref(null)
    let chartInstance = null

    const createChart = () => {
      if (!chartCanvas.value || !props.monthlyData.length) return

      // Destroy existing chart
      if (chartInstance) {
        chartInstance.destroy()
        chartInstance = null
      }

      const ctx = chartCanvas.value.getContext('2d')

      // Prepare data
      const labels = props.monthlyData.map(item => item.month)
      const aeronautikaData = props.monthlyData.map(item => item.aeronautika / 1000000) // Convert to millions
      const nonAeronautikaData = props.monthlyData.map(item => item.nonAeronautika / 1000000)
      const totalData = props.monthlyData.map(item => item.total / 1000000)

      chartInstance = new ChartJS(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Aeronautika (Juta Rupiah)',
              data: aeronautikaData,
              backgroundColor: 'rgba(59, 130, 246, 0.8)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 1,
              borderRadius: 8,
              borderSkipped: false
            },
            {
              label: 'Non-Aeronautika (Juta Rupiah)',
              data: nonAeronautikaData,
              backgroundColor: 'rgba(139, 92, 246, 0.8)',
              borderColor: 'rgba(139, 92, 246, 1)',
              borderWidth: 1,
              borderRadius: 8,
              borderSkipped: false
            },
            {
              label: 'Total Pendapatan (Juta Rupiah)',
              data: totalData,
              type: 'line',
              borderColor: 'rgba(251, 191, 36, 1)',
              backgroundColor: 'rgba(251, 191, 36, 0.1)',
              borderWidth: 3,
              fill: false,
              tension: 0.4,
              pointBackgroundColor: 'rgba(251, 191, 36, 1)',
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            title: {
              display: true,
              text: 'Grafik Pendapatan Bulanan Bandara Haluoleo',
              font: {
                size: 18,
                weight: 'bold'
              },
              color: '#1f2937'
            },
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                  size: 12,
                  weight: '500'
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              titleColor: '#fff',
              bodyColor: '#fff',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              cornerRadius: 8,
              displayColors: true,
              callbacks: {
                label: function(context) {
                  const value = context.parsed.y
                  return `${context.dataset.label}: Rp ${value.toFixed(1)} Juta`
                }
              }
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: {
                display: false
              },
              ticks: {
                font: {
                  size: 12,
                  weight: '500'
                },
                color: '#6b7280'
              }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              grid: {
                color: 'rgba(0, 0, 0, 0.05)'
              },
              ticks: {
                font: {
                  size: 12
                },
                color: '#6b7280',
                callback: function(value) {
                  return `Rp ${value} Jt`
                }
              }
            }
          },
          animation: {
            duration: 1000,
            easing: 'easeInOutQuart'
          }
        }
      })
    }

    // Watch for data changes
    watch(() => props.monthlyData, () => {
      createChart()
    }, { deep: true })

    // Watch for loading state
    watch(() => props.loading, (newLoading) => {
      if (!newLoading && props.monthlyData.length > 0) {
        createChart()
      }
    })

    onMounted(() => {
      if (props.monthlyData.length > 0 && !props.loading) {
        createChart()
      }
    })

    // Cleanup on unmount
    onBeforeUnmount(() => {
      if (chartInstance) {
        chartInstance.destroy()
        chartInstance = null
      }
    })

    return {
      chartCanvas
    }
  }
}
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 400px;
  width: 100%;
}
</style>