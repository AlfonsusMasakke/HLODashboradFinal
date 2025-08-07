<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-container">
          <img src="/logo-haluoleo.png" alt="Haluoleo Airport" class="logo">
        </div>
        <h1>DASHBOARD</h1>
        <h2>CAPAIAN KINERJA PENAGIHAN</h2>
        <p>Bandara Haluoleo Kendari</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="form.username" 
            required 
            class="form-input"
            placeholder="Masukkan username"
          >
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="form.password" 
            required 
            class="form-input"
            placeholder="Masukkan password"
          >
        </div>
        
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? 'Logging in...' : 'Login' }}
        </button>
        
        <div v-if="error" class="error-message">
          {{ error }}
        </div>
      </form>
      
      <div class="login-info">
        <p><strong>Login Demo:</strong></p>
        <p>Admin: admin / admin123</p>
        <p>User: user / user123</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

export default {
  name: 'Login',
  setup() {
    const router = useRouter()
    const authStore = useAuthStore()
    
    const form = ref({
      username: '',
      password: ''
    })
    
    const loading = ref(false)
    const error = ref('')
    
    const handleLogin = async () => {
      loading.value = true
      error.value = ''
      
      const result = await authStore.login(form.value)
      
      if (result.success) {
        router.push('/')
      } else {
        error.value = result.message
      }
      
      loading.value = false
    }
    
    return {
      form,
      loading,
      error,
      handleLogin
    }
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #6b46c1 0%, #3b82f6 50%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  box-shadow: 0 32px 64px rgba(0,0,0,0.2);
  padding: 48px;
  width: 100%;
  max-width: 450px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.logo-container {
  margin-bottom: 24px;
}

.logo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
}

.login-header h1 {
  color: #fbbf24;
  font-size: 32px;
  font-weight: 900;
  margin: 16px 0 8px 0;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.login-header h2 {
  color: #6b46c1;
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 16px 0;
}

.login-header p {
  color: #6b7280;
  font-size: 16px;
  font-weight: 500;
}

.form-group {
  margin-bottom: 24px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #374151;
  font-weight: 600;
  font-size: 14px;
}

.form-input {
  width: 100%;
  padding: 16px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 16px;
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #6b46c1;
  box-shadow: 0 0 0 3px rgba(107, 70, 193, 0.1);
}

.login-btn {
  width: 100%;
  padding: 16px;
  background: linear-gradient(135deg, #6b46c1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(107, 70, 193, 0.3);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}

.error-message {
  color: #ef4444;
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  padding: 12px;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.login-info {
  margin-top: 30px;
  padding: 20px;
  background: #f8fafc;
  border-radius: 12px;
  text-align: center;
}

.login-info p {
  margin: 5px 0;
  font-size: 14px;
  color: #6b7280;
}

.login-info p:first-child {
  color: #374151;
  font-weight: 600;
}
</style>