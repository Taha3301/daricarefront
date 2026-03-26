<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { storage } from '../../utils/storage';
const localStorage = storage;
import { getApiUrl } from '../../config/api';

const profileForm = ref({
  phone: '',
  speciality: '',
  cin: '',
  diploma: '',
  yearsOfExperience: 0,
  professionalAddress: '',
  city: '',
  latitude: 0,
  longitude: 0
});

const isFetchingProfile = ref(false);
const isUpdatingProfile = ref(false);
const profileStatus = ref<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

// Tab Navigation
const activeTab = ref<'profile' | 'security' | 'notifications'>('profile');

// Notifications State
const notificationsForm = ref({
  whatsappEnabled: false
});
const isUpdatingNotifications = ref(false);
const notificationsStatus = ref<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

const fetchProfile = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  isFetchingProfile.value = true;
  try {
    const response = await fetch(getApiUrl('/auth/profile'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('👤 Profile fetched:', data);
      profileForm.value = {
        phone: data.phone || '',
        speciality: data.speciality || '',
        cin: data.cin || '',
        diploma: data.diploma || '',
        yearsOfExperience: data.yearsOfExperience || 0,
        professionalAddress: data.professionalAddress || '',
        city: data.city || '',
        latitude: data.latitude || 0,
        longitude: data.longitude || 0
      };
      
      notificationsForm.value.whatsappEnabled = data.whatsapp ?? false;
    }
  } catch (err) {
    console.error('Error fetching profile:', err);
  } finally {
    isFetchingProfile.value = false;
  }
};

const handleUpdateProfile = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  isUpdatingProfile.value = true;
  profileStatus.value = { type: null, message: '' };

  try {
    const response = await fetch(getApiUrl('/auth/profile'), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      },
      body: JSON.stringify(profileForm.value)
    });

    if (response.ok) {
      profileStatus.value = { type: 'success', message: 'Profil mis à jour avec succès !' };
    } else {
      const data = await response.json().catch(() => ({}));
      profileStatus.value = { type: 'error', message: data.message || 'Échec de la mise à jour du profil.' };
    }
  } catch (err) {
    console.error('Update profile error:', err);
    profileStatus.value = { type: 'error', message: 'Une erreur réseau est survenue.' };
  } finally {
    isUpdatingProfile.value = false;
  }
};

const isLocating = ref(false);
const getCurrentLocation = () => {
  if (!navigator.geolocation) {
    profileStatus.value = { type: 'error', message: 'La géolocalisation n\'est pas supportée par votre navigateur.' };
    return;
  }

  isLocating.value = true;
  profileStatus.value = { type: null, message: '' };

  navigator.geolocation.getCurrentPosition(
    (position) => {
      profileForm.value.latitude = position.coords.latitude;
      profileForm.value.longitude = position.coords.longitude;
      isLocating.value = false;
      profileStatus.value = { type: 'success', message: 'Position GPS récupérée avec succès !' };
      alert('Position GPS récupérée avec succès !');
      console.log('📍 New coordinates:', profileForm.value.latitude, profileForm.value.longitude);
    },
    (error) => {
      isLocating.value = false;
      let msg = 'Erreur de géolocalisation.';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          msg = 'Accès à la position refusé. Veuillez autoriser la localisation dans votre navigateur.';
          break;
        case error.POSITION_UNAVAILABLE:
          msg = 'Position non disponible (vérifiez votre connexion GPS/Internet).';
          break;
        case error.TIMEOUT:
          msg = 'Délai d\'attente dépassé. Veuillez réessayer.';
          break;
        default:
          msg = 'Une erreur inconnue est survenue.';
      }
      
      profileStatus.value = { type: 'error', message: msg };
      console.error('Geolocation error:', error);
    },
    { 
      enableHighAccuracy: false, // Set to false for better compatibility on all devices
      timeout: 10000,           // Increase timeout to 10s
      maximumAge: 0 
    }
  );
};

const handleToggleWhatsApp = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  isUpdatingNotifications.value = true;
  notificationsStatus.value = { type: null, message: '' };

  try {
    const response = await fetch(getApiUrl('/professionals/whatsapp'), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      const data = await response.json();
      notificationsForm.value.whatsappEnabled = data.whatsapp;
      notificationsStatus.value = { 
        type: 'success', 
        message: data.whatsapp ? 'Notifications WhatsApp activées !' : 'Notifications WhatsApp désactivées !' 
      };
      
      // Clear status message after 3 seconds
      setTimeout(() => {
        notificationsStatus.value = { type: null, message: '' };
      }, 3000);
    } else {
      const data = await response.json().catch(() => ({}));
      notificationsStatus.value = { type: 'error', message: data.message || 'Échec de la mise à jour.' };
      // Revert toggle state on failure
      notificationsForm.value.whatsappEnabled = !notificationsForm.value.whatsappEnabled;
    }
  } catch (err) {
    console.error('Toggle WhatsApp error:', err);
    notificationsStatus.value = { type: 'error', message: 'Erreur réseau.' };
    notificationsForm.value.whatsappEnabled = !notificationsForm.value.whatsappEnabled;
  } finally {
    isUpdatingNotifications.value = false;
  }
};

onMounted(fetchProfile);

const resetPasswordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const isResettingPassword = ref(false);
const isVerifyModalOpen = ref(false);
const resetPasswordStatus = ref<{ type: 'success' | 'error' | null, message: string }>({ type: null, message: '' });

const handleResetPassword = async () => {
  if (resetPasswordForm.value.newPassword !== resetPasswordForm.value.confirmPassword) {
    resetPasswordStatus.value = { type: 'error', message: 'Les mots de passe ne correspondent pas.' };
    return;
  }

  if (resetPasswordForm.value.newPassword.length < 6) {
    resetPasswordStatus.value = { type: 'error', message: 'Le mot de passe doit contenir au moins 6 caractères.' };
    return;
  }

  // Instead of direct reset, open the verification modal
  resetPasswordStatus.value = { type: null, message: '' };
  isVerifyModalOpen.value = true;
};

const confirmResetPassword = async () => {
  if (!resetPasswordForm.value.oldPassword) {
    resetPasswordStatus.value = { type: 'error', message: 'Veuillez entrer votre ancien mot de passe.' };
    return;
  }

  const token = localStorage.getItem('access_token');
  if (!token) return;

  isResettingPassword.value = true;
  isVerifyModalOpen.value = false;

  try {
    const response = await fetch(getApiUrl('/auth/change-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      },
      body: JSON.stringify({
        oldPassword: resetPasswordForm.value.oldPassword,
        newPassword: resetPasswordForm.value.newPassword
      })
    });

    if (response.ok) {
      resetPasswordStatus.value = { type: 'success', message: 'Mot de passe modifié avec succès !' };
      resetPasswordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    } else {
      const data = await response.json().catch(() => ({}));
      resetPasswordStatus.value = { type: 'error', message: data.message || 'Échec de la modification du mot de passe.' };
    }
  } catch (err) {
    console.error('Reset password error:', err);
    resetPasswordStatus.value = { type: 'error', message: 'Une erreur réseau est survenue.' };
  } finally {
    isResettingPassword.value = false;
  }
};
</script>

<template>
  <div class="settings-view">
    <div class="settings-card">
      <div class="settings-card-header">
        <h3>Paramètres du compte</h3>
        <p>Gérez vos informations personnelles, votre sécurité et vos préférences de notification.</p>
        
        <div class="settings-nav">
          <button 
            class="nav-item" 
            :class="{ active: activeTab === 'profile' }"
            @click="activeTab = 'profile'"
            title="Mon Profil"
          >
            <svg class="nav-icon-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            <span class="nav-text">Mon Profil</span>
          </button>
          <button 
            class="nav-item" 
            :class="{ active: activeTab === 'notifications' }"
            @click="activeTab = 'notifications'"
            title="Notifications"
          >
            <svg class="nav-icon-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            <span class="nav-text">Notifications</span>
          </button>
          <button 
            class="nav-item" 
            :class="{ active: activeTab === 'security' }"
            @click="activeTab = 'security'"
            title="Sécurité"
          >
            <svg class="nav-icon-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span class="nav-text">Sécurité</span>
          </button>
        </div>
      </div>
      
      <!-- Profile Tab -->
      <div v-if="activeTab === 'profile'" class="settings-section">
        <div class="section-badge">Mon Profil</div>
        <h4>Informations professionnelles</h4>
        <p class="section-desc">Mettez à jour vos informations de contact et professionnelles.</p>
        
        <div v-if="isFetchingProfile" class="loading-profile">
          <div class="spinner-small"></div>
          Chargement du profil...
        </div>
        
        <form v-else @submit.prevent="handleUpdateProfile" class="settings-form profile-form">
          <div class="form-grid">
            <div class="form-group">
              <label>Téléphone personnel</label>
              <input v-model="profileForm.phone" type="tel" placeholder="Ex: 24 000 000" />
            </div>
            <div class="form-group">
              <label>CIN</label>
              <input v-model="profileForm.cin" type="text" />
            </div>
            <div class="form-group full-width">
              <label>Spécialité</label>
              <input v-model="profileForm.speciality" type="text" placeholder="Ex: Infirmière" />
            </div>
            <div class="form-group">
              <label>Diplôme</label>
              <input v-model="profileForm.diploma" type="text" />
            </div>
            <div class="form-group">
              <label>Expérience (années)</label>
              <input v-model.number="profileForm.yearsOfExperience" type="number" />
            </div>
            <div class="form-group">
              <label>Ville</label>
              <input v-model="profileForm.city" type="text" />
            </div>
            <div class="form-group full-width">
              <label>Adresse professionnelle</label>
              <input v-model="profileForm.professionalAddress" type="text" />
            </div>
            <div class="form-group full-width">
              <label>Coordonnées GPS</label>
              <div class="gps-container-simple">
                <button type="button" class="btn-gps" @click="getCurrentLocation" :disabled="isLocating">
                  <span v-if="isLocating" class="spinner-tiny"></span>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-12a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                  {{ isLocating ? 'Localisation en cours...' : 'Mettre à jour ma position via GPS' }}
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="profileStatus.type" :class="['status-message', profileStatus.type]">
            {{ profileStatus.message }}
          </div>
          
          <button type="submit" class="btn-primary" :disabled="isUpdatingProfile">
            {{ isUpdatingProfile ? 'Enregistrement...' : 'Enregistrer les modifications' }}
          </button>
        </form>
      </div>

      <!-- Notifications Tab -->
      <div v-else-if="activeTab === 'notifications'" class="settings-section">
        <div class="section-badge">Notifications</div>
        <h4>Préférences de notification</h4>
        <p class="section-desc">Choisissez comment vous souhaitez être informé des nouvelles demandes et mises à jour.</p>
        
        <div class="settings-form">
          <div class="notification-options">
            <div class="notification-item">
              <div class="notification-info">
                <div class="notification-title">� Notifications WhatsApp</div>
                <p>Recevoir des alertes instantanées sur votre WhatsApp professionnel.</p>
              </div>
              <label class="switch">
                <input 
                  type="checkbox" 
                  v-model="notificationsForm.whatsappEnabled"
                  @change="handleToggleWhatsApp"
                  :disabled="isUpdatingNotifications"
                >
                <span class="slider round"></span>
              </label>
            </div>
          </div>
          
          <div v-if="notificationsStatus.type" :class="['status-message', notificationsStatus.type]">
            {{ notificationsStatus.message }}
          </div>
        </div>
      </div>

      <!-- Security Tab -->
      <div v-else-if="activeTab === 'security'" class="settings-section">
        <div class="section-badge">Sécurité</div>
        <h4>Réinitialiser le mot de passe</h4>
        <p class="section-desc">Choisissez un nouveau mot de passe fort pour protéger votre accès.</p>
        
        <form @submit.prevent="handleResetPassword" class="settings-form">
          <div class="form-group">
            <label>Nouveau mot de passe</label>
            <input 
              v-model="resetPasswordForm.newPassword" 
              type="password" 
              placeholder="••••••••" 
              required 
              :disabled="isResettingPassword"
            />
          </div>
          
          <div class="form-group">
            <label>Confirmer le mot de passe</label>
            <input 
              v-model="resetPasswordForm.confirmPassword" 
              type="password" 
              placeholder="••••••••" 
              required 
              :disabled="isResettingPassword"
            />
          </div>
          
          <div v-if="resetPasswordStatus.type" :class="['status-message', resetPasswordStatus.type]">
            {{ resetPasswordStatus.message }}
          </div>
          
          <button type="submit" class="btn-primary" :disabled="isResettingPassword">
            {{ isResettingPassword ? 'Modification...' : 'Changer le mot de passe' }}
          </button>
        </form>
      </div>
    </div>
  </div>

  <!-- Verification Modal for Old Password -->
  <div v-if="isVerifyModalOpen" class="modal-overlay" @click.self="isVerifyModalOpen = false">
    <div class="modal-card mini-modal">
      <header class="modal-header">
        <div class="modal-title-area">
          <h3>Vérification de sécurité</h3>
        </div>
        <button class="close-btn" @click="isVerifyModalOpen = false">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </header>
      <div class="modal-content">
        <p style="margin-bottom: 1.5rem; color: #64748b;">Veuillez entrer votre mot de passe actuel pour confirmer ce changement.</p>
        <div class="form-group">
          <label>Ancien mot de passe</label>
          <input 
            v-model="resetPasswordForm.oldPassword" 
            type="password" 
            placeholder="••••••••" 
            required 
            class="settings-input"
          />
        </div>
      </div>
      <footer class="modal-footer border-none">
        <button class="btn-reject" @click="isVerifyModalOpen = false" style="background: #f1f5f9; color: #64748b;">Annuler</button>
        <button class="btn-validate" @click="confirmResetPassword" :disabled="isResettingPassword">
          {{ isResettingPassword ? 'Confirmation...' : 'Confirmer & Modifier' }}
        </button>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  animation: fadeIn 0.4s ease-out;
  width: 100%;
  padding-bottom: 2rem;
}

.settings-card {
  background: white;
  border-radius: 28px;
  padding: 3rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.04);
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}
@media (max-width: 1024px) {
  .settings-card {
    padding: 2rem;
  }
}
@media (max-width: 768px) {
  .settings-card {
    padding: 1.5rem;
    border-radius: 20px;
  }
}

.settings-card-header {
  margin-bottom: 2.5rem;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 1.5rem;
}

.settings-card-header h3 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.settings-card-header p {
  color: #64748b;
  font-size: 0.95rem;
  margin-bottom: 2rem;
}

.settings-nav {
  display: flex;
  gap: 0.5rem;
  background: #f1f5f9;
  padding: 0.4rem;
  border-radius: 14px;
  width: 100%;
  margin: 0;
  overflow-x: auto;
  max-width: 100%;
  scrollbar-width: none; /* Firefox */
}

.settings-nav::-webkit-scrollbar {
  height: 4px;
}

.settings-nav::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}


.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 1.5rem;
  border: none;
  background: transparent;
  color: #64748b;
  font-weight: 700;
  font-size: 0.9rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  white-space: nowrap;
  gap: 0;
}

.nav-icon-svg {
  display: inline-block;
  width: 18px;
  height: 18px;
  vertical-align: middle;
  color: #2b69ad;
}

.nav-item .nav-text {
  margin-left: 0.5rem;
}

.nav-item:hover {
  color: #2b69ad;
}

.nav-item.active {
  background: white;
  color: #2b69ad;
  box-shadow: 0 4px 12px rgba(43, 105, 173, 0.1);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.section-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: #f0f7ff;
  color: #2b69ad;
  font-size: 0.8rem;
  font-weight: 800;
  border-radius: 10px;
  width: fit-content;
  margin-bottom: 1rem;
  border: 1px solid #d0e7ff;
}

.settings-section h4 {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.section-desc {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 1rem;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.settings-form .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.settings-form label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #475569;
}

.settings-form input {
  padding: 1rem 1.25rem;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  font-size: 1rem;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f8fafc;
}

.settings-form input:hover {
  border-color: #cbd5e1;
}

.settings-form input:focus {
  outline: none;
  border-color: #2b69ad;
  background: white;
  box-shadow: 0 0 0 4px rgba(43, 105, 173, 0.1);
  transform: translateY(-1px);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.25rem;
}

@media (min-width: 768px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
  }
}

.form-group.full-width {
  grid-column: 1 / -1;
}


.loading-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  color: #64748b;
  justify-content: center;
  background: #f8fafc;
  border-radius: 12px;
}

.spinner-small {
  width: 20px;
  height: 20px;
  border: 2px solid #f1f5f9;
  border-top-color: #2b69ad;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.gps-container-simple {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0.5rem 0;
}

.btn-gps {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #f1f5f9;
  color: #2b69ad;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-gps:hover:not(:disabled) {
  background: #e2e8f0;
  border-color: #2b69ad;
}

.btn-gps:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.spinner-tiny {
  width: 14px;
  height: 14px;
  border: 2px solid #e2e8f0;
  border-top-color: #2b69ad;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.border-top {
  border-top: 1px solid #f1f5f9;
  padding-top: 2rem;
}

/* Notification Toggles */
.notification-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.notification-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: #f8fafc;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  transition: all 0.2s;
}

@media (max-width: 640px) {
  .notification-item {
    padding: 1.25rem;
    gap: 1rem;
  }
  
  .notification-title {
    font-size: 0.95rem;
  }
  
  .notification-info p {
    font-size: 0.8rem;
  }
}

.notification-item:hover {
  border-color: #e2e8f0;
  background: #f1f5f9;
}

.notification-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.notification-title {
  font-weight: 800;
  color: #1e293b;
  font-size: 1rem;
}

.notification-info p {
  font-size: 0.85rem;
  color: #64748b;
  margin: 0;
}

/* Switch Styles */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #cbd5e1;
  transition: .4s;
}

.slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
}

input:checked + .slider {
  background-color: #2b69ad;
}

input:focus + .slider {
  box-shadow: 0 0 1px #2b69ad;
}

input:checked + .slider:before {
  transform: translateX(22px);
}

.slider.round {
  border-radius: 34px;
}

.slider.round:before {
  border-radius: 50%;
}

.status-message {
  padding: 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  text-align: center;
}

.status-message.success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.status-message.error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.settings-form .btn-primary {
  background: linear-gradient(135deg, #2b69ad 0%, #1d4d82 100%);
  color: white;
  padding: 1.1rem 2rem;
  border: none;
  border-radius: 16px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1rem;
  box-shadow: 0 4px 15px rgba(43, 105, 173, 0.2);
  width: fit-content;
}

.settings-form .btn-primary:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(43, 105, 173, 0.3);
  filter: brightness(1.1);
}

.settings-form .btn-primary:active {
  transform: translateY(-1px);
}

.settings-form .btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Modal and Utility classes needed by settings but defined globally in page1 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-card {
  background: white;
  border-radius: 24px;
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
}

.mini-modal {
  max-width: 450px !important;
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.modal-content {
  padding: 2rem;
}

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  position: sticky;
  bottom: 0;
  background: white;
}

.border-none {
  border: none !important;
}

.close-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #475569;
}

.settings-input {
  padding: 0.875rem 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-reject {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.btn-validate {
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  background: #2b69ad;
  color: white;
  border: none;
  cursor: pointer;
}
@media (max-width: 768px) {
  .settings-nav {
    width: 100%;
    margin: 0;
    gap: 0.25rem;
    padding: 0.3rem;
    justify-content: space-between;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }
  
  .settings-nav::-webkit-scrollbar {
    display: none;
  }
  
  .nav-item {
    padding: 0.8rem 0.5rem !important;
    font-size: 0.8rem;
    border-radius: 12px;
    flex: 1;
    text-align: center;
    min-width: unset !important;
    flex-direction: column !important;
    gap: 0.35rem !important;
    background: rgba(255, 255, 255, 0.5);
    margin: 0 2px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .nav-item.active {
    background: white;
    box-shadow: 0 10px 20px rgba(43, 105, 173, 0.12);
    transform: translateY(-2px);
  }

  .nav-text {
    display: none;
  }

  .nav-icon-svg {
    display: block !important;
    width: 28px !important;
    height: 28px !important;
    margin: 0 auto !important;
    padding: 0 !important;
  }

  .settings-form .btn-primary,
  .btn-gps {
    width: 100%;
    padding: 1rem;
    display: flex;
    justify-content: center;
    margin: 1rem auto 0;
  }
  
  .btn-gps {
    margin: 0.5rem 0;
  }
  
  .section-badge {
    display: none;
  }
  
  .settings-card-header p {
    font-size: 0.85rem;
  }
}

@media (max-width: 380px) {
  .nav-item {
    padding: 0.6rem 0.35rem !important;
    font-size: 0.75rem;
    letter-spacing: -0.02em;
  }
}
</style>
