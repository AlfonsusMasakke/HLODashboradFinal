<template>
  <div class="partner-management">
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <router-link to="/" class="back-btn">
          <i class="fas fa-arrow-left"></i>
          Kembali ke Dashboard
        </router-link>
        <h1>Manajemen Mitra</h1>
        <p>Kelola daftar mitra dan partner bisnis</p>
      </div>
    </div>

    <!-- Content -->
    <div class="content-container">
      <!-- Search & Add -->
      <div class="toolbar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input 
            v-model="searchQuery"
            @input="handleSearch"
            type="text"
            placeholder="Cari mitra..."
            class="search-input"
          >
        </div>
        <button @click="showAddModal = true" class="add-btn">
          <i class="fas fa-plus"></i>
          Tambah Mitra
        </button>
      </div>

      <!-- Partners List -->
      <div class="partners-section">
        <div v-if="partnerStore.loading" class="loading-state">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Memuat data mitra...</span>
        </div>

        <div v-else-if="partnerStore.partners.length === 0" class="empty-state">
          <i class="fas fa-users"></i>
          <h3>Belum ada mitra</h3>
          <p>Tambahkan mitra pertama untuk mulai mengelola data</p>
          <button @click="showAddModal = true" class="btn btn-primary">
            <i class="fas fa-plus"></i>
            Tambah Mitra
          </button>
        </div>

        <div v-else class="partners-grid">
          <div 
            v-for="partner in partnerStore.partners" 
            :key="partner.id"
            class="partner-card"
          >
            <div class="partner-header">
              <h3>{{ partner.name }}</h3>
              <div class="partner-actions">
                <button @click="editPartner(partner)" class="action-btn edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button @click="deletePartner(partner)" class="action-btn delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <div class="partner-stats">
              <div class="stat-item">
                <span class="stat-label">Total Transaksi</span>
                <span class="stat-value">{{ partner.total_transactions }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Total Pendapatan</span>
                <span class="stat-value">{{ formatCurrency(partner.total_amount) }}</span>
              </div>
            </div>
            
            <div class="partner-info">
              <span class="created-date">
                Dibuat: {{ formatDate(partner.created_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ showEditModal ? 'Edit Mitra' : 'Tambah Mitra Baru' }}</h3>
          <button @click="closeModals" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form @submit.prevent="submitPartner" class="modal-form">
          <div class="form-group">
            <label>Nama Mitra/Partner</label>
            <input 
              v-model="partnerForm.name"
              type="text"
              required
              class="form-input"
              placeholder="Masukkan nama mitra..."
              :class="{ 'has-error': formError }"
            >
            <div v-if="formError" class="error-message">
              {{ formError }}
            </div>
          </div>
          
          <div class="modal-actions">
            <button type="button" @click="closeModals" class="btn btn-secondary">
              Batal
            </button>
            <button type="submit" :disabled="submitting" class="btn btn-primary">
              {{ submitting ? 'Menyimpan...' : (showEditModal ? 'Update' : 'Simpan') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeModals">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Konfirmasi Hapus</h3>
          <button @click="closeModals" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <div class="warning-icon">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
          <p>Apakah Anda yakin ingin menghapus mitra?</p>
          <div class="delete-preview">
            <strong>"{{ partnerToDelete?.name }}"</strong>
          </div>
          <p class="warning-text">
            Aksi ini tidak dapat dibatalkan. Pastikan mitra ini tidak memiliki transaksi aktif.
          </p>
        </div>
        
        <div class="modal-actions">
          <button @click="closeModals" class="btn btn-secondary">
            Batal
          </button>
          <button @click="confirmDelete" :disabled="deleting" class="btn btn-danger">
            {{ deleting ? 'Menghapus...' : 'Ya, Hapus' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { usePartnerStore } from '../stores/partners'

export default {
  name: 'PartnerManagement',
  setup() {
    const partnerStore = usePartnerStore()
    
    const searchQuery = ref('')
    const showAddModal = ref(false)
    const showEditModal = ref(false)
    const showDeleteModal = ref(false)
    const submitting = ref(false)
    const deleting = ref(false)
    const formError = ref('')
    
    const partnerForm = ref({
      name: ''
    })
    
    const editingPartner = ref(null)
    const partnerToDelete = ref(null)
    
    let searchTimeout = null
    
    // Methods
    const handleSearch = () => {
      clearTimeout(searchTimeout)
      searchTimeout = setTimeout(() => {
        partnerStore.fetchPartners(searchQuery.value)
      }, 300)
    }
    
    const editPartner = (partner) => {
      editingPartner.value = partner
      partnerForm.value.name = partner.name
      showEditModal.value = true
      formError.value = ''
    }
    
    const deletePartner = (partner) => {
      partnerToDelete.value = partner
      showDeleteModal.value = true
    }
    
    const closeModals = () => {
      showAddModal.value = false
      showEditModal.value = false
      showDeleteModal.value = false
      editingPartner.value = null
      partnerToDelete.value = null
      partnerForm.value.name = ''
      formError.value = ''
    }
    
    const submitPartner = async () => {
      if (!partnerForm.value.name.trim()) {
        formError.value = 'Nama mitra wajib diisi'
        return
      }
      
      submitting.value = true
      formError.value = ''
      
      try {
        let result
        
        if (showEditModal.value) {
          // Update existing partner
          result = await partnerStore.updatePartner(editingPartner.value.id, partnerForm.value.name.trim())
        } else {
          // Create new partner
          result = await partnerStore.createPartner(partnerForm.value.name.trim())
        }
        
        if (result.success) {
          closeModals()
          await partnerStore.fetchPartners(searchQuery.value)
        } else {
          formError.value = result.message
        }
      } finally {
        submitting.value = false
      }
    }
    
    const confirmDelete = async () => {
      if (!partnerToDelete.value) return
      
      deleting.value = true
      
      try {
        const result = await partnerStore.deletePartner(partnerToDelete.value.id)
        
        if (result.success) {
          closeModals()
          await partnerStore.fetchPartners(searchQuery.value)
        } else {
          formError.value = result.message
        }
      } finally {
        deleting.value = false
      }
    }
    
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        notation: amount > 1000000000 ? 'compact' : 'standard'
      }).format(amount || 0)
    }
    
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }
    
    onMounted(() => {
      partnerStore.fetchPartners()
    })
    
    return {
      partnerStore,
      searchQuery,
      showAddModal,
      showEditModal,
      showDeleteModal,
      submitting,
      deleting,
      formError,
      partnerForm,
      editingPartner,
      partnerToDelete,
      handleSearch,
      editPartner,
      deletePartner,
      closeModals,
      submitPartner,
      confirmDelete,
      formatCurrency,
      formatDate
    }
  }
}
</script>

<style scoped>
.partner-management {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
}

.page-header {
  background: linear-gradient(135deg, #6b46c1 0%, #3b82f6 50%, #8b5cf6 100%);
  color: white;
  padding: 40px 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: rgba(255,255,255,0.9);
  text-decoration: none;
  font-weight: 500;
  margin-bottom: 20px;
  transition: color 0.3s ease;
}

.back-btn:hover {
  color: white;
}

.page-header h1 {
  font-size: 36px;
  font-weight: 900;
  margin: 0 0 10px 0;
  color: #fbbf24;
}

.page-header p {
  font-size: 18px;
  margin: 0;
  opacity: 0.9;
}

.content-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 30px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-box i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
  font-size: 14px;
}

.search-input {
  width: 100%;
  padding: 14px 16px 14px 45px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: white;
}

.search-input:focus {
  outline: none;
  border-color: #6b46c1;
  box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.1);
}

.add-btn {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  border: none;
  padding: 14px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

.partners-section {
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.08);
  border: 1px solid rgba(0,0,0,0.05);
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #6b7280;
  text-align: center;
}

.loading-state i {
  font-size: 48px;
  margin-bottom: 20px;
}

.empty-state i {
  font-size: 64px;
  margin-bottom: 20px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: #374151;
}

.empty-state p {
  font-size: 16px;
  margin: 0 0 30px 0;
  max-width: 400px;
  line-height: 1.5;
}

.partners-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.partner-card {
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 15px;
  padding: 20px;
  transition: all 0.3s ease;
}

.partner-card:hover {
  transform: translateY(-3px);
  border-color: #6b46c1;
  box-shadow: 0 8px 24px rgba(107, 70, 193, 0.1);
}

.partner-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.partner-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
  flex: 1;
  margin-right: 10px;
}

.partner-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.action-btn.edit {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.action-btn.edit:hover {
  background: rgba(59, 130, 246, 0.2);
  transform: scale(1.1);
}

.action-btn.delete {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.action-btn.delete:hover {
  background: rgba(239, 68, 68, 0.2);
  transform: scale(1.1);
}

.partner-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.partner-info {
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
}

.created-date {
  font-size: 12px;
  color: #9ca3af;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.modal-content {
  background: white;
  border-radius: 20px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px 25px 0 25px;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 700;
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

.modal-form, .modal-body {
  padding: 25px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: white;
}

.form-input:focus {
  outline: none;
  border-color: #6b46c1;
  box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.1);
}

.form-input.has-error {
  border-color: #ef4444;
}

.error-message {
  color: #ef4444;
  font-size: 12px;
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.warning-icon {
  text-align: center;
  margin-bottom: 20px;
}

.warning-icon i {
  font-size: 48px;
  color: #f59e0b;
}

.modal-body p {
  margin: 0 0 15px 0;
  color: #6b7280;
  line-height: 1.5;
  text-align: center;
}

.delete-preview {
  background: #fef3c7;
  border: 2px solid #f59e0b;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  margin: 15px 0;
  color: #92400e;
}

.warning-text {
  font-size: 14px;
  color: #ef4444 !important;
  font-weight: 500;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: flex-end;
  padding: 0 25px 25px 25px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: linear-gradient(135deg, #6b46c1 0%, #8b5cf6 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(107, 70, 193, 0.3);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.btn-secondary {
  background: #f8fafc;
  color: #475569;
  border: 2px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.btn-danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(239, 68, 68, 0.3);
}

.btn-danger:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    padding: 30px 20px;
  }
  
  .content-container {
    padding: 30px 20px;
  }
  
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-box {
    max-width: none;
  }
  
  .partners-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-actions {
    flex-direction: column;
  }
}
</style>