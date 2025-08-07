<template>
  <div class="partner-chart">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'

export default {
  name: 'PartnerChart',
  props: {
    data: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const chartCanvas = ref(null)
    let chartInstance = null

    const createChart = async () => {
      if (!chartCanvas.value || !props.data.length) return

      try {
        const { Chart, registerables } = await import('chart.js')
        Chart.register(...registerables)

        if (chartInstance) {
          chartInstance.destroy()
        }

        const ctx = chartCanvas.value.getContext('2d')
        const topPartners = props.data.slice(0, 10) // Top 10 partners
        
        chartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: topPartners.map(item => item.partner),
            datasets: [{
              data: topPartners.map(item => item.amount),
              backgroundColor: [
                '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444',
                '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12,
                  padding: 15,
                  generateLabels: function(chart) {
                    const data = chart.data
                    if (data.labels.length && data.datasets.length) {
                      return data.labels.map((label, i) => {
                        const value = data.datasets[0].data[i]
                        const formatted = new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                          notation: 'compact'
                        }).format(value)
                        
                        return {
                          text: `${label} - ${formatted}`,
                          fillStyle: data.datasets[0].backgroundColor[i],
                          strokeStyle: data.datasets[0].backgroundColor[i],
                          lineWidth: 0,
                          hidden: false,
                          index: i
                        }
                      })
                    }
                    return []
                  }
                }
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    const value = new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0
                    }).format(context.parsed)
                    return `${context.label}: ${value}`
                  }
                }
              }
            }
          }
        })
      } catch (error) {
        console.error('Error creating partner chart:', error)
      }
    }

    watch(() => props.data, createChart, { deep: true })
    onMounted(createChart)

    return {
      chartCanvas
    }
  }
}
</script>

<style scoped>
.partner-chart {
  height: 300px;
  position: relative;
}
</style>