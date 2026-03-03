<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storage } from '../../utils/storage';
import SidebarAdmin from './SidebarAdmin.vue';
import AdminManagement from './AdminManagement.vue';
import logo from '../../assets/LOGO H.png';

const emit = defineEmits(['navigate']);

const isSidebarOpen = ref(false);
const isSuperAdmin = ref(false);

onMounted(() => {
  isSuperAdmin.value = storage.getItem('superadmin') === 'true';
});

const handleLogout = () => {
  storage.clear();
  sessionStorage.clear();
  emit('navigate', 'landing');
};

const handleNavigate = (view: string) => {
  if (view === 'admin-management') return;
  
  // If navigating to other admin sections, go back to the dashboard with that tab
  if (['overview', 'verification-professional', 'professionals', 'patients', 'requests', 'services-catalog', 'detailed-requests', 'services-management', 'settings'].includes(view)) {
    // We'll need a way to pass the tab to the dashboard. 
    // For now, let's just go to the dashboard and let it handle its default.
    // Or we could pass a param if App.vue supported it.
    emit('navigate', 'admin-dashboard'); 
    return;
  }
  
  emit('navigate', view);
};
</script>

<template>
  <div class="admin-layout">
    <SidebarAdmin 
      activeTab="admin-management" 
      :isOpen="isSidebarOpen"
      :superadmin="isSuperAdmin"
      @navigate="handleNavigate"
      @logout="handleLogout"
      @close="isSidebarOpen = false"
    />

    <main class="main-content">
      <!-- Mobile Header -->
      <header class="mobile-header">
        <div class="mobile-brand">
          <img :src="logo" alt="daricare" class="mobile-logo-img" />
        </div>
        <button class="menu-toggle" @click="isSidebarOpen = true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
      </header>

      <div class="page-container">
        <AdminManagement :superadmin="isSuperAdmin" />
      </div>
    </main>
  </div>
</template>

<style scoped>
.admin-layout {
  min-height: 100vh;
  width: 100%;
  background-color: #f1f5f9;
  color: #0f172a;
  position: relative;
  display: flex;
  align-items: flex-start;
}

.main-content { 
  flex: 1;
  min-width: 0;
  padding: 2.5rem 1.5rem; 
  min-height: 100vh;
}

.mobile-header {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1rem 1.5rem;
  background: white;
  border-bottom: 1px solid #f1f5f9;
  position: sticky;
  top: 0;
  z-index: 50;
  margin: -1.5rem -1rem 1.5rem -1rem;
}

.menu-toggle {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
}

.mobile-logo-img {
  height: 32px;
  width: auto;
}

.page-container {
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 1024px) {
  .mobile-header {
    display: flex;
  }
}
</style>
