import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const usePartnerStore = defineStore('partners', {
  state: () => ({
    partners: [],
    loading: false,
    error: null
  }),

  getters: {
    activePartners: (state) => state.partners.filter(p => p.status === 'active'),
    partnerOptions: (state) => state.partners.map(p => ({
      id: p.id,
      name: p.name,
      label: p.name,
      value: p.id
    }))
  },

  actions: {
    async fetchPartners(search = '') {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.get(`${API_URL}/partners`, {
          params: { search, status: 'active' }
        })
        this.partners = response.data
      } catch (error) {
        this.error = error.response?.data?.message || 'Gagal mengambil data partner'
        console.error('Fetch partners error:', error)
      } finally {
        this.loading = false
      }
    },

        async updatePartnerStats(partnerId) {
      try {
        const response = await axios.get(`${API_URL}/partners/${partnerId}/stats`)
        const updatedStats = response.data
        
        // Update partner di state dengan stats baru
        const index = this.partners.findIndex(p => p.id === partnerId)
        if (index !== -1) {
          this.partners[index] = {
            ...this.partners[index],
            total_transactions: updatedStats.total_transactions,
            total_amount: updatedStats.total_amount
          }
        }
        
        return { success: true, stats: updatedStats }
      } catch (error) {
        console.error('Update partner stats error:', error)
        return { success: false, error: error.message }
      }
    },

    // Alias untuk backward compatibility
    async refreshPartners() {
      return this.fetchPartners()
    },

    async checkPartnerExists(name) {
      try {
        const response = await axios.get(`${API_URL}/partners/check`, {
          params: { name }
        })
        return response.data
      } catch (error) {
        console.error('Check partner error:', error)
        return { exists: false, partner: null }
      }
    },

    async createPartner(name) {
      try {
        const response = await axios.post(`${API_URL}/partners`, { name })
        this.partners.unshift(response.data)
        return { success: true, partner: response.data }
      } catch (error) {
        const message = error.response?.data?.message || 'Gagal membuat partner baru'
        return { success: false, message, existingPartner: error.response?.data?.existingPartner }
      }
    },

    async updatePartner(id, name) {
      try {
        const response = await axios.put(`${API_URL}/partners/${id}`, { name })
        const index = this.partners.findIndex(p => p.id === id)
        if (index !== -1) {
          this.partners[index] = response.data
        }
                return { success: true, partner: response.data }
      } catch (error) {
        const message = error.response?.data?.message || 'Gagal mengupdate partner'
        return { success: false, message }
      }
    },

    async deletePartner(id) {
      try {
        await axios.delete(`${API_URL}/partners/${id}`)
        this.partners = this.partners.filter(p => p.id !== id)
        return { success: true }
      } catch (error) {
        const message = error.response?.data?.message || 'Gagal menghapus partner'
        return { success: false, message }
      }
    },

    async getPartnerStats(id) {
      try {
        const response = await axios.get(`${API_URL}/partners/${id}/stats`)
        return response.data
      } catch (error) {
        console.error('Get partner stats error:', error)
        throw error
      }
    },

    clearError() {
      this.error = null
    }
  }
})