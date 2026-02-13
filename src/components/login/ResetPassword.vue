<script setup lang="ts">
import { ref } from 'vue';
import { getApiUrl } from '../../config/api';

const props = defineProps<{
  token: string;
}>();

const emit = defineEmits(['navigate']);

const newPassword = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');
const isSuccess = ref(false);

const handleResetPassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Les mots de passe ne correspondent pas.';
    return;
  }

  if (newPassword.value.length < 6) {
    errorMessage.value = 'Le mot de passe doit contenir au moins 6 caractères.';
    return;
  }

  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    const response = await fetch(getApiUrl('/auth/reset-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({
        token: props.token,
        newPassword: newPassword.value
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 401) {
        throw new Error('Le lien de réinitialisation est invalide ou a expiré.');
      }
      throw new Error(errorData.message || 'Une erreur est survenue.');
    }

    isSuccess.value = true;
    setTimeout(() => {
      emit('navigate', 'login');
    }, 3000);
  } catch (err: any) {
    console.error('Reset password error:', err);
    errorMessage.value = err.message || 'Une erreur est survenue. Veuillez réessayer.';
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="login-wrapper">
    <!-- Left Side: Brand/Info Content -->
    <div class="login-info-side">
      <div class="info-content">
        <div class="brand-badge" @click="emit('navigate', 'landing')" style="cursor: pointer;">
          <img src="../../assets/LOGO H.png" alt="daricare logo" class="brand-logo-img" />
        </div>
        <h1>Sécurisez votre <br/>compte daricare.</h1>
        <p>Choisissez un nouveau mot de passe fort pour protéger vos données et votre accès professionnel.</p>
        
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">Confidentialité</span>
            <span class="stat-label">Données protégées</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">Sécurité</span>
            <span class="stat-label">Accès vérifié</span>
          </div>
        </div>

        <div class="support-message">
          <p>Besoin d'aide ? <a href="#">Contactez notre support</a></p>
        </div>
      </div>
    </div>

    <!-- Right Side: Reset Password Form -->
    <div class="login-form-side">
      <div class="login-card">
        <div class="login-header">
          <h1>Nouveau mot de passe</h1>
          <p>Veuillez définir votre nouveau mot de passe ci-dessous.</p>
        </div>

        <!-- Feedback Messages -->
        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>
        
        <div v-if="isSuccess" class="success-banner">
          <div class="success-icon">✅</div>
          <h3>Succès !</h3>
          <p>Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion...</p>
          <button class="login-button" @click="emit('navigate', 'login')">Aller à la connexion</button>
        </div>

        <form v-if="!isSuccess" @submit.prevent="handleResetPassword" class="login-form">
          <div class="input-group">
            <label for="newPassword">Nouveau mot de passe</label>
            <div class="input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input 
                v-model="newPassword" 
                :type="showPassword ? 'text' : 'password'" 
                id="newPassword" 
                placeholder="••••••••" 
                required
                :disabled="isLoading"
              />
            </div>
          </div>

          <div class="input-group">
            <label for="confirmPassword">Confirmer le mot de passe</label>
            <div class="input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input 
                v-model="confirmPassword" 
                :type="showPassword ? 'text' : 'password'" 
                id="confirmPassword" 
                placeholder="••••••••" 
                required
                :disabled="isLoading"
              />
              <button 
                type="button" 
                class="toggle-password" 
                @click="showPassword = !showPassword"
                tabindex="-1"
              >
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            {{ isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe' }}
          </button>
        </form>

        <div class="login-footer" v-if="!isSuccess">
          <p>Vous n'avez plus besoin de réinitialiser ? <a href="#" @click.prevent="emit('navigate', 'login')">Se connecter</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  background-color: white;
}

/* Left Side: Info */
.login-info-side {
  flex: 1.2;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.login-info-side::before {
  content: '';
  position: absolute;
  top: -10%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.info-content {
  max-width: 500px;
  z-index: 1;
}

.brand-badge {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

.brand-logo-img {
  height: 60px;
  width: auto;
}

.info-content h1 {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  letter-spacing: -1px;
}

.info-content p {
  font-size: 1.25rem;
  opacity: 0.9;
  line-height: 1.6;
  margin-bottom: 3rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
}

.support-message {
  margin-top: 4rem;
  font-size: 0.95rem;
  opacity: 0.9;
}

.support-message a {
  color: white;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 4px;
}

/* Right Side: Form */
.login-form-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--bg-light);
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: white;
  padding: 3rem;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
}

.login-header {
  margin-bottom: 2.5rem;
  text-align: center;
}

.login-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.5px;
}

.login-header p {
  color: var(--text-light);
  line-height: 1.5;
}

.error-banner {
  background: #fff5f5;
  color: #c53030;
  padding: 0.75rem 1rem;
  border-radius: 12px;
  border: 1px solid #feb2b2;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  font-weight: 500;
  text-align: center;
}

.success-banner {
  background: #f0fdf4;
  color: #166534;
  padding: 2rem;
  border-radius: 16px;
  border: 1px solid #bbf7d0;
  text-align: center;
}

.success-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.success-banner h3 {
  margin-bottom: 0.5rem;
}

.success-banner p {
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-dark);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 1rem;
  color: #a0aec0;
}

.input-wrapper input {
  width: 100%;
  padding: 0.8rem 2.5rem 0.8rem 3rem;
  border: 2px solid #edf2f7;
  border-radius: 12px;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s ease;
}

.input-wrapper input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 4px rgba(43, 105, 173, 0.1);
}

.toggle-password {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
}

.login-button {
  background: var(--primary-color);
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 1rem;
  width: 100%;
}

.login-button:hover {
  background: #1d4d82;
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(43, 105, 173, 0.2);
}

.login-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.9rem;
  color: var(--text-light);
}

.login-footer a {
  color: var(--primary-color);
  font-weight: 600;
  text-decoration: none;
}

.login-footer a:hover {
  text-decoration: underline;
}

@media (max-width: 1024px) {
  .login-info-side {
    display: none;
  }
}

@media (max-width: 480px) {
  .login-card {
    padding: 2rem;
    box-shadow: none;
    border-radius: 0;
  }
}
</style>
