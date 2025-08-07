<template>
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
          <li v-for="service in aeronautikaServices" :key="service">
            {{ service }}
          </li>
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
          <li v-for="service in nonAeronautikaServices" :key="service">
            {{ service }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RevenueTypesWidget',
  setup() {
    const aeronautikaServices = [
      'PJP2U',
      'PJP4U',
      'Jasa pemakaian garbarata (aviobridge)',
      'Pemakaian check-in counter',
      'JPKP2U'
    ]
    
    const nonAeronautikaServices = [
      'Sewa ruang/tempat',
      'Sewa lahan',
      'Pemakaian listrik (110%)',
      'Konsesi 5% dari tenant atas penjualan produk/jasa',
      'Konsesi 10% dari parkir reguler (roda 2 dan 4)',
      'Konsesi 15% dari parkir inap (roda 4)',
      'Fuel throughput',
      'Konsesi iklan',
      'Pembuatan pas bandara',
      'Ground handling 15%'
    ]
    
    return {
      aeronautikaServices,
      nonAeronautikaServices
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
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 700;
}

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
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
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
</style>