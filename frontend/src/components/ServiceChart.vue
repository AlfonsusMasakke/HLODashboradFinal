<template>
  <div class="service-chart">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'

export default {
  name: 'ServiceChart',
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
        
        // Group by category
        const aeronautika = props.data.filter(item => item.category === 'aeronautika')
        const nonAeronautika = props.data.filter(item => item.category === 'non-aeronautika')
        
        chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: props.data.map(item => item.serviceType),
            datasets: [
              {
                label: 'Aeronautika',
                data: props.data.map(item => item.category === 'aeronautika' ? item.amount / 1000000 : 0),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
              },
              {
                label: 'Non-Aeronautika',
                data: props.data.map(item => item.category === 'non-aeronautika' ? item.amount / 1000000 : 0),
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top'
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return context.dataset.label + ': Rp ' + context.parsed.y.toFixed(2) + 'M'
                  }
                }
              }
            },
            scales: {
              x: {
                ticks: {
                  maxRotation: 45,
                  minRotation: 45
                }
              },
              y: {
                beginAtZero: true,
                ticks: {
                  callback: function(value) {
                    return 'Rp ' + value + 'M'
                  }
                }
              }
            }
          }
        })
      } catch (error) {
        console.error('Error creating service chart:', error)
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
.service-chart {
  height: 300px;
  position: relative;
}
</style>