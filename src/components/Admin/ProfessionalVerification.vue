<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getApiUrl } from '../../config/api';

import { storage } from '../../utils/storage';

const professionals = ref<any[]>([]);
const isLoading = ref(false);
const selectedPro = ref<any>(null);
const errorMessage = ref('');
const successMessage = ref('');
const alerts = ref<any[]>([]);
const allAlerts = ref<any[]>([]);
const alertComment = ref('');
const selectedDocIds = ref<number[]>([]);
const isSendingAlert = ref(false);
const statusFilter = ref('PENDING');

const filteredProfessionals = computed(() => {
  if (statusFilter.value === 'ALL') return professionals.value;
  if (statusFilter.value === 'PENDING') {
    return professionals.value.filter(p => p.status === 'PENDING');
  }
  if (statusFilter.value === 'ACCEPTED') {
    return professionals.value.filter(p => p.status === 'ACCEPTED' || p.status === 'VALIDATED');
  }
  return professionals.value;
});

const fetchAlerts = async (proId: number) => {
  const token = storage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(getApiUrl(`/alerts/professional/${proId}`), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      alerts.value = await response.json();
    }
  } catch (err) {
    console.error('Failed to fetch alerts:', err);
  }
};

const sendAlert = async () => {
  if (!selectedPro.value || selectedDocIds.value.length === 0 || !alertComment.value) {
    errorMessage.value = 'Veuillez sélectionner au moins un document et ajouter un commentaire.';
    return;
  }

  const token = storage.getItem('access_token');
  if (!token) return;

  try {
    isSendingAlert.value = true;
    const response = await fetch(getApiUrl('/alerts'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      },
      body: JSON.stringify({
        professionalId: selectedPro.value.id,
        documentIds: selectedDocIds.value,
        comment: alertComment.value,
        update: false
      })
    });

    if (response.ok) {
      // Alert stays in update: false until the professional submits their changes
      successMessage.value = 'Alerte envoyée avec succès.';
      alertComment.value = '';
      selectedDocIds.value = [];
      await fetchAlerts(selectedPro.value.id);
      await fetchProfessionals();
      setTimeout(() => successMessage.value = '', 3000);
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Échec de l\'envoi de l\'alerte.');
    }
  } catch (err: any) {
    console.error('Send alert error:', err);
    errorMessage.value = err.message;
  } finally {
    isSendingAlert.value = false;
  }
};

const toggleAlertUpdate = async (alert: any) => {
  const token = storage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(getApiUrl(`/alerts/${alert.id}/toggle-update`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      const updatedAlert = await response.json();
      
      // Update local modal state
      alert.update = updatedAlert.update;
      
      // Update global list state
      const idx = allAlerts.value.findIndex(a => a.id === alert.id);
      if (idx !== -1) {
        allAlerts.value[idx] = updatedAlert;
      } else {
        allAlerts.value.push(updatedAlert);
      }

      successMessage.value = `Alerte ${updatedAlert.update ? 'résolue' : 'réactivée'} avec succès.`;
      setTimeout(() => successMessage.value = '', 3000);
    } else {
      throw new Error('Échec de la mise à jour de l\'alerte.');
    }
  } catch (err: any) {
    console.error('Toggle alert error:', err);
    errorMessage.value = err.message;
  }
};

const handleSelectPro = async (pro: any) => {
  selectedPro.value = pro;
  alerts.value = [];
  alertComment.value = '';
  selectedDocIds.value = [];
  if (pro) {
    await fetchAlerts(pro.id);
  }
};

const fetchProfessionals = async () => {
  const token = storage.getItem('access_token');
  if (!token) return;

  try {
    isLoading.value = true;
    const response = await fetch(getApiUrl('/auth/professionals/documents'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      const data = await response.json();
      professionals.value = data;
      
      // Fetch alerts for each professional in parallel to populate the status column
      const fetchAlertPromises = professionals.value.map(async (pro) => {
        try {
          const alertsRes = await fetch(getApiUrl(`/alerts/professional/${pro.id}`), {
            headers: {
              'Authorization': `Bearer ${token}`,
              'accept': '*/*'
            }
          });
          if (alertsRes.ok) {
            return await alertsRes.json();
          }
        } catch (e) {
          console.warn(`Failed to fetch alerts for pro ${pro.id}:`, e);
        }
        return [];
      });

      const alertsResults = await Promise.all(fetchAlertPromises);
      allAlerts.value = alertsResults.flat();
    }
  } catch (err) {
    console.error('Failed to fetch professionals:', err);
    errorMessage.value = 'Erreur lors de la récupération des professionnels.';
  } finally {
    isLoading.value = false;
  }
};

const getProAlertStatus = (proId: number) => {
  const proAlerts = allAlerts.value.filter(a => a.professionalId === proId);
  if (proAlerts.length === 0) return 'NONE';
  
  // If ANY alert is in 'update: false', it means we are still waiting for professional updates (Priority)
  if (proAlerts.some(a => a.update === false)) return 'IN_PROGRESS';
  
  // Otherwise, if alerts exist and all are update: true, it means all updates are ready to verify
  return 'VERIFY';
};

const toggleDocumentVerification = async (docId: number, verified: boolean) => {
  const token = storage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(getApiUrl(`/documents/${docId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      },
      body: JSON.stringify({ verified })
    });

    if (response.ok) {
      if (selectedPro.value) {
        const doc = selectedPro.value.documents.find((d: any) => d.id === docId);
        if (doc) doc.verified = verified;

        // If unverifying and the pro is currently validated, demote to PENDING
        if (!verified && (selectedPro.value.status === 'ACCEPTED' || selectedPro.value.status === 'VALIDATED')) {
          try {
            const statusResponse = await fetch(getApiUrl(`/auth/admin/user/${selectedPro.value.id}`), {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'accept': '*/*'
              },
              body: JSON.stringify({ status: 'PENDING' })
            });
            if (statusResponse.ok) {
              selectedPro.value.status = 'PENDING';
              await fetchProfessionals(); // Keep list in sync
            }
          } catch (statusErr) {
            console.error('Failed to demote professional status:', statusErr);
          }
        }

        // AUTO-RESET ALERT: If unverifying, reset any 'resolved' alert to 'pending'
        if (!verified) {
          const resolvedAlert = alerts.value.find(a => a.update === true);
          if (resolvedAlert) {
            await toggleAlertUpdate(resolvedAlert);
          }
        }
      }
      successMessage.value = verified ? 'Document vérifié avec succès.' : 'Vérification retirée.';
      setTimeout(() => successMessage.value = '', 3000);
    } else {
      throw new Error(verified ? 'Échec de la vérification.' : 'Échec du retrait de vérification.');
    }
  } catch (err: any) {
    console.error('Toggle document verification error:', err);
    errorMessage.value = err.message;
  }
};

const updateProfessionalStatus = async (proId: number, status: string) => {
  const token = storage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(getApiUrl(`/auth/admin/user/${proId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      },
      body: JSON.stringify({ status: status === 'VALIDATED' ? 'ACCEPTED' : status })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Server error details:', errorData);
      throw new Error(errorData.message || 'Échec de la mise à jour du statut.');
    }

    successMessage.value = `Professionnel ${status === 'VALIDATED' ? 'validé' : 'rejeté'} avec succès.`;
    selectedPro.value = null;
    await fetchProfessionals();
    setTimeout(() => successMessage.value = '', 3000);
  } catch (err: any) {
    console.error('Update status error:', err);
    errorMessage.value = err.message;
  }
};

onMounted(fetchProfessionals);

const getStatusClass = (status: string) => {
  switch (status) {
    case 'VALIDATED':
    case 'ACCEPTED': return 'status-validated';
    case 'PENDING': return 'status-pending';
    case 'REJECTED': return 'status-rejected';
    default: return '';
  }
};

const isImage = (path: string) => {
  if (!path) return false;
  const ext = path.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '');
};
</script>

<template>
  <div class="verification-container">
    <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }} <button @click="errorMessage = ''">×</button></div>
    <div v-if="successMessage" class="alert alert-success">{{ successMessage }} <button @click="successMessage = ''">×</button></div>

    <div class="grid-card full-width">
      <div class="card-header">
        <div class="header-main">
          <h3>Vérification des Professionnels</h3>
          <p class="subtitle">{{ professionals.length }} professionnels enregistrés</p>
        </div>
        <div class="header-actions">
          <div class="filter-group">
            <button 
              :class="['filter-btn', { active: statusFilter === 'ALL' }]" 
              @click="statusFilter = 'ALL'"
            >
              Tous
            </button>
            <button 
              :class="['filter-btn', { active: statusFilter === 'PENDING' }]" 
              @click="statusFilter = 'PENDING'"
            >
              En attente
            </button>
            <button 
              :class="['filter-btn', { active: statusFilter === 'ACCEPTED' }]" 
              @click="statusFilter = 'ACCEPTED'"
            >
              Validés
            </button>
          </div>
          <button class="refresh-btn" @click="fetchProfessionals" :disabled="isLoading">
            <svg :class="{ 'spinning': isLoading }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
            {{ isLoading ? 'Chargement...' : 'Actualiser' }}
          </button>
        </div>
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
              <th>Alerte</th>
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
                <template v-if="getProAlertStatus(pro.id) === 'VERIFY'">
                  <div class="table-update-badge">
                    <span class="pulse"></span>
                    À vérifier
                  </div>
                </template>
                <template v-else-if="getProAlertStatus(pro.id) === 'IN_PROGRESS'">
                  <div class="table-progress-badge">
                    <span class="pulse-orange"></span>
                    En cours
                  </div>
                </template>
                <span v-else class="no-alert-info">—</span>
              </td>
              <td class="text-right">
                <div class="table-actions">
                  <button class="action-btn view-btn" @click="handleSelectPro(pro)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    Ouvrir
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else-if="!isLoading" class="empty-state">
          <div class="empty-icon">📂</div>
          <p v-if="statusFilter === 'ALL'">Aucun professionnel enregistré.</p>
          <p v-else-if="statusFilter === 'PENDING'">Aucun professionnel en attente de vérification.</p>
          <p v-else>Aucun professionnel validé.</p>
        </div>
        <div class="mobile-cards">
          <div v-for="pro in filteredProfessionals" :key="pro.id" class="mobile-pro-card" @click="handleSelectPro(pro)">
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
            </div>

            <div class="mobile-card-footer">
               <template v-if="getProAlertStatus(pro.id) === 'VERIFY'">
                  <div class="table-update-badge">
                    <span class="pulse"></span>
                    À vérifier
                  </div>
                </template>
                <template v-else-if="getProAlertStatus(pro.id) === 'IN_PROGRESS'">
                  <div class="table-progress-badge">
                    <span class="pulse-orange"></span>
                    En cours
                  </div>
                </template>
                 <button class="action-btn view-btn mobile-view-btn">
                    Ouvrir
                  </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Professional Detail Modal -->
    <div v-if="selectedPro" class="modal-overlay" @click.self="handleSelectPro(null)">
      <div class="modal-card">
        <header class="modal-header">
          <div class="modal-title-area">
            <h2>Profil de {{ selectedPro.name }}</h2>
            <span :class="['status-badge', getStatusClass(selectedPro.status)]">{{ selectedPro.status }}</span>
          </div>
          <button class="close-btn" @click="handleSelectPro(null)">
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
                  <img v-if="isImage(doc.filePath)" :src="getApiUrl(doc.filePath)" class="doc-image-preview" alt="Aperçu du document" />
                  <div v-else class="doc-icon">
                    <svg v-if="doc.type === 'ID_CARD'" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><circle cx="19" cy="11" r="2"/></svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </div>
                  <a :href="getApiUrl(doc.filePath)" target="_blank" class="view-doc-link">Ouvrir le document</a>
                </div>
                <div class="doc-info">
                  <div class="doc-header-row">
                    <span class="doc-type">{{ doc.type }}</span>
                    <button v-if="!doc.verified" class="btn-verify-doc" @click="toggleDocumentVerification(doc.id, true)">Vérifier</button>
                    <div v-else class="verified-group">
                      <span class="doc-verified-badge">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          Vérifié
                      </span>
                      <button class="btn-unverify-doc" @click="toggleDocumentVerification(doc.id, false)" title="Retirer la vérification">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>
                  <p class="doc-desc">{{ doc.description }}</p>
                </div>
              </div>
            </div>
            <div v-else class="no-docs-empty">
              Aucun document soumis.
            </div>
          </div>

          <!-- Alerts Section -->
          <div class="alerts-section">
            <div class="section-header">
              <h3>Historique des Alertes</h3>
              <span class="badge">{{ alerts.length }}</span>
            </div>
            
            <div v-if="alerts.length > 0" class="alerts-list">
              <div v-for="alert in alerts" :key="alert.id" class="alert-item">
                <div class="alert-item-header">
                  <div class="alert-main-info">
                    <span class="alert-date">{{ new Date(alert.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) }}</span>
                    <span class="update-badge" :class="{ updated: alert.update }">
                      {{ alert.update ? '✓ Mise à jour reçue' : '⌛ En cours' }}
                    </span>
                  </div>
                  <button 
                    class="btn-resolve-alert" 
                    :class="{ resolved: alert.update }"
                    @click="toggleAlertUpdate(alert)"
                    :title="alert.update ? 'Marquer comme en attente' : 'Marquer comme résolu'"
                  >
                    {{ alert.update ? 'Réactiver' : 'Résoudre' }}
                  </button>
                </div>
                <p class="alert-comment">{{ alert.comment }}</p>
                <div class="alert-docs">
                  <span v-for="docId in alert.unverifiedDocIds" :key="docId" class="mini-doc-tag">
                    ID Document: {{ docId }}
                  </span>
                </div>
              </div>
            </div>
            <div v-else class="no-alerts">
              Aucune alerte envoyée pour ce professionnel.
            </div>

            <!-- New Alert Form -->
            <div class="new-alert-form">
              <h4>Envoyer une nouvelle alerte de re-vérification</h4>
              <div class="form-group">
                <label>Sélectionner les documents à re-vérifier</label>
                <div class="doc-selection">
                  <label v-for="doc in selectedPro.documents" :key="doc.id" :class="['checkbox-label', { 'is-verified': doc.verified }]">
                    <input type="checkbox" :value="doc.id" v-model="selectedDocIds" :disabled="doc.verified">
                    <span class="check-custom"></span>
                    <span class="doc-selection-text">
                      {{ doc.type }} (ID: {{ doc.id }})
                      <span v-if="doc.verified" class="selection-verified-tag">Vérifié</span>
                    </span>
                  </label>
                </div>
              </div>
              <div class="form-group">
                <label>Commentaire / Instructions</label>
                <textarea 
                  v-model="alertComment" 
                  placeholder="Expliquez pourquoi ces documents nécessitent une re-vérification..."
                  rows="3"
                ></textarea>
              </div>
              <button 
                class="btn-send-alert" 
                @click="sendAlert" 
                :disabled="isSendingAlert || selectedDocIds.length === 0 || !alertComment"
              >
                {{ isSendingAlert ? 'Envoi...' : 'Envoyer l\'alerte' }}
              </button>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <div class="verify-actions">
            <button class="btn-reject" @click="updateProfessionalStatus(selectedPro.id, 'REJECTED')">Rejeter</button>
            <button class="btn-validate" @click="updateProfessionalStatus(selectedPro.id, 'VALIDATED')" :disabled="!selectedPro.documents.every((d: any) => d.verified)">
                Valider le profil
            </button>
          </div>
          <p v-if="!selectedPro.documents.every((d: any) => d.verified)" class="validation-hint">
            Tous les documents doivent être vérifiés avant de valider le profil.
          </p>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verification-container {
  width: 100%;
  font-family: 'Outfit', 'Inter', sans-serif;
  color: #1e293b;
  max-width: 1400px;
  margin: 0 auto;
}

/* Alerts */
.alert {
  padding: 1.25rem 1.5rem;
  border-radius: 20px;
  margin-bottom: 2.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

.alert-error { background: #fff1f2; color: #be123c; border: 1px solid #ffe4e6; }
.alert-success { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
.alert button { background: transparent; border: none; font-size: 1.5rem; cursor: pointer; color: inherit; line-height: 1; opacity: 0.6; transition: all 0.2s; }
.alert button:hover { opacity: 1; transform: scale(1.1); }

/* Header & Stats */
.card-header { 
  display: flex; justify-content: space-between; align-items: center; 
  margin-bottom: 3.5rem; 
  padding: 1rem 0;
}
.header-main h3 { 
  font-size: 2.5rem; font-weight: 800; color: #0f172a; 
  margin-bottom: 0.75rem; letter-spacing: -0.04em; 
  background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
  background-clip: text;
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.subtitle { color: #64748b; font-size: 1.125rem; font-weight: 500; display: flex; align-items: center; gap: 0.5rem; }
.subtitle::before { content: ""; width: 8px; height: 8px; background: #69aa62; border-radius: 50%; display: inline-block; box-shadow: 0 0 0 4px rgba(105, 170, 98, 0.1); }

.header-actions { display: flex; align-items: center; gap: 2rem; }

.filter-group { 
  display: flex; background: #f1f5f9; padding: 0.375rem; 
  border-radius: 18px; border: 1px solid #e2e8f0;
}

.filter-btn {
  padding: 0.625rem 1.25rem; border: none; background: transparent;
  color: #64748b; font-weight: 700; font-size: 0.875rem; 
  border-radius: 14px; cursor: pointer; transition: all 0.2s;
}
.filter-btn:hover { color: #0f172a; }
.filter-btn.active { background: white; color: #0f172a; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }

.refresh-btn {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.875rem 1.75rem; border: 1px solid #e2e8f0;
  background: #ffffff; border-radius: 16px; cursor: pointer;
  font-size: 1rem; font-weight: 600; color: #475569;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}
.refresh-btn:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); color: #0f172a; }
.refresh-btn:active { transform: translateY(0); }

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

/* Modern Table Layout */
.table-wrapper { 
  background: white;
  border-radius: 32px;
  border: 1px solid #f1f5f9;
  overflow: hidden; /* Changed from overflow-x: auto to handle both */
  box-shadow: 0 20px 40px -20px rgba(0,0,0,0.05);
}

.admin-table { width: 100%; border-collapse: collapse; }
.mobile-cards { display: none; }

@media (max-width: 1024px) {
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
    overflow: hidden; /* Ensure content doesn't bleed */
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
    min-width: 0; /* truncate text if needed */
  }
  
  .user-avatar-small {
    width: 42px; height: 42px;
    font-size: 1rem;
    margin-bottom: 0;
    flex-shrink: 0;
    border-radius: 12px;
    background: #f1f5f9;
    border: none;
    box-shadow: none;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .user-name { 
    font-size: 0.9rem; 
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 700;
    color: #0f172a;
  }
  
  .user-email { 
    display: block; 
    font-size: 0.75rem;
    color: #64748b;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 0.1rem;
  }
  
  .status-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.65rem;
    margin-top: 0;
    border-radius: 8px;
    flex-shrink: 0;
  }
  
  /* Show minimal body info */
  .mobile-card-body {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-top: auto;
    padding-top: 0.75rem;
    border-top: 1px solid #f1f5f9;
  }

  .info-row {
    font-size: 0.75rem;
    justify-content: flex-start;
    gap: 0.25rem;
    display: flex;
    align-items: center;
  }
  
  .info-row .label { font-weight: 500; color: #64748b; }
  .info-row .value { font-weight: 600; color: #334155; }

  .mobile-card-footer { display: none; }
}
.admin-table th { 
  padding: 1.5rem 2rem; background: #f8fafc;
  color: #64748b; font-weight: 700; font-size: 0.875rem; 
  text-transform: uppercase; letter-spacing: 0.1em; 
  border-bottom: 1px solid #f1f5f9; text-align: left;
}

.pro-row { transition: all 0.2s ease; cursor: default; }
.pro-row:hover { background: #fafafa; }
.pro-row td { 
  padding: 1rem 1.5rem; background: transparent; 
  border-bottom: 1px solid #f8fafc; vertical-align: middle; 
}

/* Sticky Actions Column */
.admin-table th:last-child,
.admin-table td:last-child {
  position: sticky;
  right: 0;
  background: white; /* Ensure content doesn't show through */
  z-index: 10;
  box-shadow: -4px 0 12px rgba(0,0,0,0.05); /* Shadow to indicate elevation */
}
.pro-row:hover td:last-child {
  background: #fafafa; /* Match hover state */
}

.user-info { display: flex; align-items: center; gap: 1.5rem; }
.user-avatar-small {
  width: 72px; height: 72px; 
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  color: #1e293b; border-radius: 24px;
  display: flex; align-items: center; justify-content: center;
  font-weight: 800; font-size: 1.75rem;
  border: 2px solid #ffffff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transition: transform 0.3s ease;
}
.pro-row:hover .user-avatar-small { transform: scale(1.05) rotate(-2deg); }

.user-name { display: block; font-weight: 800; color: #0f172a; font-size: 1.25rem; letter-spacing: -0.02em; }
.user-email { display: block; font-size: 1rem; color: #64748b; margin-top: 0.25rem; }

.spec-badge {
  background: #f0f7ff; padding: 0.625rem 1.25rem;
  border-radius: 14px; font-weight: 700; font-size: 1rem; color: #2b69ad;
  border: 1px solid #dbeafe;
}

.doc-count { 
  display: flex; align-items: center; gap: 0.5rem;
  font-weight: 700; font-size: 1.125rem; color: #2b69ad; 
}
.doc-count::before { content: "📄"; font-size: 1.25rem; }

.status-badge {
  padding: 0.75rem 1.5rem; border-radius: 16px;
  font-size: 0.8125rem; font-weight: 800; display: inline-flex;
  text-transform: uppercase; letter-spacing: 0.08em;
}
.status-validated { 
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); 
  color: #065f46; 
  border: 1.5px solid #6ee7b7; 
  box-shadow: 0 4px 12px rgba(5, 150, 105, 0.15);
}
.status-pending { 
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); 
  color: #92400e; 
  border: 1.5px solid #fbbf24; 
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.15);
}
.status-rejected { 
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); 
  color: #991b1b; 
  border: 1.5px solid #f87171; 
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.15);
}

.action-btn {
  width: 56px; height: 56px; border-radius: 20px;
  border: 1px solid #e2e8f0; background: #ffffff;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #475569; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
}
.action-btn:hover { border-color: #2b69ad; color: #2b69ad; transform: translateY(-3px); box-shadow: 0 12px 20px -8px rgba(43, 105, 173, 0.15); }
.view-btn { 
  width: auto; padding: 0 1.25rem; gap: 0.75rem;
  color: #2b69ad; background: #f0f9ff; border-color: #bae6fd; 
  font-weight: 700; font-size: 0.875rem;
}
.view-btn:hover { background: #2b69ad; color: white; border-color: #2b69ad; }

.table-actions { display: flex; justify-content: flex-end; }
.text-right { text-align: right; }

/* Modal Styling */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(12px); display: flex; align-items: center;
  justify-content: center; z-index: 1000; padding: 1.5rem;
  animation: fadeIn 0.4s ease-out;
}

.modal-card {
  background: #f8fafc; width: 100%; max-width: 1100px;
  max-height: 90vh; border-radius: 32px; overflow: hidden;
  display: flex; flex-direction: column; 
  box-shadow: 0 40px 100px -20px rgba(0,0,0,0.25);
  border: 1px solid #ffffff;
  animation: modalScale 0.4s cubic-bezier(0.19, 1, 0.22, 1);
}

.modal-header {
  padding: 1.5rem 2.5rem; background: #ffffff; border-bottom: 1px solid #f1f5f9;
  display: flex; justify-content: space-between; align-items: center;
  flex-shrink: 0;
}
.modal-title-area h2 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.02em; }

.close-btn { 
  background: #f1f5f9; border: none; width: 44px; height: 44px; 
  border-radius: 14px; cursor: pointer; color: #64748b; 
  display: flex; align-items: center; justify-content: center; transition: all 0.2s; 
}
.close-btn:hover { background: #0f172a; color: #ffffff; transform: rotate(90deg); }

.modal-content { padding: 2.5rem; overflow-y: auto; flex: 1; }

.pro-info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 3.5rem; }
.info-group { 
  background: #ffffff; padding: 1.75rem; border-radius: 24px;
  border: 1px solid #f1f5f9; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}
.info-group label { 
  display: block; font-size: 0.75rem; font-weight: 800; 
  text-transform: uppercase; color: #94a3b8; letter-spacing: 0.1em; margin-bottom: 1.25rem; 
}
.info-group p { font-size: 1rem; color: #334155; margin-bottom: 0.875rem; line-height: 1.4; display: flex; align-items: baseline; gap: 0.75rem; }
  /* Responsive Adjustments */
@media (max-width: 1024px) {
  .verification-container { padding: 0; }
  
  .header-main h3 { font-size: 1.75rem; }
  .card-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .header-actions { width: 100%; flex-direction: column; align-items: stretch; gap: 1rem; }
  .filter-group { width: 100%; overflow-x: auto; }
  .filter-btn { flex: 1; white-space: nowrap; }
  
  .table-wrapper { 
    margin: 0 -1rem; 
    padding: 0 1rem; 
    border-radius: 0; 
    border-left: none; 
    border-right: none; 
    overflow: visible !important;
  }
  
  .mobile-cards {
    padding-bottom: 80px; /* Add space at bottom to prevent cut-off */
  }
  
  .modal-card { max-height: 100vh; height: 100%; border-radius: 0; }
  .modal-header { padding: 1.5rem; }
  .modal-content { padding: 1.5rem; }
  
  .pro-info-grid { grid-template-columns: 1fr; gap: 1.5rem; }
  .docs-grid { grid-template-columns: 1fr; }
  
  .modal-footer { flex-direction: column; gap: 1rem; }
  .verify-actions { width: 100%; flex-direction: column; }
  .btn-reject, .btn-validate { width: 100%; }
}

.docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }

.document-card {
  background: #ffffff; border-radius: 24px; overflow: hidden;
  border: 1px solid #f1f5f9; transition: all 0.3s ease;
}
.document-card:hover { transform: translateY(-4px); border-color: #e2e8f0; box-shadow: 0 12px 20px -8px rgba(0,0,0,0.08); }

.doc-preview {
  height: 220px; background: #f1f5f9; display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.doc-image-preview { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; }
.document-card:hover .doc-image-preview { transform: scale(1.08); }

.view-doc-link { 
  position: absolute; bottom: 1rem; left: 50%; transform: translateX(-50%) translateY(10px);
  opacity: 0; font-size: 0.75rem; font-weight: 800; color: white; 
  text-decoration: none; padding: 0.625rem 1.125rem; background: #0f172a; 
  border-radius: 10px; transition: all 0.2s;
}
.document-card:hover .view-doc-link { opacity: 1; transform: translateX(-50%) translateY(0); }

.doc-info { padding: 1.5rem; }
.btn-verify-doc { 
  width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; 
  border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.btn-verify-doc:hover { background: #1d4d82; }

.doc-verified-badge { 
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem; 
  color: #69aa62; font-weight: 800; background: #f0fdf4; 
  padding: 0.75rem; border-radius: 12px; border: 1px solid #d1fae5;
}

.doc-desc { font-size: 0.875rem; color: #64748b; line-height: 1.5; margin-top: 1rem; height: 2.6rem; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; }

.modal-footer { padding: 1.5rem 2.5rem; background: #ffffff; border-top: 1px solid #f1f5f9; flex-shrink: 0; }
.verify-actions { display: flex; gap: 1.5rem; justify-content: flex-end; }

.btn-reject { 
  padding: 0.875rem 2rem; background: transparent; border: 1.5px solid #ffe4e6; 
  border-radius: 14px; font-weight: 800; color: #e11d48; cursor: pointer; 
  transition: all 0.2s; font-size: 0.9375rem;
}
.btn-reject:hover { background: #fff1f2; border-color: #e11d48; }

.btn-validate { 
  padding: 0.875rem 3rem; border: none; background: #2b69ad; 
  border-radius: 14px; font-weight: 800; color: white; cursor: pointer; 
  transition: all 0.2s; font-size: 0.9375rem;
}
.btn-validate:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(43, 105, 173, 0.2); }
.btn-validate:disabled { opacity: 0.3; cursor: not-allowed; }

/* Alerts Section */
.alerts-section { margin-top: 4rem; padding-top: 2.5rem; border-top: 2px solid #f1f5f9; }
.section-header h3 { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 1.5rem; }

.alert-item { 
  background: white; padding: 1.5rem; border-radius: 20px; border: 1px solid #f1f5f9;
  margin-bottom: 1.25rem;
}
.alert-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
.alert-meta { display: flex; align-items: center; gap: 1rem; }
.alert-date { font-size: 0.875rem; color: #94a3b8; font-weight: 700; }

.update-badge {
  padding: 0.4rem 0.8rem; border-radius: 10px; font-size: 0.7rem; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.05em;
}
.update-badge.waiting { background: #fff7ed; color: #c2410c; border: 1px solid #ffedd5; }
.update-badge.updated { background: #f0fdf4; color: #166534; border: 1px solid #dcfce7; }

.btn-resolve-alert {
  width: 32px; height: 32px; border-radius: 10px; border: 1px solid #e2e8f0;
  background: white; color: #64748b; display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.2s;
}
.btn-resolve-alert:hover { border-color: #0f172a; color: #0f172a; transform: scale(1.1); }
.alert-comment { 
  font-size: 1rem; color: #334155; font-weight: 600; line-height: 1.5; 
  margin-bottom: 1rem; padding-left: 1rem; border-left: 4px solid #f97316;
}

/* New Alert Form */
.new-alert-form { 
  background: #fff7ed; padding: 2.5rem; border-radius: 32px; border: 1px solid #ffedd5;
  margin-top: 2rem;
}
.new-alert-form h4 { font-size: 1.125rem; font-weight: 800; color: #9a3412; margin-bottom: 1.5rem; }
.new-alert-form label { font-size: 0.875rem; font-weight: 600; color: #c2410c; }

.doc-selection { display: flex; flex-wrap: wrap; gap: 1rem; padding: 1rem 0; }
.checkbox-label { 
  display: flex; align-items: center; gap: 0.5rem; background: white; 
  padding: 0.625rem 1rem; border-radius: 12px; border: 1px solid #fed7aa;
  font-size: 0.875rem; font-weight: 700; color: #475569;
  transition: all 0.2s;
}
.checkbox-label.is-verified {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
  opacity: 0.8;
  cursor: not-allowed;
}
.checkbox-label input { width: 18px; height: 18px; border-radius: 4px; }
.checkbox-label input:disabled { cursor: not-allowed; opacity: 0.5; }

.doc-selection-text {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.selection-verified-tag {
  font-size: 0.65rem;
  background: #166534;
  color: white;
  padding: 0.1rem 0.4rem;
  border-radius: 6px;
  text-transform: uppercase;
}

.new-alert-form textarea {
  width: 100%; background: #ffffff; border: 1px solid #fed7aa;
  color: #0f172a; border-radius: 16px; padding: 1rem; font-size: 0.9375rem;
  margin-top: 0.5rem;
}

.btn-send-alert {
  margin-top: 1.5rem; width: 100%; padding: 1rem; border-radius: 16px; font-size: 1rem;
  font-weight: 800; background: #f97316; color: white; border: none; cursor: pointer;
  transition: all 0.2s;
}
.btn-send-alert:hover:not(:disabled) { background: #ea580c; transform: translateY(-2px); }

.empty-state { padding: 10rem 2rem; }
.empty-icon { font-size: 6rem; filter: grayscale(1); opacity: 0.1; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes modalScale { from { transform: scale(0.9) translateY(40px); opacity: 0; } to { transform: scale(1) translateY(0); opacity: 1; } }
.table-update-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  background: #f0fdf4;
  color: #166534;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 800;
  border: 1px solid #bbf7d0;
  white-space: nowrap;
}

.table-progress-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  background: #fff7ed;
  color: #9a3412;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 800;
  border: 1px solid #fed7aa;
  white-space: nowrap;
}

.pulse {
  width: 8px;
  height: 8px;
  background: #69aa62;
  border-radius: 50%;
  box-shadow: 0 0 0 rgba(105, 170, 98, 0.4);
  animation: pulse 2s infinite;
}

.pulse-orange {
  width: 8px;
  height: 8px;
  background: #f97316;
  border-radius: 50%;
  box-shadow: 0 0 0 rgba(249, 115, 22, 0.4);
  animation: pulse-orange 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(105, 170, 98, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(105, 170, 98, 0); }
  100% { box-shadow: 0 0 0 0 rgba(105, 170, 98, 0); }
}

@keyframes pulse-orange {
  0% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
  100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
}
</style>
