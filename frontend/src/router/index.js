import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import PartnerManagement from '../views/PartnerManagement.vue'

// Import views
import Login from '../views/Login.vue'
import Dashboard from '../views/Dashboard.vue'
import DataEntry from '../views/DataEntry.vue'
import MonthlyDetail from '../views/MonthlyDetail.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { title: 'Login - Bandara Haluoleo' }
  },
  {
    path: '/',
    name: 'Dashboard',
    component: Dashboard,
    meta: { 
      requiresAuth: true,
      title: 'Dashboard - Bandara Haluoleo'
    }
  },
  {
        path: '/partners',

    name: 'PartnerManagement', 

    component: PartnerManagement,

    meta: { 

      requiresAuth: true,

      title: 'Manajemen Mitra - Bandara Haluoleo'

    }
  },
  {
    path: '/data-entry',
    name: 'DataEntry',
    component: DataEntry,
    meta: { 
      requiresAuth: true,
      title: 'Input Data - Bandara Haluoleo'
    }
  },
  {
    path: '/monthly-detail',
    name: 'MonthlyDetail',
    component: MonthlyDetail,
    meta: { 
      requiresAuth: true,
      title: 'Detail Pendapatan Bulanan - Bandara Haluoleo'
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  // Set page title
  document.title = to.meta.title || 'Dashboard Bandara Haluoleo'
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.name === 'Login' && authStore.isAuthenticated) {
    next('/')
  } else {
    next()
  }
})

export default router