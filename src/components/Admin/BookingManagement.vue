<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storage } from '../../utils/storage';

const bookings = ref<any[]>([]);
const isLoading = ref(false);
const selectedBooking = ref<any>(null);
const errorMessage = ref('');

const fetchBookings = async () => {
  const token = storage.getItem('access_token');
  if (!token) return;

  try {
    isLoading.value = true;
    errorMessage.value = '';
    const response = await fetch('/api/admin/requests/summary', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      const data = await response.json();
      // Map the response to match existing template structure
      bookings.value = data.map((item: any) => ({
        ...item.request,
        acceptedProfessional: item.acceptedProfessional,
        distance: item.distance,
        assignmentStatus: item.assignmentStatus
      }));
    } else {
      throw new Error('Échec du chargement des réservations');
    }
  } catch (err: any) {
    console.error('Failed to fetch bookings:', err);
    errorMessage.value = err.message;
  } finally {
    isLoading.value = false;
  }
};

const getStatusClass = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'status-pending'; // Orange for pending
    case 'accepted': return 'status-validated'; // Green for accepted
    case 'confirmed': return 'status-validated'; // Green for confirmed
    case 'cancelled': return 'status-rejected'; // Red for cancelled
    case 'rejected': return 'status-rejected'; // Red for rejected
    default: return 'status-pending';
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatTime = (timeStr: string) => {
  if (!timeStr) return '—';
  return timeStr.substring(0, 5);
};

onMounted(fetchBookings);
</script>

<template>
  <div class="booking-management">
    <div v-if="errorMessage" class="alert alert-error">{{ errorMessage }} <button @click="errorMessage = ''">×</button></div>

    <div class="grid-card full-width">
      <div class="card-header">
        <div class="header-main">
          <h3>Réservations de Soins</h3>
          <p class="subtitle">{{ bookings.length }} demandes enregistrées</p>
        </div>
        <button class="refresh-btn" @click="fetchBookings" :disabled="isLoading">
          <svg :class="{ 'spinning': isLoading }" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          {{ isLoading ? 'Chargement...' : 'Actualiser' }}
        </button>
      </div>

      <div class="table-wrapper admin-card">
        <table v-if="bookings.length > 0" class="admin-table">
          <thead>
            <tr>
              <th>Patient</th>
              <th>Service</th>
              <th>Date Début</th>
              <th>Lieu</th>
              <th>Professionnel</th>
              <th>Montant</th>
              <th>Status</th>
              <th class="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="booking in bookings" :key="booking.id" class="pro-row">
              <td>
                <div class="user-info">
                  <div class="user-avatar-small">{{ booking.patientFirstname[0] }}</div>
                  <div class="user-details">
                    <span class="user-name">{{ booking.patientCivility }} {{ booking.patientFirstname }} {{ booking.patientLastname }}</span>
                    <span class="user-email">{{ booking.patientPhone }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="service-info">
                  <span class="spec-badge">{{ booking.service?.name }}</span>
                  <div class="soins-tags">
                    <span v-for="rs in booking.requestSoins" :key="rs.id" class="soin-mini-tag">
                      {{ rs.soin?.name }}
                    </span>
                  </div>
                </div>
              </td>
              <td>
                <div class="date-info">
                  <span class="date-val">{{ formatDate(booking.startDate) }}</span>
                  <span class="time-val">{{ formatTime(booking.availabilityStart) }} - {{ formatTime(booking.availabilityEnd) }}</span>
                </div>
              </td>
              <td>
                <span class="address-text" :title="booking.address">
                  {{ booking.isIndifferent ? '📍 Indifférent' : booking.address }}
                </span>
              </td>
              <td>
                <div v-if="booking.acceptedProfessional" class="pro-info">
                  <span class="pro-name">{{ booking.acceptedProfessional.name }}</span>
                  <span class="pro-spec">{{ booking.acceptedProfessional.speciality }}</span>
                </div>
                <span v-else class="no-pro">Non assigné</span>
              </td>
              <td>
                <span v-if="booking.totalPrice" class="price-tag">{{ booking.totalPrice }} DT</span>
                <span v-else class="text-muted">—</span>
              </td>
              <td>
                <span :class="['status-badge', getStatusClass(booking.assignmentStatus || booking.status)]">
                  {{ booking.assignmentStatus === 'PENDING' ? 'En attente' : booking.assignmentStatus === 'ACCEPTED' ? 'Accepté' : booking.status }}
                </span>
              </td>
              <td class="text-right">
                <div class="table-actions">
                  <button class="action-btn view-btn" @click="selectedBooking = booking" title="Voir les détails">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else-if="!isLoading" class="empty-state">
          <div class="empty-icon">📅</div>
          <p>Aucune réservation trouvée.</p>
        </div>
        
        <!-- Mobile Cards View -->
        <div class="mobile-cards">
          <div v-for="booking in bookings" :key="booking.id" class="mobile-booking-card" @click="selectedBooking = booking">
            <div class="mobile-card-header">
              <div class="mobile-user-info">
                <div class="user-avatar-small">{{ booking.patientFirstname[0] }}</div>
                <div>
                  <span class="user-name">{{ booking.patientCivility }} {{ booking.patientFirstname }} {{ booking.patientLastname }}</span>
                  <span class="user-email">{{ booking.patientPhone }}</span>
                </div>
              </div>
              <span :class="['status-badge', getStatusClass(booking.assignmentStatus || booking.status)]">
                {{ booking.assignmentStatus === 'PENDING' ? 'En attente' : booking.assignmentStatus === 'ACCEPTED' ? 'Accepté' : booking.status }}
              </span>
            </div>
            
            <div class="mobile-card-body">
              <div class="info-row">
                <span class="label">Service:</span>
                <span class="value">{{ booking.service?.name }}</span>
              </div>
              <div class="info-row">
                <span class="label">Date:</span>
                <span class="value">{{ formatDate(booking.startDate) }}</span>
              </div>
              <div class="info-row">
                <span class="label">Horaire:</span>
                <span class="value">{{ formatTime(booking.availabilityStart) }} - {{ formatTime(booking.availabilityEnd) }}</span>
              </div>
              <div class="info-row" v-if="booking.acceptedProfessional">
                <span class="label">Pro:</span>
                <span class="value">{{ booking.acceptedProfessional.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Booking Detail Modal -->
    <div v-if="selectedBooking" class="modal-overlay" @click.self="selectedBooking = null">
      <div class="modal-card">
        <header class="modal-header">
          <div class="modal-title-area">
            <h2>Détails de la demande #{{ selectedBooking.id }}</h2>
            <span :class="['status-badge', getStatusClass(selectedBooking.status)]">{{ selectedBooking.status }}</span>
          </div>
          <button class="close-btn" @click="selectedBooking = null">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </header>

        <div class="modal-content">
          <div class="pro-info-grid">
            <div class="info-group">
              <label>Informations Patient</label>
              <p><strong>Nom:</strong> {{ selectedBooking.patientCivility }} {{ selectedBooking.patientFirstname }} {{ selectedBooking.patientLastname }}</p>
              <p><strong>Né(e) le:</strong> {{ formatDate(selectedBooking.patientBirthdate) }}</p>
              <p><strong>Téléphone:</strong> {{ selectedBooking.patientPhone }}</p>
              <p><strong>Email:</strong> {{ selectedBooking.patientEmail }}</p>
            </div>
            <div class="info-group">
              <label>Détails du Service</label>
              <p><strong>Service:</strong> {{ selectedBooking.service?.name }}</p>
              <p><strong>Prix Total:</strong> <span class="price-tag-large">{{ selectedBooking.totalPrice || 0 }} DT</span></p>
              <p><strong>Début:</strong> {{ formatDate(selectedBooking.startDate) }}</p>
              <p><strong>Durée:</strong> {{ selectedBooking.durationValue }} jour(s) ({{ selectedBooking.durationMode }})</p>
              <p><strong>Créneau:</strong> {{ formatTime(selectedBooking.availabilityStart) }} - {{ formatTime(selectedBooking.availabilityEnd) }}</p>
            </div>
            <div class="info-group full-width">
              <label>Lieu des soins</label>
              <p><strong>Adresse:</strong> {{ selectedBooking.isIndifferent ? 'Indifférent' : selectedBooking.address }}</p>
              <p v-if="selectedBooking.addressComplement"><strong>Complément:</strong> {{ selectedBooking.addressComplement }}</p>
            </div>
          </div>

          <div class="soins-section mb-2">
            <h3>Soins Demandés</h3>
            <div class="soins-list">
              <div v-for="rs in selectedBooking.requestSoins" :key="rs.id" class="soin-detail-card">
                <div class="soin-detail-header">
                  <h4>{{ rs.soin?.name }}</h4>
                  <span class="frequency-badge">{{ rs.frequencyCount }} fois / {{ rs.frequencyPeriod === 'day' ? 'jour' : rs.frequencyPeriod }}</span>
                </div>
                <div class="soin-answers">
                  <div v-for="(val, key) in rs.answers" :key="key" class="answer-row">
                    <span class="answer-key">{{ key }}:</span>
                    <span class="answer-val">{{ Array.isArray(val) ? val.join(', ') : val }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="documents-section">
            <div class="section-header-row">
              <h3>Ordonnances & Documents</h3>
              <span class="p-status-badge" :class="selectedBooking.prescriptionStatus">
                Statut: {{ selectedBooking.prescriptionStatus }}
              </span>
            </div>
            <div v-if="selectedBooking.documents && selectedBooking.documents.length > 0" class="docs-grid">
              <div v-for="doc in selectedBooking.documents" :key="doc.id" class="document-card">
                <div class="doc-preview">
                  <div class="doc-icon">📄</div>
                  <a :href="'/api/' + doc.filePath" target="_blank" class="view-doc-link">Voir le document</a>
                </div>
                <div class="doc-info">
                  <span class="doc-name">{{ doc.fileOriginalName }}</span>
                  <span class="doc-type">{{ doc.mimeType }}</span>
                </div>
              </div>
            </div>
            <div v-else class="no-docs-empty">
              Aucun document joint à cette demande.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.booking-management {
  width: 100%;
}

.service-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.soins-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
}

.soin-mini-tag {
  background: #f1f5f9;
  padding: 0.2rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.date-info {
  display: flex;
  flex-direction: column;
}

.date-val {
  font-weight: 700;
  color: #0f172a;
}

.time-val {
  font-size: 0.8125rem;
  color: #64748b;
}

.pro-info {
  display: flex;
  flex-direction: column;
}

.pro-name {
  font-weight: 700;
  color: #0f172a;
}

.pro-spec {
  font-size: 0.8125rem;
  color: #64748b;
}

.no-pro {
  font-style: italic;
  color: #64748b;
}

.address-text {
  max-width: 200px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
}

.soin-detail-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  margin-bottom: 1rem;
}

.soin-detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 0.5rem;
}

.soin-detail-header h4 {
  margin: 0;
  font-size: 1.125rem;
  color: #0f172a;
}

.frequency-badge {
  background: #f0fdf4;
  color: #15803d;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.answer-row {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.answer-key {
  color: #64748b;
  font-weight: 600;
}

.answer-val {
  color: #1e293b;
}

.section-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.p-status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.p-status-badge.available { background: #dcfce7; color: #15803d; }
.p-status-badge.pending { background: #fef3c7; color: #b45309; }
.p-status-badge.none { background: #f1f5f9; color: #64748b; }

.doc-name {
  display: block;
  font-weight: 700;
  font-size: 0.875rem;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mb-2 { margin-bottom: 2rem; }

/* Reusing some styles from common admin classes */
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
.user-email { display: block; font-size: 0.8125rem; color: #64748b; margin-top: 0.125rem; }

.spec-badge {
  background: #f1f5f9; padding: 0.375rem 0.75rem;
  border-radius: 8px; font-weight: 600; font-size: 0.8125rem; color: #475569;
}

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

.action-btn {
  width: 38px; height: 38px; border-radius: 10px;
  border: 1px solid #e2e8f0; background: white;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #64748b; transition: all 0.2s;
}
.action-btn:hover { border-color: #2b69ad; color: #2b69ad; background: #f0f7ff; }

.price-tag {
  background: #f0fdf4;
  color: #166534;
  padding: 0.25rem 0.625rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.8125rem;
  border: 1px solid #bbf7d0;
}

.price-tag-large {
  color: #15803d;
  font-weight: 800;
  font-size: 1.125rem;
}

.modal-overlay {
  position: fixed; inset: 0; background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px); display: flex; align-items: center;
  justify-content: center; z-index: 1000; padding: 2rem;
}
.modal-card {
  background: white; width: 100%; max-width: 900px;
  max-height: 90vh; border-radius: 32px; overflow: hidden;
  display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
}
.modal-header { padding: 2rem; background: #ffffff; border-bottom: 1px solid #f1f5f9; display: flex; justify-content: space-between; align-items: center; }
.modal-title-area { display: flex; align-items: center; gap: 1.5rem; }
.modal-title-area h2 { font-size: 1.5rem; font-weight: 800; color: #0f172a; margin: 0; }
.close-btn { background: #f1f5f9; border: none; width: 44px; height: 44px; border-radius: 12px; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
.close-btn:hover { background: rgba(43, 105, 173, 0.1); color: #2b69ad; }
.modal-content { padding: 2.5rem; overflow-y: auto; flex: 1; }

.pro-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; margin-bottom: 3rem; }
.info-group label { display: block; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.05em; margin-bottom: 1rem; }
.info-group p { font-size: 0.9375rem; color: #334155; margin-bottom: 0.625rem; }
.info-group strong { color: #64748b; font-weight: 600; width: 140px; display: inline-block; }
.full-width { grid-column: 1 / -1; }

.docs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1.5rem; }
.document-card { background: #f8fafc; border-radius: 20px; overflow: hidden; border: 1px solid #f1f5f9; }
.doc-preview { height: 120px; background: #e2e8f0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; position: relative; }
.view-doc-link { font-size: 0.75rem; font-weight: 700; color: #2b69ad; text-decoration: none; padding: 0.4rem 0.8rem; background: white; border-radius: 8px; }
.doc-info { padding: 1rem; }
.doc-type { display: block; font-weight: 800; font-size: 0.65rem; text-transform: uppercase; color: #64748b; margin-top: 0.25rem; }

.spinning { animation: spin 1s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.alert { padding: 1rem; border-radius: 12px; margin-bottom: 1rem; display: flex; justify-content: space-between; }
.alert-error { background: #fee2e2; color: #b91c1c; }
.alert button { background: transparent; border: none; font-size: 1.25rem; cursor: pointer; color: inherit; }

.empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem; color: #94a3b8; }
.empty-icon { font-size: 3rem; margin-bottom: 1rem; }

/* Mobile Cards */
.mobile-cards { display: none; }

@media (max-width: 1024px) {
  .booking-management { width: 100%; }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .refresh-btn { width: 100%; justify-content: center; }
  
  .table-wrapper {
    margin: 0 -1rem;
    padding: 0 1rem;
    overflow: visible !important;
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
      grid-template-columns: 1fr; /* Stack cards on small screens */
    }
  }
  
  .mobile-booking-card {
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
  
  .mobile-booking-card:active { transform: scale(0.98); background: #f8fafc; }
  
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
  
  .modal-card {
    height: 100%;
    max-height: 100vh;
    border-radius: 0;
  }
  
  .modal-header { padding: 1.5rem; }
  .modal-content { padding: 1.5rem; }
  
  .pro-info-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .docs-grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: 1rem;
  }
  
  .doc-preview { height: 100px; }
}
</style>
