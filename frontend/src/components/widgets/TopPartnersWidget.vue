<template>
  <div class="widget top-partners-widget">
    <div class="widget-header">
      <h3>10 Mitra Sumber Pendapatan Terbesar</h3>
      <p>Di urutkan dari yang tertinggi hingga yang terendah</p>
      
      <!-- Search Filter -->
      <div class="search-box">
        <i class="fas fa-search"></i>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari mitra..."
          class="search-input"
        >
      </div>
    </div>
    
    <div v-if="loading" class="widget-loading">
      <i class="fas fa-spinner fa-spin"></i>
      <span>Memuat data mitra...</span>
    </div>
    
    <div v-else-if="filteredPartners.length > 0" class="partners-list">
      <div 
        v-for="(partner, index) in filteredPartners" 
        :key="partner.name"
        class="partner-item"
        :class="{ 'top-three': index < 3 }"
        @click="handlePartnerClick(partner)"
        :style="{ animationDelay: `${index * 0.1}s` }"
      >
        <div class="partner-rank">
          <span v-if="index < 3" class="medal">
            <i :class="getMedalIcon(index)"></i>
          </span>
          <span v-else class="rank-number">{{ index + 1 }}</span>
        </div>
        
        <div class="partner-info">
          <div class="partner-name">{{ partner.name }}</div>
          <div class="partner-stats">
            <span class="partner-amount">{{ formatCurrency(partner.amount) }}</span>
            <span class="partner-percentage">{{ partner.percentage }}%</span>
          </div>
          <div class="partner-transactions">
            {{ partner.transactions }} transaksi
          </div>
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
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'TopPartnersWidget',
  props: {
    partners: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    }
  },
  emits: ['partner-clicked'],
  setup(props, { emit }) {
    const searchQuery = ref('')
    
    const filteredPartners = computed(() => {
      if (!searchQuery.value) return props.partners
      
      const query = searchQuery.value.toLowerCase()
      return props.partners.filter(partner => 
        partner.name.toLowerCase().includes(query)
      )
    })
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(amount)
    }
    
    const getMedalIcon = (index) => {
      const icons = ['fas fa-medal gold', 'fas fa-medal silver', 'fas fa-medal bronze']
      return icons[index]
    }
    
    const handlePartnerClick = (partner) => {
      emit('partner-clicked', partner)
    }
    
    return {
      searchQuery,
      filteredPartners,
      formatCurrency,
      getMedalIcon,
      handlePartnerClick
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
  font-size: 16px;
  font-weight: 700;
}

.widget-header p {
  margin: 0 0 15px 0;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
}

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

.widget-loading, .widget-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  font-size: 12px;
  padding: 30px 0;
}

.widget-loading i, .widget-empty i {
  font-size: 24px;
  color: #9ca3af;
}

.partners-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
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
  animation: slideInRight 0.5s ease-out forwards;
  opacity: 0;
  transform: translateX(20px);
}

@keyframes slideInRight {
  to {
    opacity: 1;
    transform: translateX(0);
  }
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
  min-width: 30px;
  height: 30px;
}

.medal {
  font-size: 16px;
}

.medal .gold { color: #f59e0b; }
.medal .silver { color: #6b7280; }
.medal .bronze { color: #d97706; }

.rank-number {
  background: #6b7280;
  color: white;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
}

.partner-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.partner-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 13px;
  line-height: 1.2;
}

.partner-stats {
  display: flex;
  align-items: center;
  gap: 8px;
}

.partner-amount {
  font-size: 11px;
  font-weight: 700;
  color: #059669;
}

.partner-percentage {
  font-size: 10px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.partner-transactions {
  font-size: 9px;
  color: #9ca3af;
}

.partner-arrow {
  color: #d1d5db;
  font-size: 10px;
  transition: all 0.3s ease;
}

.partner-item:hover .partner-arrow {
  color: #6b7280;
  transform: translateX(2px);
}

/* Custom Scrollbar for Partners List */
.partners-list::-webkit-scrollbar {
  width: 4px;
}

.partners-list::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 2px;
}

.partners-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.partners-list::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>