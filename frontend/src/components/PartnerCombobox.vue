<template>
  <div class="partner-combobox">
    <label class="partner-label">Nama Mitra/Partner</label>
    
    <div class="combobox-container" ref="comboboxRef">
      <div class="input-wrapper">
        <input
          ref="inputRef"
          v-model="searchQuery"
          @input="handleInput"
          @focus="showDropdown = true"
          @keydown="handleKeydown"
          type="text"
          class="partner-input"
          :class="{ 'has-error': hasError }"
          placeholder="Ketik nama mitra..."
          autocomplete="off"
        >
        <button 
          type="button"
          @click="toggleDropdown"
          class="dropdown-toggle"
          :class="{ 'active': showDropdown }"
        >
          <i class="fas fa-chevron-down"></i>
        </button>
      </div>

      <!-- Dropdown -->
      <div v-if="showDropdown" class="dropdown-menu">
        <!-- Loading -->
        <div v-if="partnerStore.loading" class="dropdown-item loading">
          <i class="fas fa-spinner fa-spin"></i>
          <span>Mencari partner...</span>
        </div>

        <!-- No results -->
        <div v-else-if="filteredPartners.length === 0 && searchQuery" class="dropdown-item no-results">
          <div class="no-results-content">
            <i class="fas fa-search"></i>
            <span>Tidak ditemukan: "{{ searchQuery }}"</span>
            <button 
              type="button"
              @click="showNewPartnerOption"
              class="add-new-btn"
            >
              <i class="fas fa-plus"></i>
              Simpan Mitra Baru
            </button>
          </div>
        </div>

        <!-- Partner suggestions -->
        <div v-else>
          <div
            v-for="(partner, index) in filteredPartners"
            :key="partner.id"
            @click="selectPartner(partner)"
            class="dropdown-item partner-item"
            :class="{ 'highlighted': index === highlightedIndex }"
          >
            <div class="partner-info">
              <span class="partner-name">{{ partner.name }}</span>
              <span class="partner-stats">
                {{ partner.total_transactions }} transaksi
              </span>
            </div>
            <i class="fas fa-check" v-if="selectedPartner?.id === partner.id"></i>
          </div>

          <!-- Add new option if typing -->
          <div 
            v-if="searchQuery && !isExactMatch"
            @click="showNewPartnerOption"
            class="dropdown-item add-new-item"
            :class="{ 'highlighted': highlightedIndex === filteredPartners.length }"
          >
            <i class="fas fa-plus"></i>
            <span>Simpan "{{ searchQuery }}" sebagai mitra baru</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="errorMessage" class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      {{ errorMessage }}
    </div>

    <!-- Selected partner info -->
    <div v-if="selectedPartner && !showDropdown" class="selected-partner">
      <i class="fas fa-check-circle"></i>
      <span>{{ selectedPartner.name }}</span>
      <button type="button" @click="clearSelection" class="clear-btn">
        <i class="fas fa-times"></i>
      </button>
    </div>

    <!-- New Partner Confirmation Modal -->
    <div v-if="showNewPartnerModal" class="modal-overlay" @click="closeNewPartnerModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Konfirmasi Mitra Baru</h3>
          <button @click="closeNewPartnerModal" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <p>Apakah Anda yakin ingin menambahkan mitra baru?</p>
          <div class="new-partner-preview">
            <strong>"{{ newPartnerName }}"</strong>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="closeNewPartnerModal" class="btn btn-secondary">
            Batal
          </button>
          <button @click="createNewPartner" :disabled="creatingPartner" class="btn btn-primary">
            {{ creatingPartner ? 'Menyimpan...' : 'Ya, Simpan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { usePartnerStore } from '../stores/partners'

export default {
  name: 'PartnerCombobox',
  props: {
    modelValue: {
      type: [Number, String],
      default: null
    },
    required: {
      type: Boolean,
      default: false
    }
  },
  emits: ['update:modelValue', 'partner-selected', 'partner-created'],
  setup(props, { emit }) {
    const partnerStore = usePartnerStore()
    
    const searchQuery = ref('')
    const showDropdown = ref(false)
    const highlightedIndex = ref(-1)
    const selectedPartner = ref(null)
    const errorMessage = ref('')
    const showNewPartnerModal = ref(false)
    const newPartnerName = ref('')
    const creatingPartner = ref(false)
    
    const inputRef = ref(null)
    const comboboxRef = ref(null)
    
    let debounceTimeout = null

    // Computed
    const filteredPartners = computed(() => {
      if (!searchQuery.value) return partnerStore.partners
      
      const query = searchQuery.value.toLowerCase()
      return partnerStore.partners.filter(partner =>
        partner.name.toLowerCase().includes(query)
      )
    })

    const isExactMatch = computed(() => {
      if (!searchQuery.value) return false
      return filteredPartners.value.some(partner => 
        partner.name.toLowerCase() === searchQuery.value.toLowerCase()
      )
    })

    const hasError = computed(() => !!errorMessage.value)

    // Methods
    const handleInput = () => {
      clearTimeout(debounceTimeout)
      errorMessage.value = ''
      
      debounceTimeout = setTimeout(async () => {
        if (searchQuery.value.length >= 2) {
          await partnerStore.fetchPartners(searchQuery.value)
          
          // Check if partner already exists
          if (searchQuery.value.length >= 3) {
            const result = await partnerStore.checkPartnerExists(searchQuery.value)
            if (result.exists) {
              errorMessage.value = 'Mitra ini sudah terdaftar'
            }
          }
        }
      }, 300)
    }

    const handleKeydown = (event) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          highlightedIndex.value = Math.min(
            highlightedIndex.value + 1,
            filteredPartners.value.length + (searchQuery.value && !isExactMatch.value ? 0 : -1)
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          highlightedIndex.value = Math.max(highlightedIndex.value - 1, -1)
          break
        case 'Enter':
          event.preventDefault()
          if (highlightedIndex.value >= 0) {
            if (highlightedIndex.value < filteredPartners.value.length) {
              selectPartner(filteredPartners.value[highlightedIndex.value])
            } else {
              showNewPartnerOption()
            }
          }
          break
        case 'Escape':
          showDropdown.value = false
          highlightedIndex.value = -1
          break
      }
    }

    const toggleDropdown = () => {
      showDropdown.value = !showDropdown.value
      if (showDropdown.value) {
        inputRef.value?.focus()
        if (partnerStore.partners.length === 0) {
          partnerStore.fetchPartners()
        }
      }
    }

    const selectPartner = (partner) => {
      selectedPartner.value = partner
      searchQuery.value = partner.name
      showDropdown.value = false
      highlightedIndex.value = -1
      errorMessage.value = ''
      
      emit('update:modelValue', partner.id)
      emit('partner-selected', partner)
    }

    const clearSelection = () => {
      selectedPartner.value = null
      searchQuery.value = ''
      errorMessage.value = ''
      
      emit('update:modelValue', null)
      inputRef.value?.focus()
    }

    const showNewPartnerOption = () => {
      if (!searchQuery.value.trim()) return
      
      newPartnerName.value = searchQuery.value.trim()
      showNewPartnerModal.value = true
    }

    const closeNewPartnerModal = () => {
      showNewPartnerModal.value = false
      newPartnerName.value = ''
    }

    const createNewPartner = async () => {
      creatingPartner.value = true
      
      try {
        const result = await partnerStore.createPartner(newPartnerName.value)
        
        if (result.success) {
          selectPartner(result.partner)
          closeNewPartnerModal()
          emit('partner-created', result.partner)
        } else {
          if (result.existingPartner) {
            // Partner already exists, select it
            selectPartner(result.existingPartner)
            closeNewPartnerModal()
          } else {
            errorMessage.value = result.message
          }
        }
      } finally {
        creatingPartner.value = false
      }
    }

    const handleClickOutside = (event) => {
      if (comboboxRef.value && !comboboxRef.value.contains(event.target)) {
        showDropdown.value = false
        highlightedIndex.value = -1
      }
    }

    // Watchers
    watch(() => showDropdown.value, (isOpen) => {
      if (isOpen) {
        highlightedIndex.value = -1
      }
    })

    watch(() => props.modelValue, async (newValue) => {
      if (newValue && !selectedPartner.value) {
        // Find partner by ID
        const partner = partnerStore.partners.find(p => p.id === newValue)
        if (partner) {
          selectedPartner.value = partner
          searchQuery.value = partner.name
        }
      } else if (!newValue) {
        clearSelection()
      }
    })

    // Lifecycle
    onMounted(() => {
      document.addEventListener('click', handleClickOutside)
      partnerStore.fetchPartners()
    })

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside)
      clearTimeout(debounceTimeout)
    })

    return {
      partnerStore,
      searchQuery,
      showDropdown,
      highlightedIndex,
      selectedPartner,
      errorMessage,
      showNewPartnerModal,
      newPartnerName,
      creatingPartner,
      inputRef,
      comboboxRef,
      filteredPartners,
      isExactMatch,
      hasError,
      handleInput,
      handleKeydown,
      toggleDropdown,
      selectPartner,
      clearSelection,
      showNewPartnerOption,
      closeNewPartnerModal,
      createNewPartner
    }
  }
}
</script>

<style scoped>
.partner-combobox {
  position: relative;
  width: 100%;
}

.partner-label {
  display: block;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.combobox-container {
  position: relative;
}

.input-wrapper {
  position: relative;
  display: flex;
}

.partner-input {
  flex: 1;
  padding: 14px 50px 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  background: white;
}

.partner-input:focus {
  outline: none;
  border-color: #6b46c1;
  box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.1);
}

.partner-input.has-error {
  border-color: #ef4444;
}

.dropdown-toggle {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.dropdown-toggle:hover {
  background: #f3f4f6;
  color: #374151;
}

.dropdown-toggle.active {
  transform: translateY(-50%) rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 4px;
}

.dropdown-item {
  padding: 12px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f3f4f6;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover,
.dropdown-item.highlighted {
  background: #f8fafc;
}

.dropdown-item.loading {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  cursor: default;
}

.dropdown-item.no-results {
  cursor: default;
}

.no-results-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #6b7280;
  text-align: center;
}

.add-new-btn {
  background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-new-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.partner-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.partner-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.partner-name {
  font-weight: 600;
  color: #1f2937;
}

.partner-stats {
  font-size: 12px;
  color: #6b7280;
}

.add-new-item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #10b981;
  font-weight: 600;
  border-top: 1px solid #e5e7eb;
}

.add-new-item:hover {
  background: rgba(16, 185, 129, 0.05);
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  color: #ef4444;
  font-size: 12px;
  font-weight: 500;
}

.selected-partner {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.1);
  border-radius: 8px;
  color: #059669;
  font-size: 14px;
  font-weight: 600;
}

.clear-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.clear-btn:hover {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
}

/* Modal styles */
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
  max-width: 400px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 20px 0 20px;
}

.modal-header h3 {
  margin: 0;
  color: #1f2937;
  font-size: 18px;
  font-weight: 700;
}

.close-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.3s ease;
  }

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.modal-body {
  padding: 20px;
}

.modal-body p {
  margin: 0 0 15px 0;
  color: #6b7280;
  line-height: 1.5;
}

.new-partner-preview {
  background: #f8fafc;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
  color: #1f2937;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  padding: 0 20px 20px 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #6b46c1 0%, #8b5cf6 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(107, 70, 193, 0.3);
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

/* Scrollbar styling */
.dropdown-menu::-webkit-scrollbar {
  width: 6px;
}

.dropdown-menu::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.dropdown-menu::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>