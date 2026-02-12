<script setup lang="ts">
defineProps({
  isOpen: {
    type: Boolean,
    required: true
  },
  isConnected: {
    type: Boolean,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userSpeciality: {
    type: String,
    required: true
  },
  activeRequestsCount: {
    type: Number,
    default: 0
  },
  activeView: {
    type: String,
    default: 'requests'
  },
  userEmail: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['logout', 'navigate', 'view-profile']);

const handleLogout = () => {
  emit('logout');
};

const handleNavigate = (page: string) => {
  emit('navigate', page);
};
</script>

<template>
  <aside class="sidebar" :class="{ 'is-open': isOpen }">
    <div class="sidebar-header">
      <div class="logo">
        <img src="../../assets/LOGO H.png" alt="daricare logo" class="sidebar-logo-img" />
      </div>
    </div>
    
    <nav class="sidebar-nav">
      <a href="#" class="nav-item" :class="{ active: activeView === 'requests' }" @click.prevent="handleNavigate('requests')">
        <span class="nav-icon">⏳</span>
        <span class="nav-label">En attente</span>
        <span class="badge" v-if="activeRequestsCount">{{ activeRequestsCount }}</span>
      </a>
      <a href="#" class="nav-item" :class="{ active: activeView === 'all_history' }" @click.prevent="handleNavigate('all_history')">
        <span class="nav-icon">📋</span>
        <span class="nav-label">Demandes</span>
      </a>
      <a href="#" class="nav-item" :class="{ active: activeView === 'accepted' }" @click.prevent="handleNavigate('accepted')">
        <span class="nav-icon">📊</span>
        <span class="nav-label">Acceptés</span>
      </a>
      <a href="#" class="nav-item" :class="{ active: activeView === 'completed' }" @click.prevent="handleNavigate('completed')">
        <span class="nav-icon">✅</span>
        <span class="nav-label">Complétées</span>
      </a>
      <a href="#" class="nav-item" :class="{ active: activeView === 'calendar' }" @click.prevent="handleNavigate('calendar')">
        <span class="nav-icon">📅</span>
        <span class="nav-label">Calendrier</span>
      </a>
      <a href="#" class="nav-item" :class="{ active: activeView === 'patients' }" @click.prevent="handleNavigate('patients')">
        <span class="nav-icon">👥</span>
        <span class="nav-label">Patients</span>
      </a>
      <a href="#" class="nav-item" :class="{ active: activeView === 'analytics' }" @click.prevent="handleNavigate('analytics')">
        <span class="nav-icon">📊</span>
        <span class="nav-label">Analyses</span>
      </a>
      <a href="#" class="nav-item logout" @click.prevent="handleLogout">
        <span class="nav-icon">🚪</span>
        <span class="nav-label">Quitter</span>
      </a>
    </nav>

    <div class="pro-status" @click="emit('view-profile')" title="Voir mon profil">
      <div class="status-indicator" :class="isConnected ? 'online' : 'offline'"></div>
      <div class="status-info">
        <p class="pro-name">{{ userName }}</p>
        <p class="pro-email" v-if="userEmail">{{ userEmail }}</p>
        <p class="pro-role">{{ userSpeciality || 'Patientez...' }}</p>
      </div>
      <div class="socket-status" :title="isConnected ? 'WebSocket Connecté' : 'WebSocket Déconnecté'">
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background: white;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  overflow-y: auto;
  padding-bottom: 4rem;
}

.sidebar-header .logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #2b69ad;
  margin-bottom: 2rem;
}

.sidebar-logo-img {
  height: 30px;
  width: auto;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0.85rem;
  border-radius: 10px;
  text-decoration: none;
  color: #64748b;
  font-weight: 600;
  transition: all 0.2s;
  position: relative;
  font-size: 0.9rem;
}

.nav-item:hover, .nav-item.active {
  background: rgba(43, 105, 173, 0.08);
  color: #2b69ad;
}

.nav-item.logout {
  margin-top: auto;
  margin-bottom: 0.5rem;
  color: #64748b;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  justify-content: center;
}

.nav-item.logout:hover {
  background: #fef2f2;
  color: #ef4444;
  border-color: #fecaca;
  box-shadow: 0 2px 4px rgba(239, 68, 68, 0.1);
}

.nav-icon {
  font-size: 1.25rem;
  display: block;
}

.nav-label {
  display: block;
}

.badge {
  background: #2b69ad;
  color: white;
  padding: 0.1rem 0.6rem;
  border-radius: 20px;
  font-size: 0.75rem;
}

.pro-status {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-top: auto;
  margin-bottom: 2rem;
  position: relative;
  min-height: 4rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
}

.pro-status:hover {
  border-color: #2b69ad;
  background: #f8fafc;
  transform: translateY(-2px);
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-indicator.online {
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
}

.status-indicator.offline {
  background: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.2);
}

.socket-status {
  position: absolute;
  top: 8px;
  right: 8px;
  background: white;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  cursor: help;
}

.pro-name {
  font-weight: 700;
  font-size: 1rem;
  color: #0f172a;
  margin: 0;
  line-height: normal;
}

.pro-role {
  font-size: 0.75rem;
  color: #2b69ad;
  margin: 0;
  font-weight: 700;
}

.pro-email {
  font-size: 0.7rem;
  color: #64748b;
  margin: 0;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 140px;
}

@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    top: 65px;
    right: 0.75rem;
    left: 0.75rem;
    bottom: auto;
    width: auto;
    height: auto;
    background: white;
    z-index: 100;
    padding: 1.25rem;
    box-shadow: 0 15px 35px rgba(0,0,0,0.12);
    transform: translateY(-120%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    border-radius: 20px;
    border: 1px solid #e2e8f0;
    overflow-y: auto;
    max-height: 70vh;
  }

  .sidebar.is-open {
    transform: translateY(0);
  }

  .sidebar-header {
    display: none;
  }

  .sidebar-nav {
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.25rem 0;
    width: 100%;
    flex: none; /* Disable flex:1 on mobile top menu */
  }

  .nav-item {
    flex-direction: row;
    gap: 0.75rem;
    padding: 0.65rem 1rem;
    font-size: 0.95rem;
    justify-content: flex-start;
    width: 100%;
    border-radius: 8px;
  }

  .nav-item.logout {
    margin-top: 0.25rem;
  }

  .nav-icon {
    font-size: 1.2rem;
  }

  .badge {
    position: absolute;
    top: 50%;
    right: 1rem;
    transform: translateY(-50%);
    font-size: 0.65rem;
    padding: 1px 5px;
  }
}
</style>
