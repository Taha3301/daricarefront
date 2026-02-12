<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits(['navigate']);

const email = ref('');
const isLoading = ref(false);
const message = ref('');
const errorMessage = ref('');
const isSuccess = ref(false);

const handleForgotPassword = async () => {
  errorMessage.value = '';
  message.value = '';
  isLoading.value = true;
  
  try {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({
        email: email.value
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      if (response.status === 404) {
        throw new Error('Aucun compte n\'est associé à cette adresse email.');
      }
      throw new Error(errorData.message || 'Une erreur est survenue.');
    }

    const data = await response.json();
    isSuccess.value = true;
    message.value = data.message || "Un lien de réinitialisation a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception.";
  } catch (err: any) {
    console.error('Forgot password error:', err);
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
        <h1>Récupérez votre <br/>accès en un clic.</h1>
        <p>Entrez votre adresse email et nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.</p>
        
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">Simple</span>
            <span class="stat-label">Processus rapide</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">Sécurisé</span>
            <span class="stat-label">Chiffrement AES</span>
          </div>
        </div>

        <div class="support-message">
          <p>Besoin d'aide ? <a href="#">Contactez notre support</a></p>
        </div>
      </div>
    </div>

    <div class="login-form-side">
      <div class="login-card">
        <button class="back-pill" @click="emit('navigate', 'login')">
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
             <line x1="19" y1="12" x2="5" y2="12"></line>
             <polyline points="12 19 5 12 12 5"></polyline>
           </svg>
           Retour
        </button>
        <div class="login-header">
          <h1>Mot de passe oublié</h1>
          <p>Pas d'inquiétude, cela arrive. Entrez votre email ci-dessous.</p>
        </div>

        <!-- Feedback Messages -->
        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>
        <div v-if="isSuccess" class="success-banner">
          <div class="success-icon">📧</div>
          <p>{{ message }}</p>
          <button class="login-button" @click="emit('navigate', 'login')">Retour à la connexion</button>
        </div>

        <form v-if="!isSuccess" @submit.prevent="handleForgotPassword" class="login-form">
          <div class="input-group">
            <label for="email">Email</label>
            <div class="input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input 
                v-model="email" 
                type="email" 
                id="email" 
                placeholder="nom@entreprise.com" 
                required
                :disabled="isLoading"
              />
            </div>
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            {{ isLoading ? 'Envoi du lien...' : 'Envoyer le lien de réinitialisation' }}
          </button>
        </form>

        <div class="login-footer" v-if="!isSuccess">
          <p>Vous vous en souvenez ? <a href="#" @click.prevent="emit('navigate', 'login')">Se connecter</a></p>
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
  position: relative;
}

.back-pill {
  margin-bottom: 2rem;
  background: #f1f5f9;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-light);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.back-pill:hover {
  background: var(--primary-color);
  color: white;
}

.login-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-dark);
  margin: 0.5rem 0 0.5rem 0;
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
  padding: 0.8rem 1rem 0.8rem 3rem;
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
