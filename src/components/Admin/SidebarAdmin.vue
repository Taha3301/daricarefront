<script setup lang="ts">
import logo from '../../assets/LOGO H.png';

const props = defineProps({
  activeTab: {
    type: String,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['navigate', 'logout', 'close']);

const handleNavigate = (tab: string) => {
  emit('navigate', tab);
};

const handleLogout = () => {
  emit('logout');
};
</script>

<template>
  <aside class="sidebar" :class="{ open: isOpen }">
    <div class="sidebar-header">
      <div class="brand">
        <img :src="logo" alt="daricare" class="logo-img" />
      </div>
      <button class="mobile-close" @click="emit('close')">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>

    <nav class="sidebar-nav">
      <button 
        :class="['nav-item', { active: activeTab === 'overview' }]"
        @click="handleNavigate('overview')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Vue d'ensemble
      </button>
      <button 
        :class="['nav-item', { active: activeTab === 'verification-professional' }]"
        @click="handleNavigate('verification-professional')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
        Vérification Professionnels
      </button>

      <button 
        :class="['nav-item', { active: activeTab === 'professionals' }]"
        @click="handleNavigate('professionals')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="2"/></svg>
        Professionnels
      </button>

      <button 
        :class="['nav-item', { active: activeTab === 'patients' }]"
        @click="handleNavigate('patients')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="2"/></svg>
        Patients
      </button>

      <button 
        :class="['nav-item', { active: activeTab === 'requests' }]"
        @click="handleNavigate('requests')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        Demandes de soins
      </button>

      <button 
        :class="['nav-item', { active: activeTab === 'services-catalog' }]"
        @click="handleNavigate('services-catalog')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-icon"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
        Catalogue des Services
      </button>

      <button 
        :class="['nav-item', { active: activeTab === 'detailed-requests' }]"
        @click="handleNavigate('detailed-requests')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-icon"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        Audit de Facturation
      </button>

      <button 
        :class="['nav-item', { active: activeTab === 'services-management' }]"
        @click="handleNavigate('services-management')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-icon"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
        Gérer les Services
      </button>
      <button 
        :class="['nav-item', { active: activeTab === 'settings' }]"
        @click="handleNavigate('settings')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Configuration
      </button>
    </nav>

    <div class="sidebar-footer">
      <button class="logout-btn" @click="handleLogout">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Déconnexion
      </button>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e2e8f0;
  display: flex; flex-direction: column;
  padding: 1.5rem;
  position: sticky; top: 0; height: 100vh;
  flex-shrink: 0;
  box-shadow: 4px 0 24px rgba(0,0,0,0.02);
  z-index: 100;
}

.sidebar-header { 
  margin-bottom: 2.5rem; 
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mobile-close {
  display: none;
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
}

.brand {
  display: flex; align-items: center; justify-content: center;
  width: 100%;
}

.logo-img {
  height: 48px;
  width: auto;
  max-width: 100%;
  object-fit: contain;
}

.sidebar-nav { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; }

.nav-item {
  display: flex; align-items: center; gap: 0.625rem;
  padding: 0.75rem 0.875rem; border: none; background: transparent;
  color: #64748b; border-radius: 12px; cursor: pointer;
  font-weight: 600; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%; text-align: left;
  font-size: 0.875rem;
}

.nav-item:hover { background: #f8fafc; color: #0f172a; transform: translateX(4px); }
.nav-item.active { background: rgba(43, 105, 173, 0.05); color: #2b69ad; }

.sidebar-footer { margin-top: auto; padding-top: 1rem; padding-bottom: 2rem; border-top: 1px solid #f1f5f9; }

.logout-btn {
  display: flex; align-items: center; gap: 0.75rem; width: 100%;
  padding: 0.875rem 1rem; border: none; background: transparent;
  color: #ef4444; cursor: pointer; font-weight: 700; border-radius: 12px;
  transition: all 0.2s;
}

.logout-btn:hover { background: #fff5f5; }

@media (max-width: 1024px) {
  .sidebar {
    position: fixed; left: 0; top: 0; bottom: 0;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  .sidebar.open {
    transform: translateX(0);
  }
  .mobile-close {
    display: block;
  }
}
</style>
