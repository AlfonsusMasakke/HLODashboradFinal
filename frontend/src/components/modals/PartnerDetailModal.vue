<template>
  <div class="modal-overlay" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <div class="partner-info">
          <h3>{{ partner.name }}</h3>
          <div class="partner-summary">
            <span class="total-amount">{{ formatCurrency(partner.amount) }}</span>
            <span class="total-transactions">{{ partner.transactions }} transaksi</span>
            <span class="contribution">{{ partner.percentage }}% kontribusi</span>
          </div>
        </div>
        <button @click="closeModal" class="close-btn">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="transactions-header">
          <h4>Detail Transaksi</h4>
          <span class="transactions-count">{{ transactions.length }} transaksi</span>
        </div>
        
        <div class="transactions-list">
          <div 
            v-for="transaction in transactions" 
            :key="transaction.id"
            class="transaction-item"
          >
            <div class="transaction-date">
              {{ formatDate(transaction.date) }}
            </div>
            <div class="transaction-details">
              <div class="transaction-service">
                <span class="service-name">{{ getServiceLabel(transaction.service_type) }}</span>
                <span class="service-category" :class="transaction.category">
                  {{ transaction.category === 'aeronautika' ? 'Aeronautika' : 'Non-Aeronautika' }}
                </span>
              </div>
              <div class="transaction-amount">
                {{ formatCurrency(transaction.amount) }}
              </div>
            </div>
            <div class="transaction-status">
              <span class="status-badge" :class="transaction.payment_status">
                {{ getStatusLabel(transaction.payment_status) }}
              </span>
              <span v-if="transaction.invoice_number" class="invoice-number">
                {{ transaction.invoice_number }}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button @click="exportTransactions" class="export-btn">
          <i class="fas fa-download"></i>
          Export Data
        </button>
        <button @click="closeModal" class="close-modal-btn">
          Tutup
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PartnerDetailModal',
  props: {
    partner: {
      type: Object,
      required: true
    },
    transactions: {
      type: Array,
      default: () => []
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    }
    
    const formatDate = (date) => {
      return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    
    const getServiceLabel = (serviceType) => {
      const serviceLabels = {
        'pjp2u': 'PJP2U',
        'pjp4u': 'PJP4U',
        'garbarata': 'Jasa pemakaian garbarata',
        'checkin_counter': 'Check-in counter',
        'jpkp2u': 'JPKP2U',
        'sewa_ruang': 'Sewa ruang/tempat',
        'sewa_lahan': 'Sewa lahan',
        'listrik': 'Pemakaian listrik',
        'konsesi_tenant': 'Konsesi tenant',
        'konsesi_parkir_reguler': 'Konsesi parkir reguler',
        'konsesi_parkir_inap': 'Konsesi parkir inap',
        'fuel_throughput': 'Fuel throughput',
        'konsesi_iklan': 'Konsesi iklan',
        'pas_bandara': 'Pembuatan pas bandara',
        'ground_handling': 'Ground handling'
      }
      return serviceLabels[serviceType] || serviceType
    }
    
    const getStatusLabel = (status) => {
      const statusMap = {
        'paid': 'Lunas',
        'pending': 'Menunggu',
        'overdue': 'Terlambat'
      }
      return statusMap[status] || status
    }
    
    const closeModal = () => {
      emit('close')
    }
    
    const exportTransactions = () => {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Tanggal,Layanan,Kategori,Jumlah,Status,Invoice\n"
        + props.transactions.map(t => 
            `${formatDate(t.date)},${getServiceLabel(t.service_type)},${t.category},${t.amount},${getStatusLabel(t.payment_status)},${t.invoice_number || ''}`
          ).join("\n")
      
      const encodedUri = encodeURI(csvContent)
      const link = document.createElement("a")
      link.setAttribute("href", encodedUri)
      link.setAttribute("download", `transaksi-${props.partner.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.csv`)
      link.click()
    }
    
    return {
      formatCurrency,
      formatDate,
      getServiceLabel,
      getStatusLabel,
      closeModal,
      exportTransactions
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 25px 25px 0 25px;
  border-bottom: 1px solid #e5e7eb;
  margin-bottom: 20px;
}

.partner-info h3 {
  margin: 0 0 10px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
}

.partner-summary {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
}

.total-amount {
  font-size: 16px;
  font-weight: 700;
  color: #059669;
}

.total-transactions {
  font-size: 14px;
  color: #6b7280;
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 6px;
}

.contribution {
  font-size: 14px;
  color: #7c3aed;
  background: #f3e8ff;
  padding: 4px 8px;
  border-radius: 6px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #9ca3af;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 25px;
}

.transactions-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.transactions-header h4 {
  margin: 0;
  color: #1f2937;
  font-size: 16px;
  font-weight: 600;
}

.transactions-count {
  font-size: 12px;
  color: #6b7280;
  background: #f9fafb;
  padding: 4px 8px;
  border-radius: 4px;
}

.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 300px;
  overflow-y: auto;
}

.transaction-item {
  padding: 15px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.transaction-item:hover {
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.transaction-date {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}

.transaction-details {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.transaction-service {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.service-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 14px;
}

.service-category {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 4px;
  width: fit-content;
}

.service-category.aeronautika {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.service-category.non-aeronautika {
  background: rgba(139, 92, 246, 0.1);
  color: #8b5cf6;
}

.transaction-amount {
  font-weight: 700;
  color: #059669;
  font-size: 14px;
}

.transaction-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 6px;
  font-weight: 600;
}

.status-badge.paid {
  background: #dcfce7;
  color: #166534;
}

.status-badge.pending {
  background: #fef3c7;
  color: #92400e;
}

.status-badge.overdue {
  background: #fecaca;
  color: #991b1b;
}

.invoice-number {
  font-size: 10px;
  color: #6b7280;
  font-family: monospace;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 25px 25px 25px;
  border-top: 1px solid #e5e7eb;
}

.export-btn {
  padding: 10px 20px;
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.export-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.close-modal-btn {
  padding: 10px 20px;
  background: #f8fafc;
  color: #475569;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.close-modal-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

/* Custom Scrollbar */
/* Custom Scrollbar */
.transactions-list::-webkit-scrollbar,
.modal-body::-webkit-scrollbar {
  width: 6px;
}

.transactions-list::-webkit-scrollbar-track,
.modal-body::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.transactions-list::-webkit-scrollbar-thumb,
.modal-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.transactions-list::-webkit-scrollbar-thumb:hover,
.modal-body::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Responsive Design */
@media (max-width: 768px) {
  .modal-content {
    width: 95%;
    max-height: 90vh;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 20px;
    padding-right: 20px;
  }
  
  .partner-summary {
    flex-direction: column;
    gap: 8px;
  }
  
  .transaction-details {
    flex-direction: column;
    gap: 8px;
  }
  
  .modal-footer {
    flex-direction: column;
  }
  
  .export-btn,
  .close-modal-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>