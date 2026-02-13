<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getApiUrl } from '../../config/api';
import { storage } from '../../utils/storage';

interface Patient {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Service {
  id: number;
  name: string;
}

interface Professional {
  id: number;
  name: string;
  email: string;
  phone: string;
  speciality: string;
}

interface Assignment {
  professionalId: number;
  professionalName: string;
  status: string;
  distance: number;
}

interface DetailedRequest {
  requestId: number;
  status: string;
  totalPrice: number;
  createdAt: string;
  patient: Patient;
  service: Service;
  acceptedProfessional: Professional;
  distance: number;
  allAssignments: Assignment[];
}

const requests = ref<DetailedRequest[]>([]);
const isLoading = ref(true);
const searchTerm = ref('');
const statusFilter = ref('all');
const proTotals = ref<Record<number, number>>({});

const computeTotalForPro = (proId: number) => {
  const total = requests.value
    .filter(req => req.acceptedProfessional?.id === proId)
    .reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
  proTotals.value[proId] = total;
};

const fetchDetailedRequests = async () => {
  const token = storage.getItem('access_token');
  if (!token) return;

  try {
    isLoading.value = true;
    const response = await fetch('/api/admin/requests/detailed', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      requests.value = await response.json();
    }
  } catch (err) {
    console.error('Failed to fetch detailed requests:', err);
  } finally {
    isLoading.value = false;
  }
};

onMounted(fetchDetailedRequests);

const filteredRequests = computed(() => {
  return requests.value.filter(req => {
    const matchesSearch = 
      req.patient?.name?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      req.acceptedProfessional?.name?.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
      req.service?.name?.toLowerCase().includes(searchTerm.value.toLowerCase());
    
    const matchesStatus = statusFilter.value === 'all' || 
      req.status?.toUpperCase() === statusFilter.value.toUpperCase() ||
      (statusFilter.value === 'COMPLETED' && req.status?.toUpperCase() === 'DONE');
    
    return matchesSearch && matchesStatus;
  });
});

const stats = computed(() => {
  const totalRev = requests.value.reduce((acc, curr) => acc + (curr.totalPrice || 0), 0);
  const totalReqs = requests.value.length;
  const avgReq = totalReqs > 0 ? (totalRev / totalReqs) : 0;
  
  return [
    { label: 'Revenu Total', value: `${totalRev.toLocaleString()} DT`, icon: '💰', color: '#10b981' },
    { label: 'Demandes Totales', value: totalReqs, icon: '📊', color: '#2b69ad' },
    { label: 'Moyenne / Demande', value: `${avgReq.toFixed(2)} DT`, icon: '📈', color: '#f59e0b' }
  ];
});

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const translateStatus = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACCEPTED': return 'Accepté';
    case 'DONE':
    case 'COMPLETED': return 'Terminé';
    case 'PENDING': return 'En attente';
    case 'REJECTED': return 'Rejeté';
    case 'CANCELLED': return 'Annulé';
    case 'VALIDATED': return 'Validé';
    default: return status || 'N/A';
  }
};

const getStatusBadgeClass = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACCEPTED': return 'status-accepted';
    case 'DONE':
    case 'COMPLETED': return 'status-completed';
    case 'PENDING': return 'status-pending';
    case 'REJECTED': return 'status-rejected';
    case 'CANCELLED': return 'status-cancelled';
    default: return '';
  }
};
</script>

<template>
  <div class="detailed-requests-container">
    <header class="page-header">
      <div class="header-titles">
        <h1>Audit de Facturation</h1>
        <p>Analyse détaillée des revenus et des affectations professionnelles</p>
      </div>
      <button class="btn-refresh" @click="fetchDetailedRequests" :disabled="isLoading">
        <span :class="{ spinning: isLoading }">🔄</span>
        Actualiser les données
      </button>
    </header>

    <!-- Summary Stats -->
    <div class="stats-grid">
      <div v-for="stat in stats" :key="stat.label" class="stat-card">
        <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
          {{ stat.icon }}
        </div>
        <div class="stat-info">
          <span class="stat-label">{{ stat.label }}</span>
          <span class="stat-value">{{ stat.value }}</span>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input 
          v-model="searchTerm" 
          type="text" 
          placeholder="Rechercher un patient, pro ou service..."
        />
      </div>
      <div class="filter-group">
        <select v-model="statusFilter" class="status-select">
          <option value="all">Tous les statuts</option>
          <option value="ACCEPTED">Accepté</option>
          <option value="COMPLETED">Terminé</option>
          <option value="PENDING">En attente</option>
          <option value="REJECTED">Rejeté</option>
          <option value="CANCELLED">Annulé</option>
        </select>
      </div>
    </div>

    <!-- Data Display -->
    <div v-if="isLoading" class="loading-state">
      <div class="loader"></div>
      <p>Chargement de l'audit...</p>
    </div>

    <div v-else-if="filteredRequests.length > 0" class="requests-list">
      <div v-for="req in filteredRequests" :key="req.requestId" class="request-audit-card">
        <div class="card-header">
          <div class="req-id">#{{ req.requestId }}</div>
          <div class="req-date">{{ formatDate(req.createdAt) }}</div>
          <div :class="['status-pill', getStatusBadgeClass(req.status)]">{{ translateStatus(req.status) }}</div>
        </div>

        <div class="card-body">
          <div class="info-section main-info">
            <div class="service-name">{{ req.service?.name }}</div>
            <div class="total-price">{{ req.totalPrice }} DT</div>
          </div>

          <div class="details-grid">
            <!-- Patient Column -->
            <div class="detail-col">
              <label>Patient</label>
              <div class="person-info">
                <span class="name">{{ req.patient?.name }}</span>
                <span class="sub">{{ req.patient?.email }}</span>
                <span class="sub">{{ req.patient?.phone }}</span>
              </div>
              <div class="address-tiny">{{ req.patient?.address }}</div>
            </div>

            <!-- Professional Column -->
            <div class="detail-col">
              <label>Professionnel Assigné</label>
              <div v-if="req.acceptedProfessional" class="person-info pro">
                <span class="name">{{ req.acceptedProfessional.name }}</span>
                <span class="sub speciality">{{ req.acceptedProfessional.speciality }}</span>
                <span class="sub">{{ req.acceptedProfessional.email }}</span>
                
                <div class="pro-revenue-tool">
                  <button 
                    v-if="proTotals[req.acceptedProfessional.id] === undefined"
                    class="btn-calc-total"
                    @click="computeTotalForPro(req.acceptedProfessional.id)"
                  >
                    📊 Somme des revenus
                  </button>
                  <div v-else class="computed-total">
                    Total Pro: <strong>{{ proTotals[req.acceptedProfessional.id]?.toLocaleString() }} DT</strong>
                    <button class="btn-reset-calc" title="Réinitialiser" @click="delete proTotals[req.acceptedProfessional.id]">✕</button>
                  </div>
                </div>
              </div>
              <div v-else class="no-pro">Aucun professionnel assigné</div>
              <div class="distance-info" v-if="req.distance !== undefined">
                📍 Distance: <strong>{{ req.distance }}km</strong>
              </div>
            </div>

            <!-- Assignments Table -->
            <div class="detail-col assignments">
              <label>Historique des Assignations ({{ req.allAssignments?.length || 0 }})</label>
              <div class="assignments-mini-list">
                <div v-for="(assign, idx) in req.allAssignments" :key="idx" class="assign-item">
                  <span class="assign-name">{{ assign.professionalName }}</span>
                  <span class="assign-dist">{{ assign.distance }}km</span>
                  <span :class="['assign-status', assign.status?.toLowerCase()]">{{ translateStatus(assign.status) }}</span>
                </div>
                <div v-if="!req.allAssignments?.length" class="empty-assign">Aucune assignation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty-audit">
      <div class="empty-icon">📂</div>
      <h3>Aucune donnée trouvée</h3>
      <p>Ajustez vos filtres ou effectuez une nouvelle recherche.</p>
    </div>
  </div>
</template>

<style scoped>
.detailed-requests-container {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.header-titles h1 {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.25rem 0;
  letter-spacing: -0.025em;
}

.header-titles p {
  color: #64748b;
  font-size: 0.95rem;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.btn-refresh:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}

.spinning {
  display: inline-block;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #64748b;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
}

/* Filters */
.filters-bar {
  display: flex;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.search-box {
  flex: 1;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #94a3b8;
}

.search-box input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: white;
  font-size: 0.95rem;
}

.status-select {
  padding: 0.75rem 1rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  background: white;
  font-weight: 600;
  color: #475569;
  min-width: 180px;
}

/* Audit Cards */
.requests-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.request-audit-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #f1f5f9;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.02);
  transition: transform 0.2s, box-shadow 0.2s;
}

.request-audit-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.04);
}

.card-header {
  padding: 1rem 1.5rem;
  background: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.req-id {
  font-weight: 800;
  color: #2b69ad;
  font-size: 0.9rem;
}

.req-date {
  font-size: 0.85rem;
  color: #64748b;
  font-weight: 500;
  margin-right: auto;
}

.card-body {
  padding: 1.5rem;
}

.main-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px dashed #e2e8f0;
}

.service-name {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1e293b;
}

.total-price {
  font-size: 1.5rem;
  font-weight: 900;
  color: #10b981;
  background: #f0fdf4;
  padding: 0.25rem 1rem;
  border-radius: 12px;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr;
  gap: 2rem;
}

.detail-col label {
  display: block;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  margin-bottom: 0.75rem;
}

.person-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.person-info .name {
  font-weight: 700;
  color: #0f172a;
  font-size: 1rem;
}

.person-info .sub {
  font-size: 0.85rem;
  color: #64748b;
}

.speciality {
  color: #2b69ad !important;
  font-weight: 600;
}

.address-tiny {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.5rem;
  line-height: 1.4;
}

.distance-info {
  margin-top: 0.75rem;
  font-size: 0.85rem;
  color: #475569;
}

.pro-revenue-tool {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f1f5f9;
}

.btn-calc-total {
  background: #f0f7ff;
  color: #2b69ad;
  border: 1px solid #c0d9f2;
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  text-align: left;
}

.btn-calc-total:hover {
  background: #2b69ad;
  color: white;
  border-color: #2b69ad;
}

.computed-total {
  background: #f0fdf4;
  color: #166534;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #bbf7d0;
}

.btn-reset-calc {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0 0.25rem;
  font-size: 0.9rem;
  margin-left: 0.5rem;
}

.btn-reset-calc:hover {
  color: #ef4444;
}

/* Assignments */
.assignments-mini-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 120px;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.assign-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 0.8rem;
}

.assign-name {
  font-weight: 600;
  flex: 1;
}

.assign-dist {
  color: #64748b;
}

.assign-status {
  font-weight: 700;
  text-transform: uppercase;
  font-size: 0.65rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
}

.assign-status.accepted { background: #dcfce7; color: #15803d; }
.assign-status.refused, .assign-status.rejected { background: #fee2e2; color: #991b1b; }
.assign-status.pending { background: #fef3c7; color: #92400e; }
.assign-status.done, .assign-status.completed { background: #eff6ff; color: #1e40af; }
.assign-status.cancelled { background: #f1f5f9; color: #64748b; }

/* Badges */
.status-pill {
  padding: 0.25rem 0.75rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.status-accepted { background: #dcfce7; color: #15803d; }
.status-completed { background: #eff6ff; color: #1e40af; }
.status-pending { background: #fef3c7; color: #92400e; }
.status-cancelled { background: #f1f5f9; color: #64748b; }
.status-rejected { background: #fee2e2; color: #991b1b; }

/* Loading & Empty */
.loading-state {
  text-align: center;
  padding: 4rem;
}

.loader {
  width: 48px;
  height: 48px;
  border: 5px solid #f1f5f9;
  border-top-color: #2b69ad;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

.empty-audit {
  text-align: center;
  padding: 5rem;
  background: white;
  border-radius: 32px;
  border: 2px dashed #e2e8f0;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1.5rem;
}

@media (max-width: 1024px) {
  .details-grid {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
}

@media (max-width: 768px) {
  .details-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-bar {
    flex-direction: column;
  }
  
  .header-titles h1 {
    font-size: 1.5rem;
  }
}
</style>
