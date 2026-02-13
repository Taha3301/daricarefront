<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { getApiUrl } from '../../config/api';
import { storage } from '../../utils/storage';
const localStorage = storage;
import ProfessionalVerification from './ProfessionalVerification.vue';
import ServicesManagement from './ServicesManagement.vue';
import ServicesCatalog from './ServicesCatalog.vue';
import BookingManagement from './BookingManagement.vue';
import SidebarAdmin from './SidebarAdmin.vue';
import Configuration from './Configuration.vue';
import AdminPatients from './AdminPatients.vue';
import DetailedRequests from './DetailedRequests.vue';
import logo from '../../assets/LOGO H.png';

interface DashboardStats {
  summary: {
    totalRevenue: number;
    totalRequests: number;
    totalProfessionals: number;
    pendingProfessionals: number;
    totalAdmins: number;
  };
  requestStatus: Record<string, number>;
  topServices: Array<{ name: string; count: number; revenue: number }>;
  recentRequests: Array<{
    id: number;
    patientName: string;
    service: string;
    status: string;
    date: string;
  }>;
}

const emit = defineEmits(['navigate']);

const activeTab = ref('overview');
const professionals = ref<any[]>([]);
const filteredProfessionals = computed(() => {
  return professionals.value.filter(p => p.status !== 'PENDING');
});
const isLoadingDocs = ref(false);
const selectedPro = ref<any>(null);
const isSidebarOpen = ref(false);


const dashboardData = ref<DashboardStats | null>(null);
const isLoadingStats = ref(false);

const stats = computed(() => {
  if (!dashboardData.value) return [
    { label: 'Professionnels', value: '...', trend: '', icon: 'users' },
    { label: 'Demandes', value: '...', trend: '', icon: 'clock' },
    { label: 'Vérifications', value: '...', trend: '', icon: 'check-circle' },
    { label: 'Revenus (HT)', value: '...', trend: '', icon: 'trending-up' }
  ];

  const s = dashboardData.value.summary;
  return [
    { label: 'Professionnels', value: s.totalProfessionals.toString(), trend: `+${s.totalProfessionals}`, icon: 'users' },
    { label: 'Demandes', value: s.totalRequests.toString(), trend: '', icon: 'file-text' },
    { label: 'Vérifications', value: s.pendingProfessionals.toString(), trend: s.pendingProfessionals > 0 ? 'Action requise' : 'À jour', icon: 'check-circle' },
    { label: 'Revenus (HT)', value: `${s.totalRevenue.toLocaleString()} DT`, trend: '', icon: 'trending-up' }
  ];
});

const fetchDashboardStats = async () => {
  const token = storage.getItem('access_token');
  if (!token) return;

  try {
    isLoadingStats.value = true;
    const response = await fetch(getApiUrl('/admin/dashboard/stats'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      dashboardData.value = await response.json();
    }
  } catch (err) {
    console.error('Failed to fetch dashboard stats:', err);
  } finally {
    isLoadingStats.value = false;
  }
};

const fetchProfessionals = async () => {
  const token = storage.getItem('access_token');
  if (!token) return;

  try {
    isLoadingDocs.value = true;
    const response = await fetch(getApiUrl('/auth/professionals/documents'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      const data = await response.json();
      professionals.value = data;
    }
  } catch (err) {
    console.error('Failed to fetch professionals:', err);
  } finally {
    isLoadingDocs.value = false;
  }
};

onMounted(() => {
  if (activeTab.value === 'verification-professional') {
    fetchProfessionals();
  } else if (activeTab.value === 'overview') {
    fetchDashboardStats();
  }
});

watch(activeTab, (newTab) => {
  if (newTab === 'verification-professional' || newTab === 'professionals') {
    fetchProfessionals();
  } else if (newTab === 'overview') {
    fetchDashboardStats();
  }
});

const handleLogout = () => {
  localStorage.clear();
  sessionStorage.clear();
  emit('navigate', 'landing');
};

const handleBanToggle = async (proId: number, currentBanStatus: boolean) => {
  const token = storage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(getApiUrl(`/admin/users/${proId}/ban`), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({ ban: !currentBanStatus })
    });

    if (response.ok) {
      await fetchProfessionals();
    } else {
      console.error('Failed to toggle ban status');
    }
  } catch (err) {
    console.error('Error toggling ban status:', err);
  }
};

const getStatusClass = (status: string) => {
  switch (status) {
    case 'VALIDATED': return 'status-validated';
    case 'PENDING': return 'status-pending';
    case 'REJECTED': return 'status-rejected';
    default: return '';
  }
};
</script>

<template>
  <div class="admin-layout">
    <SidebarAdmin 
      :activeTab="activeTab" 
      :isOpen="isSidebarOpen"
      @navigate="(tab) => { activeTab = tab; isSidebarOpen = false; }"
      @logout="handleLogout"
      @close="isSidebarOpen = false"
    />

    <!-- Main Content -->
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

      <div class="dashboard-grid">
        <!-- Stats Row -->
        <div v-if="activeTab === 'overview'" class="stats-container">
          <div v-for="stat in stats" :key="stat.label" class="stat-card">
            <div class="stat-header">
              <span class="stat-label">{{ stat.label }}</span>
              <span :class="['stat-trend', stat.trend.startsWith('+') ? 'up' : 'down']">
                {{ stat.trend }}
              </span>
            </div>
            <div class="stat-body">
              <span class="stat-value">{{ stat.value }}</span>
            </div>
          </div>
        </div>

        <!-- Professionals LIST Table (Regular) -->
        <div v-if="activeTab === 'professionals'" class="grid-card full-width">
          <div class="card-header">
            <div class="header-main">
              <h3>Liste des Professionnels</h3>
              <p class="subtitle">{{ filteredProfessionals.length }} professionnels enregistrés</p>
            </div>
            <button class="refresh-btn" @click="fetchProfessionals" :disabled="isLoadingDocs">
              <svg :class="{ 'spinning': isLoadingDocs }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              {{ isLoadingDocs ? 'Chargement...' : 'Actualiser' }}
            </button>
          </div>

          <div class="table-wrapper admin-card">
            <table v-if="filteredProfessionals.length > 0" class="admin-table">
              <thead>
                <tr>
                  <th>Professionnel</th>
                  <th>Spécialité</th>
                  <th>Ville</th>
                  <th>Documents</th>
                  <th>Statut</th>
                  <th>Ban</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="pro in filteredProfessionals" :key="pro.id" class="pro-row">
                  <td>
                    <div class="user-info">
                      <div class="user-avatar-small">{{ pro.name[0] }}</div>
                      <div class="user-details">
                        <span class="user-name">{{ pro.name }}</span>
                        <span class="user-email">{{ pro.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="spec-badge">{{ pro.speciality || 'N/A' }}</span>
                  </td>
                  <td>{{ pro.city || '—' }}</td>
                  <td>
                    <div class="doc-stacks">
                      <span v-if="pro.documents?.length > 0" class="doc-count">
                        {{ pro.documents.length }} document(s)
                      </span>
                      <span v-else class="no-docs">Aucun document</span>
                    </div>
                  </td>
                  <td>
                    <span :class="['status-badge', getStatusClass(pro.status)]">
                      {{ pro.status === 'PENDING' ? 'En attente' : pro.status }}
                    </span>
                  </td>
                  <td>
                    <span :class="['ban-badge', pro.ban ? 'banned' : 'active']">
                      {{ pro.ban ? 'Banni' : 'Actif' }}
                    </span>
                  </td>
                  <td class="text-right">
                    <div class="table-actions">
                      <button 
                        :class="['action-btn', pro.ban ? 'unban-btn' : 'ban-btn']" 
                        @click="handleBanToggle(pro.id, pro.ban)" 
                        :title="pro.ban ? 'Débannir' : 'Bannir'"
                      >
                        <svg v-if="!pro.ban" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      </button>
                      <button class="action-btn view-btn" @click="selectedPro = pro" title="Voir les détails">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-else-if="!isLoadingDocs" class="empty-state">
              <div class="empty-icon">📂</div>
              <p>Aucun professionnel enregistré.</p>
            </div>
            
            <!-- Mobile Cards View -->
            <div class="mobile-cards">
              <div v-for="pro in filteredProfessionals" :key="pro.id" class="mobile-pro-card" @click="selectedPro = pro">
                <div class="mobile-card-header">
                  <div class="mobile-user-info">
                    <div class="user-avatar-small">{{ pro.name[0] }}</div>
                    <div>
                      <span class="user-name">{{ pro.name }}</span>
                      <span class="user-email">{{ pro.email }}</span>
                    </div>
                  </div>
                  <span :class="['status-badge', getStatusClass(pro.status)]">
                    {{ pro.status === 'PENDING' ? 'En attente' : pro.status }}
                  </span>
                </div>
                
                <div class="mobile-card-body">
                  <div class="info-row">
                    <span class="label">Spécialité:</span>
                    <span class="value">{{ pro.speciality || 'N/A' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Ville:</span>
                    <span class="value">{{ pro.city || '—' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">Documents:</span>
                    <span class="value doc-count-mobile">
                      {{ pro.documents?.length || 0 }} docs
                    </span>
                  </div>
                  <div class="info-row">
                    <span class="label">Status:</span>
                    <span :class="['ban-badge', pro.ban ? 'banned' : 'active']">
                      {{ pro.ban ? 'Banni' : 'Actif' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- NEW Verification Component -->
        <ProfessionalVerification v-if="activeTab === 'verification-professional'" />

        <!-- Services Management Component -->
        <ServicesCatalog v-if="activeTab === 'services-catalog'" />
        <ServicesManagement v-if="activeTab === 'services-management'" />
        <AdminPatients v-if="activeTab === 'patients'" />
        <BookingManagement v-if="activeTab === 'requests'" />
        <DetailedRequests v-if="activeTab === 'detailed-requests'" />
        <Configuration v-if="activeTab === 'settings'" />

        <!-- Professional View Modal (ReadOnly for regular list) -->
        <div v-if="selectedPro && activeTab === 'professionals'" class="modal-overlay" @click.self="selectedPro = null">
          <div class="modal-card">
            <header class="modal-header">
              <div class="modal-title-area">
                <h2>Profil de {{ selectedPro.name }}</h2>
                <span :class="['status-badge', getStatusClass(selectedPro.status)]">{{ selectedPro.status }}</span>
              </div>
              <button class="close-btn" @click="selectedPro = null">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </header>
            
            <div class="modal-content">
              <div class="pro-info-grid">
                <div class="info-group">
                  <label>Informations Personnelles</label>
                  <p><strong>Email:</strong> {{ selectedPro.email }}</p>
                  <p><strong>Téléphone:</strong> {{ selectedPro.phone || selectedPro.personalPhone || 'N/A' }}</p>
                  <p><strong>CIN:</strong> {{ selectedPro.cin || 'N/A' }}</p>
                </div>
                <div class="info-group">
                  <label>Expertise Professionnelle</label>
                  <p><strong>Spécialité:</strong> {{ selectedPro.speciality }}</p>
                  <p><strong>Expérience:</strong> {{ selectedPro.yearsOfExperience }} ans</p>
                  <p><strong>Numéro ADELI/RPPS:</strong> {{ selectedPro.adeliRppsNumber || 'N/A' }}</p>
                </div>
                <div class="info-group full-width">
                  <label>Localisation</label>
                  <p><strong>Adresse:</strong> {{ selectedPro.professionalAddress || 'N/A' }}, {{ selectedPro.city || 'N/A' }}</p>
                </div>
              </div>

              <div class="documents-section">
                <h3>Documents Justificatifs</h3>
                <div v-if="selectedPro.documents && selectedPro.documents.length > 0" class="docs-grid">
                  <div v-for="doc in selectedPro.documents" :key="doc.id" class="document-card">
                    <div class="doc-preview">
                      <div class="doc-icon">
                        <svg v-if="doc.type === 'ID_CARD'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="2"/></svg>
                        <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                      </div>
                      <a :href="getApiUrl(doc.filePath)" target="_blank" class="view-doc-link">Ouvrir le document</a>
                    </div>
                    <div class="doc-info">
                      <span class="doc-type">{{ doc.type }}</span>
                      <p class="doc-desc">{{ doc.description }}</p>
                      <div class="doc-status" :class="{ verified: doc.verified }">
                        <svg v-if="doc.verified" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        {{ doc.verified ? 'Vérifié' : 'Non vérifié' }}
                      </div>
                    </div>
                  </div>
                </div>
                <div v-else class="no-docs-empty">
                  Aucun document soumis.
                </div>
              </div>
            </div>
          </div>
        </div>





        <!-- Recent Activity/Charts Placeholder -->
        <div v-if="activeTab === 'overview'" class="content-grid">
          <div class="grid-card main-area">
            <div class="card-header-simple">
              <h3>Demandes Récentes</h3>
              <button class="view-all-btn" @click="activeTab = 'requests'">Voir tout</button>
            </div>
            
            <div v-if="isLoadingStats" class="mini-loader-box">
              <div class="mini-spinner"></div>
              <p>Chargement des demandes...</p>
            </div>

            <div v-else-if="dashboardData?.recentRequests?.length" class="recent-requests-table">
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="req in dashboardData.recentRequests" :key="req.id">
                    <td>
                      <div class="patient-name-mini">{{ req.patientName }}</div>
                    </td>
                    <td><span class="service-pill-mini">{{ req.service }}</span></td>
                    <td><span class="date-text-mini">{{ new Date(req.date).toLocaleDateString() }}</span></td>
                    <td>
                      <span :class="['status-dot-badge', req.status]">
                        {{ req.status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-else class="empty-state-mini">
              <p>Aucune demande récente.</p>
            </div>
          </div>

          <div class="grid-card side-area">
            <div class="card-header-simple">
              <h3>Services Populaires</h3>
            </div>
            
            <div v-if="isLoadingStats" class="mini-loader-box">
              <div class="mini-spinner"></div>
            </div>

            <div v-else-if="dashboardData?.topServices?.length" class="top-services-list">
              <div v-for="service in dashboardData.topServices" :key="service.name" class="service-stat-item">
                <div class="service-info-mini">
                  <span class="service-name-mini">{{ service.name }}</span>
                  <span class="service-count-mini">{{ service.count }} demandes</span>
                </div>
                <div class="service-revenue-mini">{{ service.revenue.toLocaleString() }} DT</div>
              </div>
            </div>

            <div v-else class="empty-state-mini">
              <p>Données indisponibles.</p>
            </div>

            <div class="quick-actions-section">
              <h3>Actions Rapide</h3>
              <div class="quick-actions">
                <button class="action-tile" @click="activeTab = 'verification-professional'">
                  <div class="tile-icon verify-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                  </div>
                  <div class="tile-content">
                    <span class="tile-title">Vérifier les IDEL</span>
                    <span class="tile-desc">Gérer les documents pro</span>
                  </div>
                </button>
                
                <button class="action-tile" @click="activeTab = 'detailed-requests'">
                  <div class="tile-icon audit-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <div class="tile-content">
                    <span class="tile-title">Exporter l'Audit</span>
                    <span class="tile-desc">Rapport de facturation</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Overview Component Styles */
.card-header-simple {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.card-header-simple h3 {
  font-size: 1.125rem;
  font-weight: 800;
  color: #0f172a;
}

.view-all-btn {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #2b69ad;
  background: none;
  border: none;
  cursor: pointer;
}

.recent-requests-table {
  width: 100%;
  overflow-x: auto;
}

.recent-requests-table table {
  width: 100%;
  border-collapse: collapse;
}

.recent-requests-table th {
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #94a3b8;
  padding: 0.75rem;
  border-bottom: 1px solid #f1f5f9;
}

.recent-requests-table td {
  padding: 1rem 0.75rem;
  font-size: 0.875rem;
  border-bottom: 1px solid #f8fafc;
}

.patient-name-mini {
  font-weight: 600;
  color: #1e293b;
}

.service-pill-mini {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #f1f5f9;
  border-radius: 6px;
  color: #475569;
}

.date-text-mini {
  color: #64748b;
  font-size: 0.8rem;
}

.status-dot-badge {
  display: inline-flex;
  align-items: center;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
}

.status-dot-badge.pending { background: #fef3c7; color: #92400e; }
.status-dot-badge.accepted { background: #dcfce7; color: #166534; }
.status-dot-badge.done { background: #eff6ff; color: #1e40af; }
.status-dot-badge.rejected { background: #fee2e2; color: #991b1b; }

.top-services-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.service-stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 12px;
}

.service-info-mini {
  display: flex;
  flex-direction: column;
}

.service-name-mini {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
}

.service-count-mini {
  font-size: 0.75rem;
  color: #64748b;
}

.service-revenue-mini {
  font-weight: 800;
  color: #10b981;
  font-size: 0.9rem;
}

.quick-actions-section {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f1f5f9;
}

.quick-actions-section h3 {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #64748b;
  margin-bottom: 1rem;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.action-tile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: white;
  border: 1.5px solid #f1f5f9;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-align: left;
  width: 100%;
}

.action-tile:hover {
  border-color: #2b69ad;
  background: #f0f7ff;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(43, 105, 173, 0.08);
}

.tile-icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.verify-icon { background: #ecfdf5; color: #10b981; }
.audit-icon { background: #eff6ff; color: #2b69ad; }

.tile-content {
  display: flex;
  flex-direction: column;
}

.tile-title {
  font-size: 0.875rem;
  font-weight: 700;
  color: #1e293b;
}

.tile-desc {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

.mini-loader-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
  color: #94a3b8;
}

.mini-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #f1f5f9;
  border-top-color: #2b69ad;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 0.5rem;
}

.admin-layout {
  min-height: 100vh;
  width: 100%;
  background-color: #f1f5f9;
  color: #0f172a;
  position: relative;
  display: flex;
  align-items: flex-start;
}

/* Main Content Styling */
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
  /* Negative margin matches mobile main-content padding */
  margin: -1.5rem -1rem 1.5rem -1rem;
}

.menu-toggle {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 0.5rem;
}

.mobile-brand {
  font-weight: 800;
  color: #2b69ad;
  font-size: 1.25rem;
}

/* Dashboard Grid */
.dashboard-grid { display: flex; flex-direction: column; gap: 2.5rem; }

.stats-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; }

.stat-card {
  background: white; padding: 1.75rem; border-radius: 24px;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), 0 10px 15px -3px rgba(0,0,0,0.03);
  border: 1px solid #f1f5f9; transition: transform 0.2s;
}

.stat-card:hover { transform: translateY(-4px); }

.stat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.stat-label { color: #64748b; font-size: 0.9375rem; font-weight: 600; }
.stat-trend { font-size: 0.75rem; font-weight: 700; padding: 0.375rem 0.625rem; border-radius: 9999px; }
.stat-trend.up { background: #dcfce7; color: #15803d; }
.stat-trend.down { background: #fee2e2; color: #b91c1c; }
.stat-trend.Action.requise { background: #fee2e2; color: #b91c1c; }
.stat-trend.À.jour { background: #dcfce7; color: #15803d; }
.stat-value { font-size: 2rem; font-weight: 800; color: #0f172a; }

.content-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.grid-card {
  background: white; padding: 2rem; border-radius: 28px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);
  border: 1px solid #f1f5f9;
}

.full-width { grid-column: 1 / -1; }

.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
.card-header h3 { font-size: 1.375rem; font-weight: 800; color: #0f172a; margin-bottom: 0.25rem; }
.subtitle { color: #64748b; font-size: 0.9375rem; }

.refresh-btn {
  display: flex; align-items: center; gap: 0.625rem;
  padding: 0.625rem 1.125rem; border: 1px solid #e2e8f0;
  background: white; border-radius: 12px; cursor: pointer;
  font-size: 0.875rem; font-weight: 600; color: #475569;
  transition: all 0.2s;
}
.refresh-btn:hover { background: #f1f5f9; border-color: #cbd5e1; }

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Table Styling */
.table-wrapper { 
  margin: 0 -0.5rem; 
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.admin-table { 
  width: 100%; 
  border-collapse: separate; 
  border-spacing: 0 0.75rem; 
  min-width: 800px;
}
.admin-table th { 
  padding: 0.75rem 0.75rem; 
  color: #64748b; 
  font-weight: 700; 
  font-size: 0.75rem; 
  text-transform: uppercase; 
  letter-spacing: 0.05em; 
  border-bottom: 1px solid #f1f5f9; 
}
.admin-table td { 
  padding: 0.875rem 0.75rem; 
  background: transparent; 
  border-bottom: 1px solid #f8fafc; 
  vertical-align: middle; 
  font-size: 0.875rem;
}

.pro-row:hover td { background: #f8fafc; }

.user-info { display: flex; align-items: center; gap: 1rem; }
.user-avatar-small {
  width: 44px; height: 44px; background: #f0f7ff;
  color: #2b69ad; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 1.125rem;
}
.user-name { display: block; font-weight: 700; color: #0f172a; font-size: 0.9375rem; }
.user-email { display: block; font-size: 0.8125rem; color: #64748b; margin-top: 0.125rem; }

.spec-badge {
  background: #f1f5f9; padding: 0.375rem 0.75rem;
  border-radius: 8px; font-weight: 600; font-size: 0.8125rem; color: #475569;
}

.doc-count { font-weight: 600; font-size: 0.875rem; color: #3b82f6; cursor: help; }
.no-docs { color: #94a3b8; font-size: 0.875rem; font-style: italic; }

.status-badge {
  padding: 0.375rem 0.875rem; border-radius: 9999px;
  font-size: 0.75rem; font-weight: 700; display: inline-flex;
}
.status-validated { 
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); 
  color: #065f46; 
  border: 1.5px solid #6ee7b7; 
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15);
  font-weight: 800;
}
.status-pending { 
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
  color: #92400e; 
  border: 1.5px solid #fbbf24; 
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
  font-weight: 800;
}
.status-rejected { 
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); 
  color: #991b1b; 
  border: 1.5px solid #f87171; 
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
  font-weight: 800;
}

.text-right { text-align: right; }
.table-actions { display: flex; justify-content: flex-end; }

.action-btn {
  width: 38px; height: 38px; border-radius: 10px;
  border: 1px solid #e2e8f0; background: white;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #64748b; transition: all 0.2s;
}
.action-btn:hover { border-color: #2b69ad; color: #2b69ad; background: #f0f7ff; }

.ban-btn {
  color: #ef4444;
  border-color: #fecaca;
}
.ban-btn:hover {
  background: #fee2e2;
  border-color: #ef4444;
  color: #dc2626;
}

.unban-btn {
  color: #10b981;
  border-color: #a7f3d0;
}
.unban-btn:hover {
  background: #d1fae5;
  border-color: #10b981;
  color: #059669;
}

.ban-badge {
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  display: inline-flex;
}
.ban-badge.active {
  background: #d1fae5;
  color: #059669;
}
.ban-badge.banned {
  background: #fee2e2;
  color: #dc2626;
}


/* Modal Styling */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px); display: flex; align-items: center;
  justify-content: center; z-index: 1000; padding: 2rem;
}

.modal-card {
  background: white; width: 100%; max-width: 900px;
  max-height: 90vh; border-radius: 32px; overflow: hidden;
  display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
  animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }

.modal-header {
  padding: 2rem; background: #ffffff; border-bottom: 1px solid #f1f5f9;
  display: flex; justify-content: space-between; align-items: center;
}
.modal-title-area { display: flex; align-items: center; gap: 1.5rem; }
.modal-title-area h2 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }

.close-btn { background: #f1f5f9; border: none; width: 44px; height: 44px; border-radius: 12px; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.close-btn:hover { background: rgba(43, 105, 173, 0.1); color: #2b69ad; }

.modal-content { padding: 2.5rem; overflow-y: auto; flex: 1; }

.pro-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; margin-bottom: 3rem; }
.info-group label { display: block; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 1rem; }
.info-group p { font-size: 0.9375rem; color: #334155; margin-bottom: 0.625rem; }
.info-group strong { color: #0f172a; font-weight: 600; width: 140px; display: inline-block; }

.documents-section h3 { font-size: 1.125rem; font-weight: 800; color: #0f172a; margin-bottom: 1.5rem; }
.docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1.5rem; }

.document-card {
  background: #f8fafc; border-radius: 20px; overflow: hidden;
  border: 1px solid #f1f5f9; transition: all 0.2s;
}
.document-card:hover { border-color: #2b69ad; box-shadow: 0 10px 15px -3px rgba(43, 105, 173, 0.1); }

.doc-preview {
  height: 140px; background: #e2e8f0; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 0.75rem;
}
.doc-icon { color: #64748b; }
.view-doc-link { font-size: 0.8125rem; font-weight: 700; color: #2b69ad; text-decoration: none; padding: 0.5rem 1rem; background: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }

.doc-info { padding: 1.25rem; }
.doc-type { display: block; font-weight: 800; font-size: 0.75rem; text-transform: uppercase; color: #64748b; margin-bottom: 0.5rem; }
.doc-desc { font-size: 0.875rem; color: #334155; line-height: 1.5; margin-bottom: 1rem; height: 2.625rem; overflow: hidden; }

.doc-status { display: flex; align-items: center; gap: 0.5rem; font-size: 0.75rem; font-weight: 700; color: #f59e0b; }
.doc-status.verified { color: #10b981; }

.no-docs-empty { text-align: center; padding: 3rem; background: #f8fafc; border-radius: 20px; color: #94a3b8; font-style: italic; }

.modal-footer { padding: 1.5rem 2.5rem; background: #f8fafc; border-top: 1px solid #f1f5f9; }
.verify-actions { display: flex; gap: 1rem; justify-content: flex-end; }

.btn-reject { padding: 0.875rem 1.5rem; border: none; background: white; border: 1px solid #e2e8f0; border-radius: 14px; font-weight: 700; color: #ef4444; cursor: pointer; transition: all 0.2s; }
.btn-reject:hover { background: #fef2f2; border-color: #fca5a5; }

.btn-validate { padding: 0.875rem 2rem; border: none; background: #2b69ad; border-radius: 14px; font-weight: 700; color: white; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px rgba(43, 105, 173, 0.25); }
.btn-validate:hover { background: #1d4d82; transform: translateY(-2px); box-shadow: 0 6px 20px rgba(43, 105, 173, 0.35); }

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 5rem 2rem; color: #94a3b8;
}
.empty-icon { font-size: 3rem; margin-bottom: 1rem; }

/* Mobile Cards */
.mobile-cards { display: none; }

@media (max-width: 1024px) {
  .main-content { margin-left: 0; padding: 1.5rem 1rem; }
  .mobile-header { display: flex; }
  .pro-info-grid { grid-template-columns: 1fr; gap: 1.5rem; }
  .modal-card { border-radius: 0; max-height: 100vh; height: 100%; }
  .modal-content { padding: 1.5rem; }
  .stats-container { grid-template-columns: 1fr; }
  
  /* Table Responsiveness */
  .table-wrapper {
    overflow: visible !important;
    -webkit-overflow-scrolling: touch;
    margin: 0 -1rem;
    padding: 0 1rem;
  }
  
  .admin-table { display: none; }
  
  .mobile-cards { 
    display: grid; 
    grid-template-columns: repeat(2, 1fr); 
    gap: 0.75rem; 
    padding: 0.5rem;
    padding-bottom: 120px; /* Generous padding to prevent bottom cut-off */
  }

  @media (max-width: 640px) {
    .mobile-cards {
      grid-template-columns: 1fr; /* Stack cards on small screens to avoid horizontal cutting */
    }
  }
  
  .mobile-pro-card {
    background: white;
    border-radius: 16px;
    padding: 1rem;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s;
    height: 100%;
    text-align: left;
    position: relative;
    overflow: hidden;
  }
  
  .mobile-pro-card:active { transform: scale(0.98); background: #f8fafc; }
  
  .mobile-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    width: 100%;
    margin-bottom: 0.75rem;
    gap: 0.5rem;
  }
  
  .mobile-user-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    min-width: 0;
  }
  
  .mobile-user-info .user-avatar-small {
    width: 42px; 
    height: 42px;
    font-size: 1rem;
    margin-bottom: 0;
    flex-shrink: 0;
    border-radius: 12px;
    background: #f0f7ff;
    color: #2b69ad;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .mobile-user-info .user-name { 
    font-size: 0.9rem; 
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 700;
    color: #0f172a;
    display: block;
  }
  
  .mobile-user-info .user-email { 
    display: block; 
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 0.1rem;
  }
  
  .mobile-card-header .status-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
    margin-top: 0;
    border-radius: 8px;
    flex-shrink: 0;
  }
  
  .mobile-card-body {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: auto;
    padding-top: 0.75rem;
    border-top: 1px solid #f1f5f9;
  }

  .mobile-card-body .info-row {
    font-size: 0.75rem;
    justify-content: flex-start;
    gap: 0.25rem;
    display: flex;
    align-items: center;
  }
  
  .mobile-card-body .info-row .label { font-weight: 500; color: #64748b; }
  .mobile-card-body .info-row .value { font-weight: 600; color: #334155; }
  
  .mobile-logo-img {
    height: 32px;
    width: auto;
    object-fit: contain;
  }
}

.empty-state {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 5rem 2rem; color: #94a3b8;
}
.empty-icon { font-size: 3rem; margin-bottom: 1rem; }
</style>
