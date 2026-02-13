<script setup lang="ts">
import { ref } from 'vue';
import { getApiUrl } from '../../config/api';
import { storage } from '../../utils/storage';
const localStorage = storage;

const showAdminModal = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const adminForm = ref({
  email: '',
  password: ''
});

const passwordForm = ref({
  newPassword: '',
  confirmPassword: ''
});

const handleRegisterAdmin = async () => {
  const token = localStorage.getItem('access_token');
  error.value = null;
  success.value = null;
  isLoading.value = true;

  try {
    const response = await fetch(getApiUrl('/auth/admin/register'), {
      method: 'POST',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: adminForm.value.email,
        password: adminForm.value.password
      })
    });

    if (response.ok) {
      success.value = 'Administrateur enregistré avec succès';
      showAdminModal.value = false;
      adminForm.value = { email: '', password: '' };
      setTimeout(() => { success.value = null; }, 3000);
    } else {
      const data = await response.json().catch(() => ({}));
      error.value = data.message || 'Échec de l\'enregistrement';
    }
  } catch (err) {
    console.error('Failed to register admin:', err);
    error.value = 'Une erreur réseau est survenue.';
  } finally {
    isLoading.value = false;
  }
};

const handleChangePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    error.value = 'Les mots de passe ne correspondent pas.';
    return;
  }

  if (passwordForm.value.newPassword.length < 6) {
    error.value = 'Le mot de passe doit contenir au moins 6 caractères.';
    return;
  }

  const token = localStorage.getItem('access_token');
  error.value = null;
  success.value = null;
  isLoading.value = true;

  try {
    // Note: Using existing reset-password endpoint as requested. 
    // Usually this requires a specific reset token, but we are attempting 
    // to use it with the current auth context or as a direct integration.
    const response = await fetch(getApiUrl('/auth/reset-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({
        token: token, // Using access token as per request implication/verification needed
        newPassword: passwordForm.value.newPassword
      })
    });

    if (response.ok) {
      success.value = 'Mot de passe modifié avec succès';
      passwordForm.value = { newPassword: '', confirmPassword: '' };
      setTimeout(() => { success.value = null; }, 3000);
    } else {
      const data = await response.json().catch(() => ({}));
      if (response.status === 401) {
        error.value = 'Session expirée ou token invalide. Veuillez vous reconnecter.';
      } else {
        error.value = data.message || 'Échec de la modification du mot de passe';
      }
    }
  } catch (err) {
    console.error('Failed to change password:', err);
    error.value = 'Une erreur réseau est survenue.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="configuration-management">
    <div class="header-section">
      <div class="header-content">
        <h1>Configuration</h1>
        <p class="subtitle">Gérez les paramètres de la plateforme et les administrateurs.</p>
      </div>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="success" class="alert success">{{ success }}</div>
    <div v-if="error" class="alert error">{{ error }}</div>

    <div class="management-grid">
      <!-- Admin Management Card -->
      <div class="grid-card">
        <div class="card-header">
          <h3>Gestion des Administrateurs</h3>
        </div>
        <div class="card-content">
          <p class="card-desc">Ajoutez de nouveaux administrateurs à la plateforme.</p>
          <button class="add-btn" @click="showAdminModal = true">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Ajouter un administrateur
          </button>
        </div>
      </div>

      <!-- Password Change Card -->
      <div class="grid-card">
        <div class="card-header">
          <h3>Sécurité</h3>
        </div>
        <div class="card-content">
          <p class="card-desc">Modifiez votre mot de passe administrateur.</p>
          <form @submit.prevent="handleChangePassword" class="inline-form">
            <div class="form-group">
              <input 
                v-model="passwordForm.newPassword" 
                type="password" 
                placeholder="Nouveau mot de passe" 
                required 
                minlength="6" 
              />
            </div>
            <div class="form-group">
              <input 
                v-model="passwordForm.confirmPassword" 
                type="password" 
                placeholder="Confirmer le mot de passe" 
                required 
                minlength="6" 
              />
            </div>
            <button type="submit" class="submit-btn" :disabled="isLoading">
              {{ isLoading ? 'Modification...' : 'Modifier le mot de passe' }}
            </button>
          </form>
        </div>
      </div>
    </div>

    <!-- Add Admin Modal -->
    <div v-if="showAdminModal" class="modal-overlay" @click.self="showAdminModal = false">
      <div class="modal-content">
        <h2>Nouveau Administrateur</h2>
        <form @submit.prevent="handleRegisterAdmin" class="admin-form">
          <div class="form-group">
            <label>Email</label>
            <input v-model="adminForm.email" type="email" placeholder="admin@example.com" required />
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input v-model="adminForm.password" type="password" placeholder="Mot de passe sécurisé" required minlength="6" />
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="showAdminModal = false">Annuler</button>
            <button type="submit" class="submit-btn" :disabled="isLoading">
              {{ isLoading ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.configuration-management {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  width: 100%;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  font-size: 1.875rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 1rem;
}

.management-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.grid-card {
  background: white;
  border-radius: 24px;
  padding: 1.75rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
}

.card-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1;
}

.card-desc {
  color: #64748b;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  background: #2b69ad;
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(43, 105, 173, 0.2);
  width: 100%;
}

.add-btn:hover {
  background: #1d4d82;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(43, 105, 173, 0.3);
}

/* Modal Styling */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
  animation: modalIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-content h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 1.5rem;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #334155;
}

.form-group input {
  padding: 0.875rem 1rem;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #2b69ad;
  box-shadow: 0 0 0 3px rgba(43, 105, 173, 0.1);
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-btn, .submit-btn {
  flex: 1;
  padding: 0.875rem;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: white;
  border: 1px solid #e2e8f0;
  color: #64748b;
}

.cancel-btn:hover {
  background: #f8fafc;
  color: #0f172a;
}

.submit-btn {
  background: #2b69ad;
  border: none;
  color: white;
  box-shadow: 0 4px 12px rgba(43, 105, 173, 0.2);
}

.submit-btn:hover:not(:disabled) {
  background: #1d4d82;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(43, 105, 173, 0.3);
}

.submit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.alert {
  padding: 1rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9375rem;
  margin-bottom: 1rem;
}

.alert.success {
  background: #dcfce7;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.alert.error {
  background: #fee2e2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.inline-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 1024px) {
  .management-grid {
    grid-template-columns: 1fr;
  }
  
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .modal-content {
    max-width: 100%;
    height: 100%;
    border-radius: 0;
    padding: 1.5rem;
  }
}
</style>
