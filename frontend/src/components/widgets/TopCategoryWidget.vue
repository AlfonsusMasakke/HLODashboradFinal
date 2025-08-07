<template>
  <div class="widget top-category-widget">
    <div class="widget-header">
      <div class="widget-icon">
        <i class="fas fa-globe"></i>
      </div>
      <h3>Kategori Tertinggi</h3>
    </div>
    
    <div v-if="loading" class="widget-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Memuat data...</span>
    </div>
    
    <div v-else class="category-content">
      <div class="category-comparison">
        <div class="category-item" :class="{ active: aeronautika >= nonAeronautika }">
          <div class="category-icon">
            <i class="fas fa-plane"></i>
          </div>
          <div class="category-info">
            <span class="category-name">Aeronautika</span>
            <span class="category-amount">{{ formatCurrency(aeronautika) }}</span>
          </div>
        </div>
        
        <div class="vs-divider">VS</div>
        
        <div class="category-item" :class="{ active: nonAeronautika > aeronautika }">
          <div class="category-icon">
            <i class="fas fa-building"></i>
          </div>
          <div class="category-info">
            <span class="category-name">Non-Aeronautika</span>
            <span class="category-amount">{{ formatCurrency(nonAeronautika) }}</span>
          </div>
        </div>
      </div>
      
      <div class="winner">
        <div class="winner-badge">
          <i class="fas fa-crown"></i>
          <span>{{ winnerCategory.name }}</span>
        </div>
        <div class="winner-percentage">
          {{ winnerCategory.percentage }}% dari total
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'TopCategoryWidget',
  props: {
    aeronautika: {
      type: Number,
      default: 0
    },
    nonAeronautika: {
      type: Number,
      default: 0
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  setup(props) {
    const winnerCategory = computed(() => {
      const total = props.aeronautika + props.nonAeronautika
      if (total === 0) return { name: 'Tidak ada data', percentage: 0 }
      
      if (props.aeronautika >= props.nonAeronautika) {
        return {
          name: 'Aeronautika',
          percentage: ((props.aeronautika / total) * 100).toFixed(1)
        }
      } else {
        return {
          name: 'Non-Aeronautika',
          percentage: ((props.nonAeronautika / total) * 100).toFixed(1)
        }
      }
    })
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(amount)
    }
    
    return {
      winnerCategory,
      formatCurrency
    }
  }
}
</script>

<style scoped>
.top-category-widget {
  background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
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

.widget-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.category-comparison {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 15px;
}

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.category-item.active {
  background: rgba(255, 255, 255, 0.2);
  opacity: 1;
  transform: scale(1.02);
}

.category-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.category-info {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.category-name {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.category-amount {
  font-size: 10px;
  opacity: 0.9;
}

.vs-divider {
  text-align: center;
  font-size: 10px;
  font-weight: 700;
  opacity: 0.7;
  margin: 5px 0;
}

.winner {
  text-align: center;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.winner-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 5px;
}

.winner-percentage {
  font-size: 10px;
  opacity: 0.9;
}
</style>