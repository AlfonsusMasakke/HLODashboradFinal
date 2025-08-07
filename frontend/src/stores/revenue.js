import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create dedicated axios instance for API calls
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor - add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    
    // Debug logging
    console.log(`🔐 [${config.method.toUpperCase()}] ${config.url}`)
    console.log('🔑 Token exists:', !!token)
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    } else {
      console.warn('⚠️ No token found in localStorage')
    }
    
    return config
  },
  (error) => {
    console.error('❌ Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - handle auth errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ [${response.config.method.toUpperCase()}] ${response.config.url} - Status: ${response.status}`)
    return response
  },
  (error) => {
    const originalRequest = error.config
    
    console.error(`❌ [${originalRequest?.method?.toUpperCase()}] ${originalRequest?.url} - Error:`, error.response?.status, error.response?.data)
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.error('🚫 Unauthorized - Token may be invalid or expired')
      
      // Clear auth data
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      
      // Redirect to login (only if not already on login page)
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    
    return Promise.reject(error)
  }
)

export const useRevenueStore = defineStore('revenue', {
  state: () => ({
    // Data states
    revenueData: [],
    monthlyData: [],
    summary: {},
    monthlyDetailData: null,
    
    // Pagination
    pagination: {
      total: 0,
      page: 1,
      limit: 100,
      totalPages: 0
    },
    
    // Loading states
    loading: false,
    monthlyLoading: false,
    summaryLoading: false,
    monthlyDetailLoading: false,
    
    // Error handling
    error: null,
    errors: {
      revenue: null,
      monthly: null,
      summary: null,
      detail: null
    },
    
    // Metadata
    lastUpdated: null,
    currentYear: new Date().getFullYear()
  }),

  getters: {
    // Calculate total revenue from loaded data
    totalRevenue: (state) => {
      const total = state.revenueData.reduce((sum, item) => {
        return sum + parseFloat(item.amount || 0)
      }, 0)
      console.log('💰 Calculated total revenue:', total, 'from', state.revenueData.length, 'items')
      return total
    },
    
    // Calculate aeronautika revenue
    aeronautikaRevenue: (state) => {
      const total = state.revenueData
        .filter(item => item.category === 'aeronautika')
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
      console.log('✈️ Calculated aeronautika revenue:', total)
      return total
    },
    
    // Calculate non-aeronautika revenue
    nonAeronautikaRevenue: (state) => {
      const total = state.revenueData
        .filter(item => item.category === 'non-aeronautika')
        .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
      console.log('🏢 Calculated non-aeronautika revenue:', total)
      return total
    },

    // Get top services by revenue
    topServices: (state) => {
      if (!state.revenueData.length) return []
      
      const serviceMap = new Map()
      
      state.revenueData.forEach(item => {
        const amount = parseFloat(item.amount || 0)
        const current = serviceMap.get(item.service_type) || 0
        serviceMap.set(item.service_type, current + amount)
      })
      
      return Array.from(serviceMap.entries())
        .map(([name, amount]) => ({ name, amount }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
    },

    // Get top partners by revenue
    topPartners: (state) => {
      if (!state.revenueData.length) return []
      
      const partnerMap = new Map()
      const totalRevenue = state.revenueData.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0)
      
      state.revenueData.forEach(item => {
        // Extract partner info safely
        let partnerName = 'Unknown Partner'
        let partnerId = null
        
        if (item.partner) {
          if (typeof item.partner === 'object') {
            partnerName = item.partner.name || 'Unknown Partner'
            partnerId = item.partner.id
          } else if (typeof item.partner === 'string') {
            partnerName = item.partner
            partnerId = item.partner_id
          }
        }
        
        // Get or create partner entry
        const key = `${partnerId}-${partnerName}`
        const existing = partnerMap.get(key) || {
          id: partnerId,
          name: partnerName,
          amount: 0,
          transactions: 0
        }
        
        existing.amount += parseFloat(item.amount || 0)
        existing.transactions += 1
        
        partnerMap.set(key, existing)
      })
      
      // Convert to array and calculate percentages
      return Array.from(partnerMap.values())
        .map(partner => ({
          ...partner,
          percentage: totalRevenue > 0 ? ((partner.amount / totalRevenue) * 100).toFixed(1) : '0'
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 10)
    },

    // Check if any data is loading
    isLoading: (state) => {
      return state.loading || state.monthlyLoading || state.summaryLoading || state.monthlyDetailLoading
    },

    // Check if there are any errors
    hasErrors: (state) => {
      return Object.values(state.errors).some(error => error !== null)
    }
  },

  actions: {
    // Main data fetching action
    async fetchRevenueData(params = {}) {
      this.loading = true
      this.errors.revenue = null
      
      try {
        console.log('📊 Fetching revenue data with params:', params)
        
        const response = await apiClient.get('/revenue', { params })
        
        // Debug response structure
        console.log('📡 Response structure:', {
          hasSuccess: 'success' in response.data,
          hasData: 'data' in response.data,
          isArray: Array.isArray(response.data),
          keys: Object.keys(response.data)
        })
        
        // Handle different response formats
        if (response.data.success && response.data.data) {
          this.revenueData = response.data.data
          this.pagination = response.data.pagination || this.getDefaultPagination()
        } else if (Array.isArray(response.data)) {
          this.revenueData = response.data
          this.pagination = this.getDefaultPagination()
        } else {
          console.warn('⚠️ Unexpected response format:', response.data)
          this.revenueData = []
        }
        
        console.log(`✅ Loaded ${this.revenueData.length} revenue items`)
        
        // Update metadata
        this.lastUpdated = new Date().toISOString()
        
        return { success: true, data: this.revenueData }
        
      } catch (error) {
        this.errors.revenue = error.response?.data?.message || 'Failed to fetch revenue data'
        console.error('❌ Fetch revenue error:', error)
        
        // Clear data on error
        this.revenueData = []
        
        return { success: false, error: this.errors.revenue }
        
      } finally {
        this.loading = false
      }
    },

    // Fetch monthly aggregated data
    async fetchMonthlyData(year = null) {
      this.monthlyLoading = true
      this.errors.monthly = null
      
      try {
        const params = year ? { year } : { year: this.currentYear }
        console.log('📅 Fetching monthly data for year:', params.year)
        
        const response = await apiClient.get('/revenue/monthly', { params })
        
        // Validate monthly data format
        if (Array.isArray(response.data)) {
          this.monthlyData = response.data
          console.log(`✅ Loaded ${this.monthlyData.length} months of data`)
          
          // Debug monthly totals
          const monthlyTotal = this.monthlyData.reduce((sum, month) => sum + month.total, 0)
          console.log('📊 Monthly data total:', monthlyTotal)
        } else {
          console.warn('⚠️ Unexpected monthly data format:', response.data)
          this.monthlyData = []
        }
        
        return { success: true, data: this.monthlyData }
        
      } catch (error) {
        this.errors.monthly = error.response?.data?.message || 'Failed to fetch monthly data'
        console.error('❌ Fetch monthly error:', error)
        this.monthlyData = []
        
        return { success: false, error: this.errors.monthly }
        
      } finally {
        this.monthlyLoading = false
      }
    },

    // Fetch summary data
    async fetchSummary(year = null) {
      this.summaryLoading = true
      this.errors.summary = null
      
      try {
        const params = year ? { year } : { year: this.currentYear }
        console.log('📈 Fetching summary for year:', params.year)
        
        const response = await apiClient.get('/revenue/summary', { params })
        
        // Handle response format
        if (response.data.success && response.data.data) {
          this.summary = response.data.data
        } else if (response.data.summary) {
          this.summary = response.data
        } else {
          this.summary = response.data
        }
        
        console.log('✅ Summary loaded:', this.summary)
        
        return { success: true, data: this.summary }
        
      } catch (error) {
        this.errors.summary = error.response?.data?.message || 'Failed to fetch summary'
        console.error('❌ Fetch summary error:', error)
        this.summary = {}
        
        return { success: false, error: this.errors.summary }
        
      } finally {
        this.summaryLoading = false
      }
    },

    // Fetch detailed monthly data
    async fetchMonthlyDetail(year, month, filters = {}) {
      this.monthlyDetailLoading = true
      this.errors.detail = null
      
      try {
        const params = { year, month, ...filters }
        console.log('📋 Fetching monthly detail:', params)
        
        const response = await apiClient.get('/revenue/monthly-detail', { params })
        
        if (response.data.success) {
          this.monthlyDetailData = response.data
        } else {
          this.monthlyDetailData = response.data
        }
        
        console.log('✅ Monthly detail loaded')
        
        return { success: true, data: this.monthlyDetailData }
        
      } catch (error) {
        this.errors.detail = error.response?.data?.message || 'Failed to fetch monthly detail'
        console.error('❌ Fetch monthly detail error:', error)
        
        return { success: false, error: this.errors.detail }
        
      } finally {
        this.monthlyDetailLoading = false
      }
    },

    // Clear monthly detail data
    clearMonthlyDetail() {
      this.monthlyDetailData = null
      this.errors.detail = null
    },

    // Add new revenue
    async addRevenueData(data) {
      try {
        console.log('➕ Adding revenue:', data)
        
        const response = await apiClient.post('/revenue', data)
        const newRevenue = response.data.success ? response.data.data : response.data
        
        // Add to local state
        this.revenueData.unshift(newRevenue)
        
        // Refresh aggregated data
        await Promise.all([
          this.fetchMonthlyData(this.currentYear),
          this.fetchSummary(this.currentYear)
        ])
        
        console.log('✅ Revenue added successfully')
        return { success: true, data: newRevenue }
        
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to add revenue'
        console.error('❌ Add revenue error:', error)
        return { success: false, message, error }
      }
    },

    // Update revenue
    async updateRevenueData(id, data) {
      try {
        console.log('📝 Updating revenue:', id, data)
        
        const response = await apiClient.put(`/revenue/${id}`, data)
        const updatedRevenue = response.data.success ? response.data.data : response.data
        
        // Update local state
        const index = this.revenueData.findIndex(item => item.id === id)
        if (index !== -1) {
          this.revenueData[index] = updatedRevenue
        }
        
        // Refresh aggregated data
        await Promise.all([
          this.fetchMonthlyData(this.currentYear),
          this.fetchSummary(this.currentYear)
        ])
        
        console.log('✅ Revenue updated successfully')
        return { success: true, data: updatedRevenue }
        
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to update revenue'
        console.error('❌ Update revenue error:', error)
        return { success: false, message, error }
      }
    },

    // Delete revenue
    async deleteRevenueData(id) {
      try {
        console.log('🗑️ Deleting revenue:', id)
        
        await apiClient.delete(`/revenue/${id}`)
                // Remove from local state
        this.revenueData = this.revenueData.filter(item => item.id !== id)
        
        // Refresh aggregated data
        await Promise.all([
          this.fetchMonthlyData(this.currentYear),
          this.fetchSummary(this.currentYear)
        ])
        
        console.log('✅ Revenue deleted successfully')
        return { success: true }
        
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete revenue'
        console.error('❌ Delete revenue error:', error)
        return { success: false, message, error }
      }
    },

    // Refresh all data
    async refreshAllData(year = null) {
      console.log('🔄 Refreshing all data for year:', year || this.currentYear)
      
      // Clear any existing errors
      this.clearErrors()
      
      try {
        // Set year for subsequent calls
        if (year) {
          this.currentYear = year
        }
        
        // Fetch all data in parallel
        const results = await Promise.allSettled([
          this.fetchRevenueData({ year: this.currentYear }),
          this.fetchMonthlyData(this.currentYear),
          this.fetchSummary(this.currentYear)
        ])
        
        // Check results
        const failures = results.filter(r => r.status === 'rejected')
        if (failures.length > 0) {
          console.error('⚠️ Some data failed to load:', failures)
          throw new Error('Partial data load failure')
        }
        
        console.log('✅ All data refreshed successfully')
        
        // Verify data consistency
        this.verifyDataConsistency()
        
        return { success: true }
        
      } catch (error) {
        console.error('❌ Error refreshing all data:', error)
        return { success: false, error: error.message }
      }
    },

    async bulkDeleteRevenueData(ids) {
  try {
    console.log('🗑️ Bulk deleting revenue data:', ids)
    const response = await apiClient.post('/revenue/bulk-delete', { ids })
    
    if (response.data.success) {
      // Remove from local state
      this.revenueData = this.revenueData.filter(item => !ids.includes(item.id))
      
      console.log('✅ Bulk delete successful')
      return { success: true, message: response.data.message }
    } else {
      return { success: false, message: response.data.message }
    }
  } catch (error) {
    const message = error.response?.data?.message || 'Failed to delete revenues'
    console.error('❌ Bulk delete error:', error)
    return { success: false, message, error }
  }
},

    // Verify data consistency between different endpoints
    verifyDataConsistency() {
      console.log('🔍 Verifying data consistency...')
      
      // Calculate totals from revenue data
      const calculatedTotal = this.totalRevenue
      const calculatedAero = this.aeronautikaRevenue
      const calculatedNonAero = this.nonAeronautikaRevenue
      
      // Calculate totals from monthly data
      const monthlyTotal = this.monthlyData.reduce((sum, month) => sum + month.total, 0)
      const monthlyAero = this.monthlyData.reduce((sum, month) => sum + month.aeronautika, 0)
      const monthlyNonAero = this.monthlyData.reduce((sum, month) => sum + month.nonAeronautika, 0)
      
      // Get totals from summary (if available)
      const summaryTotal = this.summary?.summary?.totalRevenue || 0
      const summaryAero = this.summary?.summary?.aeronautikaRevenue || 0
      const summaryNonAero = this.summary?.summary?.nonAeronautikaRevenue || 0
      
      // Log comparison
      console.table({
        'Revenue Data': {
          Total: calculatedTotal,
          Aeronautika: calculatedAero,
          'Non-Aeronautika': calculatedNonAero
        },
        'Monthly Data': {
          Total: monthlyTotal,
          Aeronautika: monthlyAero,
          'Non-Aeronautika': monthlyNonAero
        },
        'Summary Data': {
          Total: summaryTotal,
          Aeronautika: summaryAero,
          'Non-Aeronautika': summaryNonAero
        }
      })
      
      // Check for discrepancies
      const tolerance = 0.01 // Allow 1 cent difference due to rounding
      
      if (Math.abs(calculatedTotal - monthlyTotal) > tolerance) {
        console.warn('⚠️ Discrepancy between revenue total and monthly total:', {
          revenue: calculatedTotal,
          monthly: monthlyTotal,
          difference: calculatedTotal - monthlyTotal
        })
      }
      
      if (Math.abs(calculatedTotal - summaryTotal) > tolerance && summaryTotal > 0) {
        console.warn('⚠️ Discrepancy between revenue total and summary total:', {
          revenue: calculatedTotal,
          summary: summaryTotal,
          difference: calculatedTotal - summaryTotal
        })
      }
    },

    // Helper to get default pagination
    getDefaultPagination() {
      return {
        total: this.revenueData.length,
        page: 1,
        limit: 100,
        totalPages: Math.ceil(this.revenueData.length / 100)
      }
    },

    // Clear all errors
    clearErrors() {
      this.error = null
      this.errors = {
        revenue: null,
        monthly: null,
        summary: null,
        detail: null
      }
    },

    // Clear all data
    clearAllData() {
      console.log('🧹 Clearing all revenue data')
      
      // Clear data
      this.revenueData = []
      this.monthlyData = []
      this.summary = {}
      this.monthlyDetailData = null
      
      // Reset pagination
      this.pagination = {
        total: 0,
        page: 1,
        limit: 100,
        totalPages: 0
      }
      
      // Clear errors
      this.clearErrors()
      
      // Reset metadata
      this.lastUpdated = null
    },

    // Set current year
    setCurrentYear(year) {
      this.currentYear = year
    },

    // Get revenue by ID
    getRevenueById(id) {
      return this.revenueData.find(item => item.id === id)
    },

    // Filter revenue data locally
    filterRevenueData(filters = {}) {
      let filtered = [...this.revenueData]
      
      if (filters.category) {
        filtered = filtered.filter(item => item.category === filters.category)
      }
      
      if (filters.service_type) {
        filtered = filtered.filter(item => item.service_type === filters.service_type)
      }
      
      if (filters.partner_id) {
        filtered = filtered.filter(item => {
          const partnerId = item.partner?.id || item.partner_id
          return partnerId === filters.partner_id
        })
      }
      
      if (filters.payment_status) {
        filtered = filtered.filter(item => item.payment_status === filters.payment_status)
      }
      
      if (filters.startDate && filters.endDate) {
        filtered = filtered.filter(item => {
          const itemDate = new Date(item.date)
          return itemDate >= new Date(filters.startDate) && itemDate <= new Date(filters.endDate)
        })
      }
      
      return filtered
    },

    // Export data (for reports)
    exportData(format = 'json') {
      const data = {
        revenue: this.revenueData,
        monthly: this.monthlyData,
        summary: this.summary,
        metadata: {
          exported_at: new Date().toISOString(),
          year: this.currentYear,
          total_records: this.revenueData.length
        }
      }
      
      if (format === 'json') {
        return JSON.stringify(data, null, 2)
      }
      
      // Add CSV export if needed
      if (format === 'csv') {
        return this.convertToCSV(this.revenueData)
      }
      
      return data
    },

    // Convert data to CSV format
    convertToCSV(data) {
      if (!data.length) return ''
      
      // Get headers
      const headers = [
        'ID', 'Date', 'Partner', 'Category', 'Service Type', 
        'Amount', 'Payment Status', 'Invoice Number', 'Description'
      ]
      
      // Convert data to CSV rows
      const rows = data.map(item => [
        item.id,
        item.date,
        item.partner?.name || item.partner || '',
        item.category,
        item.service_type,
        item.amount,
        item.payment_status,
        item.invoice_number || '',
        item.description || ''
      ])
      
      // Combine headers and rows
      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      return csv
    }
  },

  // Enable persistence (optional)
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'revenue-store',
        storage: localStorage,
        paths: ['currentYear', 'lastUpdated']
      }
    ]
  }
})