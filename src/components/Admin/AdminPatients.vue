<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { storage } from '../../utils/storage';

interface Patient {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  civility: string;
  birthdate: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  isBanned?: boolean; // May not be in the list, but we keep the logic
  createdAt: string;
}

const patients = ref<Patient[]>([]);
const isLoading = ref(false);
const searchQuery = ref('');
const errorMessage = ref('');
const successMessage = ref('');
const selectedPatient = ref<Patient | null>(null);

const fetchPatients = async () => {
  const token = storage.getItem('access_token');
  if (!token) return;

  try {
    isLoading.value = true;
    errorMessage.value = '';
    const response = await fetch('/api/patients', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      }
    });

    if (response.ok) {
      patients.value = await response.json();
    } else {
      throw new Error('Échec du chargement des patients');
    }
  } catch (err: any) {
    console.error('Failed to fetch patients:', err);
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const handleBanToggle = async (patient: Patient) => {
  const token = storage.getItem('access_token');
  if (!token) return;

  if (!confirm(`Voulez-vous vraiment ${patient.isBanned ? 'débloquer' : 'bloquer'} ce patient ?`)) return;

  try {
    const response = await fetch(`/api/admin/users/${patient.id}/ban`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({ ban: !patient.isBanned })
    });

    if (response.ok) {
      patient.isBanned = !patient.isBanned;
      successMessage.value = `Patient ${patient.isBanned ? 'bloqué' : 'débloqué'} avec succès.`;
      setTimeout(() => successMessage.value = '', 3000);
    } else {
      throw new Error('Opération échouée. L\'ID du patient correspond peut-être à une table différente de celle des utilisateurs.');
    }
  } catch (err: any) {
    console.error('Ban error:', err);
    errorMessage.value = err.message;
  }
};

const openInGoogleMaps = (lat: number, lng: number) => {
  if (lat && lng) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }
};

const filteredPatients = computed(() => {
  if (!searchQuery.value) return patients.value;
  const query = searchQuery.value.toLowerCase();
  return patients.value.filter(p => 
    p.firstname?.toLowerCase().includes(query) || 
    p.lastname?.toLowerCase().includes(query) || 
    p.email?.toLowerCase().includes(query) ||
    p.phone?.includes(query)
  );
});

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

onMounted(fetchPatients);
</script>

<template>
  <div class="admin-patients">
    <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }} <button @click="errorMessage = ''">×</button></div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }} <button @click="successMessage = ''">×</button></div>

    <div class="grid-card full-width">
      <div class="card-header">
        <div class="header-main">
          <h3>Gestion des Patients</h3>
          <p class="subtitle">{{ patients.length }} patients enregistrés</p>
        </div>
        <div class="header-actions">
          <div class="search-bar">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" v-model="searchQuery" placeholder="Rechercher un patient..." />
          </div>
          <button class="refresh-btn" @click="fetchPatients" :disabled="isLoading">
            <svg :class="{ 'spinning': isLoading }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {{ isLoading ? 'Chargement...' : 'Actualiser' }}
          </button>
        </div>
      </div>

      <div class="table-wrapper admin-card">
        <table v-if="filteredPatients.length > 0" class="admin-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Contact</th>
              <th>Date d'inscription</th>
              <th>Localisation</th>
              <th>Statut</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="patient in filteredPatients" :key="patient.id" class="pro-row">
              <td>
                <div class="user-info">
                  <div class="user-avatar-small">{{ patient.firstname?.[0] || '?' }}</div>
                  <div class="user-details">
                    <span class="user-name">{{ patient.civility }} {{ patient.firstname }} {{ patient.lastname }}</span>
                    <span class="user-id">ID: #{{ patient.id }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="contact-info">
                  <span class="user-email">{{ patient.email }}</span>
                  <span class="user-phone">{{ patient.phone || 'N/A' }}</span>
                </div>
              </td>
              <td>
                <span class="date-val">{{ formatDate(patient.createdAt) }}</span>
              </td>
              <td>
                <div class="location-cell">
                  <span class="address-text" :title="patient.address || ''">
                    {{ patient.address || '—' }}
                  </span>
                  <button v-if="patient.latitude && patient.longitude" class="mini-map-btn" @click.stop="openInGoogleMaps(patient.latitude, patient.longitude)" title="Voir sur Maps">
                    📍
                  </button>
                </div>
              </td>
              <td>
                <span :class="['status-badge', patient.isBanned ? 'status-rejected' : 'status-validated']">
                  {{ patient.isBanned ? 'Bloqué' : 'Actif' }}
                </span>
              </td>
              <td class="text-right">
                <div class="table-actions">
                  <button class="action-btn view-btn" @click="selectedPatient = patient" title="Voir détails">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button 
                    class="action-btn ban-btn" 
                    :class="{ 'unban': patient.isBanned }"
                    @click="handleBanToggle(patient)" 
                    :title="patient.isBanned ? 'Débloquer' : 'Bloquer'"
                  >
                    <svg v-if="!patient.isBanned" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else-if="!isLoading" class="empty-state">
          <div class="empty-icon">👥</div>
          <p>Aucun patient trouvé.</p>
        </div>
      </div>
    </div>

    <!-- Patient Detail Modal -->
    <div v-if="selectedPatient" class="modal-overlay" @click.self="selectedPatient = null">
      <div class="modal-card">
        <header class="modal-header">
          <div class="modal-title-area">
            <h2>Fiche Patient #{{ selectedPatient.id }}</h2>
            <span :class="['status-badge', selectedPatient.isBanned ? 'status-rejected' : 'status-validated']">
              {{ selectedPatient.isBanned ? 'Compte bloqué' : 'Compte actif' }}
            </span>
          </div>
          <button class="close-btn" @click="selectedPatient = null">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>

        <div class="modal-content">
          <div class="pro-info-grid">
            <div class="info-group">
              <label>Identité</label>
              <p><strong>Civilité:</strong> {{ selectedPatient.civility }}</p>
              <p><strong>Prénom:</strong> {{ selectedPatient.firstname }}</p>
              <p><strong>Nom:</strong> {{ selectedPatient.lastname }}</p>
              <p><strong>Date de naissance:</strong> {{ formatDate(selectedPatient.birthdate) }}</p>
            </div>
            <div class="info-group">
              <label>Coordonnées</label>
              <p><strong>Email:</strong> {{ selectedPatient.email }}</p>
              <p><strong>Téléphone:</strong> {{ selectedPatient.phone || 'Non renseigné' }}</p>
              <p><strong>Inscription:</strong> {{ formatDate(selectedPatient.createdAt) }}</p>
            </div>
            <div class="info-group full-width">
              <label>Localisation</label>
              <div class="address-box">
                <p><strong>Adresse:</strong> {{ selectedPatient.address || 'Non spécifiée' }}</p>
                <button v-if="selectedPatient.latitude && selectedPatient.longitude" class="map-link-btn" @click="openInGoogleMaps(selectedPatient.latitude, selectedPatient.longitude)">
                   🗺️ Voir sur Google Maps ↗
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <footer class="modal-footer">
          <button 
            class="footer-ban-btn" 
            :class="{ 'is-banned': selectedPatient.isBanned }"
            @click="handleBanToggle(selectedPatient)"
          >
            {{ selectedPatient.isBanned ? 'Débloquer le compte patient' : 'Bloquer le compte patient' }}
          </button>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-patients {
  width: 100%;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  padding: 0.5rem 1rem;
  border-radius: 14px;
  width: 300px;
  transition: all 0.2s;
}

.search-bar:focus-within {
  border-color: #2b69ad;
  box-shadow: 0 0 0 3px rgba(43, 105, 173, 0.1);
}

.search-bar input {
  border: none;
  outline: none;
  width: 100%;
  font-size: 0.875rem;
  color: #0f172a;
}

.search-bar svg {
  color: #94a3b8;
}

.contact-info {
  display: flex;
  flex-direction: column;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.location-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mini-map-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.2rem 0.4rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.mini-map-btn:hover {
  background: #e2e8f0;
  transform: scale(1.1);
}

.address-box {
  background: #f8fafc;
  padding: 1rem;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
}

.map-link-btn {
  margin-top: 0.75rem;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #2b69ad;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.map-link-btn:hover {
  background: #f0f7ff;
  border-color: #2b69ad;
}

.ban-btn {
  background: #fff1f2 !important;
  color: #be123c !important;
  border: 1px solid #ffe4e6 !important;
}

.ban-btn:hover {
  background: #be123c !important;
  color: white !important;
}

.ban-btn.unban {
  background: #f0fdf4 !important;
  color: #15803d !important;
  border: 1px solid #dcfce7 !important;
}

.ban-btn.unban:hover {
  background: #15803d !important;
  color: white !important;
}

.footer-ban-btn {
  width: 100%;
  padding: 1rem;
  border-radius: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff1f2;
  color: #be123c;
  border: 1px solid #ffe4e6;
}

.footer-ban-btn:hover {
  background: #be123c;
  color: white;
}

.footer-ban-btn.is-banned {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #dcfce7;
}

.footer-ban-btn.is-banned:hover {
  background: #15803d;
  color: white;
}

.modal-footer {
  padding: 1.5rem 2.5rem;
  border-top: 1px solid #f1f5f9;
}

/* Common admin styles */
.grid-card {
  background: white; padding: 2rem; border-radius: 28px;
  box-shadow: 0 10px 25px -5px rgba(0,0,0,0.04);
  border: 1px solid #f1f5f9;
}
.full-width { grid-column: 1 / -1; }
.card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
@media (max-width: 768px) {
  .card-header { flex-direction: column; gap: 1rem; }
  .search-bar { width: 100%; }
  .header-actions { width: 100%; flex-direction: column; }
  .refresh-btn { width: 100%; justify-content: center; }
}

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

.table-wrapper { margin: 0 -0.5rem; }
.admin-table { width: 100%; border-collapse: separate; border-spacing: 0 0.75rem; }
.admin-table th { padding: 1rem; color: #64748b; font-weight: 700; font-size: 0.8125rem; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #f1f5f9; text-align: left; }
.admin-table td { padding: 1.25rem 1rem; background: transparent; border-bottom: 1px solid #f8fafc; vertical-align: middle; }

.pro-row:hover td { background: #f8fafc; }
.user-info { display: flex; align-items: center; gap: 1rem; }
.user-avatar-small {
  width: 44px; height: 44px; background: #f0f7ff;
  color: #2b69ad; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 1.125rem;
}
.user-name { display: block; font-weight: 700; color: #0f172a; font-size: 0.9375rem; }
.user-id { display: block; font-size: 0.75rem; color: #94a3b8; margin-top: 0.125rem; }
.user-email { display: block; font-weight: 600; color: #334155; font-size: 0.875rem; }
.user-phone { display: block; font-size: 0.8125rem; color: #64748b; margin-top: 0.125rem; }

.status-badge {
  padding: 0.375rem 0.875rem; border-radius: 9999px;
  font-size: 0.75rem; font-weight: 700; display: inline-flex;
}
.status-validated { background: #dcfce7; color: #15803d; border: 1.5px solid #bbf7d0; }
.status-rejected { background: #fff1f2; color: #be123c; border: 1.5px solid #ffe4e6; }

.action-btn {
  width: 38px; height: 38px; border-radius: 10px;
  border: 1px solid #e2e8f0; background: white;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #64748b; transition: all 0.2s;
}
.action-btn:hover { border-color: #2b69ad; color: #2b69ad; background: #f0f7ff; }

.table-actions { display: flex; gap: 0.5rem; justify-content: flex-end; }

.alert { padding: 1rem; border-radius: 12px; margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center; font-weight: 600; }
.alert-error { background: #fee2e2; color: #b91c1c; border: 1px solid #fecaca; }
.alert-success { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
.alert button { background: transparent; border: none; font-size: 1.25rem; cursor: pointer; color: inherit; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; color: #94a3b8; }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px); display: flex; align-items: center;
  justify-content: center; z-index: 1000; padding: 2rem;
}
.modal-card {
  background: white; width: 100%; max-width: 700px;
  max-height: 90vh; border-radius: 32px; overflow: hidden;
  display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
}
.modal-header { padding: 2rem; background: #ffffff; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.modal-title-area { display: flex; align-items: center; gap: 1.5rem; }
.modal-title-area h2 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
.close-btn { background: #f1f5f9; border: none; width: 44px; height: 44px; border-radius: 12px; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.close-btn:hover { background: rgba(43, 105, 173, 0.1); color: #2b69ad; }
.modal-content { padding: 2.5rem; overflow-y: auto; flex: 1; }

.pro-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; }
.info-group label { display: block; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 1rem; }
.info-group p { font-size: 0.9375rem; color: #334155; margin-bottom: 0.625rem; }
.info-group strong { color: #64748b; font-weight: 600; width: 140px; display: inline-block; }
.full-width { grid-column: 1 / -1; }

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.address-text {
  max-width: 250px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  color: #475569;
}

@media (max-width: 640px) {
  .pro-info-grid { grid-template-columns: 1fr; gap: 1.5rem; }
  .modal-card { height: 100%; max-height: 100vh; border-radius: 0; }
  .admin-table { display: block; overflow-x: auto; }
}
</style>
