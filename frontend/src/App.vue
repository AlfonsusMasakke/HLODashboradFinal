<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
import { useAuthStore } from './stores/auth'

export default {
  name: 'App',
  setup() {
    const authStore = useAuthStore()
    
    // Check authentication on app load
    authStore.checkAuth()
    
    return {}
  }
}
</script>

<style>
#app {
  min-height: 100vh;
  font-family: 'Inter', sans-serif;
}
</style>