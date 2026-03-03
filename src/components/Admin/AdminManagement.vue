<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getApiUrl } from '../../config/api';
import { storage } from '../../utils/storage';

const props = defineProps({
  superadmin: {
    type: Boolean,
    default: false
  }
});

interface Admin {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  ban: boolean;
  whatsapp: boolean;
  superadmin: boolean;
}

const admins = ref<Admin[]>([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const showForm = ref(false);
const successMsg = ref('');
const errorMsg = ref('');
const isCurrentSuperAdmin = ref(false);
const togglingId = ref<number | null>(null);

const form = ref({
  name: '',
  email: '',
  password: ''
});

const fetchAdmins = async () => {
  const token = storage.getItem('access_token');
  if (!token) return;
  try {
    isLoading.value = true;
    const res = await fetch(getApiUrl('/admin/users'), {
      headers: { 'Authorization': `Bearer ${token}`, 'accept': '*/*' }
    });
    if (res.ok) {
      admins.value = await res.json();
      const currentIdRaw = storage.getItem('user_id');
      const currentId = currentIdRaw ? Number(currentIdRaw) : NaN;
      if (!Number.isNaN(currentId)) {
        const me = admins.value.find(a => a.id === currentId);
        isCurrentSuperAdmin.value = !!me?.superadmin;
      } else {
        isCurrentSuperAdmin.value = false;
      }
    } else {
      isCurrentSuperAdmin.value = false;
    }
  } catch (err) {
    console.error('Failed to fetch admins:', err);
    isCurrentSuperAdmin.value = false;
  } finally {
    isLoading.value = false;
  }
};

const toggleBan = async (admin: Admin) => {
  const token = storage.getItem('access_token');
  if (!token) return;
  togglingId.value = admin.id;
  try {
    const res = await fetch(getApiUrl(`/admin/users/${admin.id}/ban`), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({ ban: !admin.ban })
    });
    if (res.ok) {
      admin.ban = !admin.ban;
      successMsg.value = admin.ban
        ? `${admin.name || admin.email} a été banni.`
        : `${admin.name || admin.email} a été débanni.`;
      setTimeout(() => { successMsg.value = ''; }, 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      errorMsg.value = data.message || 'Erreur lors de la mise à jour.';
    }
  } catch {
    errorMsg.value = 'Erreur de connexion. Veuillez réessayer.';
  } finally {
    togglingId.value = null;
  }
};

const toggleSuperadmin = async (admin: Admin) => {
  const token = storage.getItem('access_token');
  if (!token) return;
  togglingId.value = admin.id;
  try {
    const res = await fetch(getApiUrl(`/admin/users/${admin.id}/superadmin`), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({ superadmin: !admin.superadmin })
    });
    if (res.ok) {
      admin.superadmin = !admin.superadmin;
      successMsg.value = admin.superadmin
        ? `${admin.name || admin.email} est maintenant Super Admin.`
        : `${admin.name || admin.email} n'est plus Super Admin.`;
      setTimeout(() => { successMsg.value = ''; }, 3000);
    } else {
      const data = await res.json().catch(() => ({}));
      errorMsg.value = data.message || 'Erreur lors de la mise à jour.';
    }
  } catch {
    errorMsg.value = 'Erreur de connexion. Veuillez réessayer.';
  } finally {
    togglingId.value = null;
  }
};

const createAdmin = async () => {
  const token = storage.getItem('access_token');
  if (!token) return;
  if (!isCurrentSuperAdmin.value || !props.superadmin) {
    errorMsg.value = '⛔ Accès refusé — Seul un Super Administrateur peut ajouter de nouveaux administrateurs.';
    setTimeout(() => { if (errorMsg.value.startsWith('⛔')) errorMsg.value = ''; }, 5000);
    return;
  }
  errorMsg.value = '';
  successMsg.value = '';
  isSubmitting.value = true;
  try {
    const res = await fetch(getApiUrl('/auth/admin/register'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({
        name: form.value.name,
        email: form.value.email,
        password: form.value.password
      })
    });
    if (res.ok) {
      successMsg.value = 'Administrateur créé avec succès.';
      form.value = { name: '', email: '', password: '' };
      showForm.value = false;
      await fetchAdmins();
    } else {
      const data = await res.json().catch(() => ({}));
      errorMsg.value = data.message || 'Erreur lors de la création.';
    }
  } catch {
    errorMsg.value = 'Erreur de connexion. Veuillez réessayer.';
  } finally {
    isSubmitting.value = false;
  }
};

const handleAddClick = () => {
  if (!isCurrentSuperAdmin.value || !props.superadmin) {
    errorMsg.value = '⛔ Accès refusé — Seul un Super Administrateur peut ajouter de nouveaux administrateurs.';
    setTimeout(() => { if (errorMsg.value.startsWith('⛔')) errorMsg.value = ''; }, 5000);
    return;
  }
  errorMsg.value = '';
  showForm.value = !showForm.value;
};

onMounted(fetchAdmins);
</script>

<template>
  <div class="am-page">
    <!-- Header -->
    <div class="am-header">
      <div class="am-title-block">
        <div class="am-icon-wrap">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        </div>
        <div>
          <h2>Gestion des Administrateurs</h2>
          <p class="am-subtitle">{{ admins.length }} administrateur(s) enregistré(s)</p>
        </div>
      </div>
      <button
        class="add-btn"
        @click="handleAddClick"
        :disabled="!isCurrentSuperAdmin || !superadmin"
        :title="!isCurrentSuperAdmin || !superadmin ? 'Superadmin requis' : ''"
        :style="!isCurrentSuperAdmin || !superadmin ? 'opacity:0.55; cursor:not-allowed;' : ''"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Ajouter un administrateur
      </button>
    </div>

    <!-- Feedback messages -->
    <div v-if="successMsg" class="feedback success-msg">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>
      {{ successMsg }}
    </div>
    <div v-if="errorMsg" class="feedback error-msg">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>{{ errorMsg }}</span>
      <button class="dismiss-btn" @click="errorMsg = ''">✕</button>
    </div>

    <!-- Add Admin Form — superadmin only -->
    <div v-if="showForm && superadmin" class="form-card">
      <div class="form-card-header">
        <h3>Nouvel Administrateur</h3>
        <button class="close-form-btn" @click="showForm = false">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <form class="admin-form" @submit.prevent="createAdmin">
        <div class="form-group">
          <label for="admin-name">Nom complet</label>
          <input id="admin-name" v-model="form.name" type="text" placeholder="Jean Dupont" required :disabled="isSubmitting" />
        </div>
        <div class="form-group">
          <label for="admin-email">Adresse e-mail</label>
          <input id="admin-email" v-model="form.email" type="email" placeholder="admin@daricare.tn" required :disabled="isSubmitting" />
        </div>
        <div class="form-group">
          <label for="admin-password">Mot de passe</label>
          <input id="admin-password" v-model="form.password" type="password" placeholder="••••••••" required :disabled="isSubmitting" minlength="6" />
        </div>
        <div class="form-actions">
          <button type="button" class="cancel-btn" @click="showForm = false" :disabled="isSubmitting">Annuler</button>
          <button type="submit" class="submit-btn" :disabled="isSubmitting">
            <span v-if="isSubmitting">Création...</span>
            <span v-else>Créer l'administrateur</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Admin Table -->
    <div class="am-card">
      <div v-if="isLoading" class="loader-box">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <div v-else-if="admins.length > 0" class="am-list-container">
        <table class="am-table">
          <thead>
            <tr>
              <th>Administrateur</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="admin in admins" :key="admin.id" class="am-row">
              <td>
                <div class="user-cell">
                  <div class="avatar">{{ admin.name?.[0]?.toUpperCase() || admin.email?.[0]?.toUpperCase() || 'A' }}</div>
                  <div class="user-details">
                    <span class="user-name">{{ admin.name || '—' }}</span>
                    <span class="user-email">{{ admin.email }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span :class="['role-badge', admin.superadmin ? 'super' : 'regular']">
                  {{ admin.superadmin ? 'Super Admin' : 'Administrateur' }}
                </span>
              </td>
              <td>
                <span :class="['status-chip', admin.ban ? 'banned' : 'active']">
                  {{ admin.ban ? 'Banni' : 'Actif' }}
                </span>
              </td>
              <td>
                <div class="action-btns">
                  <!-- Toggle Superadmin -->
                  <button
                    class="toggle-btn"
                    :class="admin.superadmin ? 'toggle-active-super' : 'toggle-inactive'"
                    :disabled="togglingId === admin.id"
                    :title="admin.superadmin ? 'Révoquer Super Admin' : 'Promouvoir Super Admin'"
                    @click="toggleSuperadmin(admin)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    {{ admin.superadmin ? 'Super Admin' : 'Admin' }}
                  </button>
  
                  <!-- Toggle Ban -->
                  <button
                    class="toggle-btn"
                    :class="admin.ban ? 'toggle-active-ban' : 'toggle-inactive'"
                    :disabled="togglingId === admin.id"
                    :title="admin.ban ? 'Débannir' : 'Bannir'"
                    @click="toggleBan(admin)"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                    {{ admin.ban ? 'Banni' : 'Actif' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        
        <!-- Mobile Cards View -->
        <div class="mobile-cards">
          <div v-for="admin in admins" :key="admin.id" class="mobile-admin-card">
            <div class="m-card-header">
              <div class="user-cell">
                <div class="avatar">{{ admin.name?.[0]?.toUpperCase() || admin.email?.[0]?.toUpperCase() || 'A' }}</div>
                <div class="user-details">
                  <span class="user-name">{{ admin.name || '—' }}</span>
                  <span class="user-email">{{ admin.email }}</span>
                </div>
              </div>
            </div>
            <div class="m-card-body">
              <div class="m-info-row">
                <span class="m-label">Rôle:</span>
                <span :class="['role-badge', admin.superadmin ? 'super' : 'regular']">
                  {{ admin.superadmin ? 'Super Admin' : 'Admin' }}
                </span>
              </div>
              <div class="m-info-row">
                <span class="m-label">Statut:</span>
                <span :class="['status-chip', admin.ban ? 'banned' : 'active']">
                  {{ admin.ban ? 'Banni' : 'Actif' }}
                </span>
              </div>
            </div>
            <div class="m-card-actions">
              <button
                class="toggle-btn"
                :class="admin.superadmin ? 'toggle-active-super' : 'toggle-inactive'"
                :disabled="togglingId === admin.id"
                @click="toggleSuperadmin(admin)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                {{ admin.superadmin ? 'Super Admin' : 'Admin' }}
              </button>
              <button
                class="toggle-btn"
                :class="admin.ban ? 'toggle-active-ban' : 'toggle-inactive'"
                :disabled="togglingId === admin.id"
                @click="toggleBan(admin)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
                {{ admin.ban ? 'Banni' : 'Actif' }}
              </button>
            </div>
          </div>
        </div>
      </div>


      <div v-else class="empty-state">
        <div class="empty-icon">🛡️</div>
        <p>Aucun administrateur trouvé.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.am-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Header */
.am-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.am-title-block {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.am-icon-wrap {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #7c3aed, #a78bfa);
  color: white;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.am-title-block h2 {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0 0 0.125rem 0;
}

.am-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(124, 58, 237, 0.25);
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35);
}

/* Feedback */
.feedback {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.875rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
}

.feedback span { flex: 1; }

.success-msg { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
.error-msg   { background: #fff5f5; color: #c53030; border: 1px solid #feb2b2; }

.dismiss-btn {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  font-size: 1rem;
  line-height: 1;
  padding: 0 0.25rem;
  transition: opacity 0.15s;
}
.dismiss-btn:hover { opacity: 1; }

/* Form Card */
.form-card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  border: 1.5px solid #ede9fe;
  box-shadow: 0 8px 24px rgba(124, 58, 237, 0.07);
}

.form-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.form-card-header h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
  margin: 0;
}

.close-form-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 8px;
  transition: background 0.2s;
}
.close-form-btn:hover { background: #f1f5f9; color: #64748b; }

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.form-group input {
  padding: 0.8rem 1rem;
  border: 2px solid #edf2f7;
  border-radius: 12px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.form-group input:focus {
  border-color: #7c3aed;
  box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.08);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.cancel-btn {
  padding: 0.75rem 1.25rem;
  background: #f8fafc;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.875rem;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}
.cancel-btn:hover { background: #f1f5f9; }

.submit-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}
.submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(124,58,237,0.3); }
.submit-btn:disabled, .cancel-btn:disabled { opacity: 0.6; cursor: not-allowed; }

/* Admin Table Card */
.am-card {
  background: white;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  border: 1px solid #f1f5f9;
  overflow-x: auto;
}

.am-table {
  width: 100%;
  border-collapse: collapse;
}

.am-table thead tr {
  border-bottom: 2px solid #f1f5f9;
}

.am-table th {
  text-align: left;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
  padding: 0 1rem 1rem 1rem;
}

.am-row td {
  padding: 1rem;
  border-bottom: 1px solid #f8fafc;
  vertical-align: middle;
}
.am-row:last-child td { border-bottom: none; }
.am-row:hover { background: #faf8ff; }

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed22, #a855f733);
  color: #7c3aed;
  font-weight: 800;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 700;
  font-size: 0.9rem;
  color: #0f172a;
}

.user-email {
  font-size: 0.8rem;
  color: #64748b;
}

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}
.role-badge.super   { background: #ede9fe; color: #5b21b6; }
.role-badge.regular { background: #eff6ff; color: #1d4ed8; }

.status-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.3rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
}
.status-chip.active { background: #dcfce7; color: #166534; }
.status-chip.banned { background: #fee2e2; color: #991b1b; }

/* Action buttons */
.action-btns {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  border: 1.5px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.toggle-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Super admin toggle — active (is superadmin) */
.toggle-active-super {
  background: #ede9fe;
  color: #5b21b6;
  border-color: #c4b5fd;
}
.toggle-active-super:hover:not(:disabled) {
  background: #ddd6fe;
}

/* Ban toggle — active (is banned) */
.toggle-active-ban {
  background: #fee2e2;
  color: #991b1b;
  border-color: #fca5a5;
}
.toggle-active-ban:hover:not(:disabled) {
  background: #fecaca;
}

/* Inactive state (default / off) */
.toggle-inactive {
  background: #f8fafc;
  color: #64748b;
  border-color: #e2e8f0;
}
.toggle-inactive:hover:not(:disabled) {
  background: #f1f5f9;
  color: #334155;
}

/* Loader */
.loader-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem;
  color: #94a3b8;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid #f1f5f9;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Responsive */
.mobile-cards {
  display: none;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  .am-table { display: none; }
  .mobile-cards { display: flex; }
  .am-header { flex-direction: column; align-items: stretch; }
  .add-btn { width: 100%; justify-content: center; }
  .am-card { padding: 1.25rem; background: transparent; box-shadow: none; border: none; }
}

.mobile-admin-card {
  background: white;
  border-radius: 20px;
  padding: 1.25rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.m-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-top: 1px solid #f8fafc;
  border-bottom: 1px solid #f8fafc;
}

.m-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.m-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #94a3b8;
}

.m-card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.m-card-actions .toggle-btn {
  justify-content: center;
  padding: 0.625rem;
}
</style>
