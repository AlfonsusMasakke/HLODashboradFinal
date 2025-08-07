<template>
  <div class="chart-wrapper">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'

export default {
  name: 'MainChart',
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
        // Dynamic import Chart.js
        const { Chart, registerables } = await import('chart.js')
        Chart.register(...registerables)

        if (chartInstance) {
          chartInstance.destroy()
        }

        const ctx = chartCanvas.value.getContext('2d')
        
        chartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: props.data.map(item => item.month),
            datasets: [
              {
                label: 'Aeronautika (Juta Rupiah)',
                data: props.data.map(item => (item.aeronautika || 0) / 1000000),
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
              },
              {
                label: 'Non-Aeronautika (Juta Rupiah)',
                data: props.data.map(item => (item.nonAeronautika || 0) / 1000000),
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: 'rgba(139, 92, 246, 1)',
                borderWidth: 1
              },
              {
                label: 'Total Pendapatan (Juta Rupiah)',
                data: props.data.map(item => (item.total || 0) / 1000000),
                type: 'line',
                borderColor: 'rgba(251, 191, 36, 1)',
                backgroundColor: 'rgba(251, 191, 36, 0.1)',
                borderWidth: 3,
                fill: false,
                tension: 0.4
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              intersect: false,
              mode: 'index'
            },
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
                stacked: true
              },
              y: {
                stacked: true,
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

        console.log('✅ Chart created successfully')
      } catch (error) {
        console.error('❌ Error creating chart:', error)
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
.chart-wrapper {
  width: 100%;
  height: 400px;
  position: relative;
}
</style>