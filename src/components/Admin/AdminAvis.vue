<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getApiUrl } from '../../config/api';
import { storage } from '../../utils/storage';

const avisList = ref<any[]>([]);
const isLoading = ref(false);

const fetchAvis = async () => {
  isLoading.value = true;
  const token = storage.getItem('access_token');
  try {
    const res = await fetch(getApiUrl('/avis?onlyApproved=false'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    });
    if (res.ok) {
      avisList.value = await res.json();
    }
  } catch (err) {
    console.error('Error fetching avis:', err);
  } finally {
    isLoading.value = false;
  }
};

const toggleApproval = async (id: number, currentStatus: boolean) => {
  const token = storage.getItem('access_token');
  try {
    const res = await fetch(getApiUrl(`/avis/${id}/approve?approved=${!currentStatus}`), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    });
    if (res.ok) {
      await fetchAvis();
    }
  } catch (err) {
    console.error('Error toggling approval:', err);
  }
};

const deleteAvis = async (id: number) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return;
  
  const token = storage.getItem('access_token');
  try {
    const res = await fetch(getApiUrl(`/avis/${id}`), {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    });
    if (res.ok) {
      await fetchAvis();
    }
  } catch (err) {
    console.error('Error deleting avis:', err);
  }
};

onMounted(fetchAvis);
</script>

<template>
  <div class="admin-avis">
    <div class="card-header">
      <div class="header-main">
        <h3>Gestion des Avis</h3>
        <p class="subtitle">{{ avisList.length }} avis au total</p>
      </div>
      <button class="refresh-btn" @click="fetchAvis" :disabled="isLoading">
        <svg :class="{ 'spinning': isLoading }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
        {{ isLoading ? 'Chargement...' : 'Actualiser' }}
      </button>
    </div>

    <div class="table-wrapper admin-card">
      <table v-if="avisList.length > 0" class="admin-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Avis</th>
            <th>Note</th>
            <th>Recommande</th>
            <th>Date</th>
            <th>Statut</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="avis in avisList" :key="avis.id" class="avis-row">
            <td>
              <div class="user-info">
                <div class="user-avatar-small">{{ avis.patient?.firstname?.charAt(0).toUpperCase() || 'P' }}</div>
                <div class="user-details">
                  <span class="user-name">{{ avis.patient?.firstname }} {{ avis.patient?.lastname }}</span>
                  <span class="user-phone">{{ avis.phoneNumber || avis.patient?.phone }}</span>
                </div>
              </div>
            </td>
            <td>
              <div class="avis-content">
                <span class="avis-title">{{ avis.title }}</span>
                <p class="avis-comment">{{ avis.comment }}</p>
              </div>
            </td>
            <td>
              <div class="rating-badge">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#fbbf24" width="14" height="14">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span>{{ avis.rating }}/5</span>
              </div>
            </td>
            <td>
              <span :class="['recommend-pill', avis.wouldRecommend ? 'yes' : 'no']">
                {{ avis.wouldRecommend ? 'Oui' : 'Non' }}
              </span>
            </td>
            <td>
              <span class="date-text">{{ new Date(avis.createdAt).toLocaleDateString() }}</span>
            </td>
            <td>
              <span :class="['status-badge', avis.isApproved ? 'approved' : 'pending']">
                {{ avis.isApproved ? 'Approuvé' : 'En attente' }}
              </span>
            </td>
            <td class="text-right">
              <div class="table-actions">
                <button 
                  :class="['action-btn', avis.isApproved ? 'reject-btn' : 'approve-btn']"
                  @click="toggleApproval(avis.id, avis.isApproved)"
                  :title="avis.isApproved ? 'Désapprouver' : 'Approuver'"
                >
                  <svg v-if="!avis.isApproved" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </button>
                <button class="action-btn delete-btn" @click="deleteAvis(avis.id)" title="Supprimer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-else-if="!isLoading" class="empty-state">
        <div class="empty-icon">⭐</div>
        <p>Aucun avis trouvé.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-avis {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-header h3 {
  font-size: 1.375rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.subtitle {
  color: #64748b;
  font-size: 0.9375rem;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.625rem 1.125rem;
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  transition: all 0.2s;
}

.refresh-btn:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.admin-card {
  background: white;
  padding: 2rem;
  border-radius: 28px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);
  border: 1px solid #f1f5f9;
}

.table-wrapper {
  overflow-x: auto;
}

.admin-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 0.75rem;
}

.admin-table th {
  padding: 0.75rem;
  color: #64748b;
  font-weight: 700;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
}

.admin-table td {
  padding: 1rem 0.75rem;
  vertical-align: middle;
}

.avis-row:hover td {
  background: #f8fafc;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-avatar-small {
  width: 40px;
  height: 40px;
  background: #f0f7ff;
  color: #2b69ad;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
}

.user-name {
  display: block;
  font-weight: 700;
  color: #0f172a;
  font-size: 0.9rem;
}

.user-phone {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.avis-content {
  max-width: 300px;
}

.avis-title {
  display: block;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.25rem;
}

.avis-comment {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
  line-height: 1.4;
}

.rating-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  background: #fef3c7;
  color: #d97706;
  padding: 0.25rem 0.625rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.85rem;
}

.recommend-pill {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
}

.recommend-pill.yes { background: #dcfce7; color: #166534; }
.recommend-pill.no { background: #f1f5f9; color: #475569; }

.date-text {
  font-size: 0.85rem;
  color: #64748b;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.375rem 0.75rem;
  border-radius: 99px;
}

.status-badge.approved { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.status-badge.pending { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

.text-right { text-align: right; }

.table-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.approve-btn { color: #10b981; }
.approve-btn:hover { background: #f0fdf4; border-color: #10b981; }

.reject-btn { color: #f59e0b; }
.reject-btn:hover { background: #fffbeb; border-color: #f59e0b; }

.delete-btn { color: #ef4444; }
.delete-btn:hover { background: #fef2f2; border-color: #ef4444; }

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
  color: #94a3b8;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}
</style>
