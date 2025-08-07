<template>
  <div class="widget year-filter-widget">
    <div class="widget-header">
      <h3>Tahun</h3>
      <p>Disini tempat user dapat mengganti garis tahun dan bulan</p>
    </div>
    
    <div class="filter-controls">
      <div class="form-group">
        <label>Tahun:</label>
        <select 
          :value="selectedYear" 
          @change="handleYearChange"
          class="year-select"
        >
          <option v-for="year in years" :key="year" :value="year">
            {{ year }}
          </option>
        </select>
      </div>
      
      <div class="form-group">
        <label>Bulan:</label>
        <select v-model="selectedMonth" @change="handleMonthChange" class="month-select">
          <option value="">Semua Bulan</option>
          <option v-for="(month, index) in months" :key="index" :value="index + 1">
            {{ month }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'YearFilterWidget',
  props: {
    selectedYear: {
      type: Number,
      required: true
    },
    years: {
      type: Array,
      required: true
    }
  },
  emits: ['year-changed', 'month-changed'],
  setup(props, { emit }) {
    const selectedMonth = ref('')
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    
    const handleYearChange = (event) => {
      emit('year-changed', parseInt(event.target.value))
    }
    
    const handleMonthChange = () => {
      emit('month-changed', selectedMonth.value)
    }
    
    return {
      selectedMonth,
      months,
      handleYearChange,
      handleMonthChange
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
  margin: 0 0 20px 0;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
}

.filter-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.year-select, .month-select {
  padding: 10px 12px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  background: white;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.year-select:focus, .month-select:focus {
  outline: none;
  border-color: #6b46c1;
}
</style>