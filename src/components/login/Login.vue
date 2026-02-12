<script setup lang="ts">
import { ref } from 'vue';
import { storage } from '../../utils/storage';

const emit = defineEmits(['navigate']);

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const errorMessage = ref('');
const isLoading = ref(false);
const rememberMe = ref(false);

const handleLogin = async () => {
  errorMessage.value = '';
  isLoading.value = true;
  
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Check if user is banned
      if (errorData.message && errorData.message.includes('banned')) {
        throw new Error(errorData.message);
      }
      throw new Error(errorData.message || 'Invalid credentials');
    }

    const data = await response.json();
    console.log('Login successful:', data);

    // Store token and user info
    storage.clear(); // Clear existing to avoid mixups
    
    storage.setItem('access_token', data.access_token, rememberMe.value);
    const userId = data.id || (data.user && data.user.id);
    if (userId) {
      console.log('Storing user_id:', userId);
      storage.setItem('user_id', userId, rememberMe.value);
    } else {
      console.warn('Login successful but no ID found in response:', data);
    }
    storage.setItem('user_role', data.role, rememberMe.value);
    storage.setItem('user_name', data.name, rememberMe.value);
    storage.setItem('user_status', data.status, rememberMe.value);

    if (data.status === 'PENDING') {
      emit('navigate', 'verification');
    } else if (data.role === 'admin') {
      emit('navigate', 'admin-dashboard');
    } else if (data.role === 'professional') {
      emit('navigate', 'pro');
    } else {
      // Handle other roles or default to landing
      emit('navigate', 'landing');
    }
  } catch (err: any) {
    console.error('Login error:', err);
    errorMessage.value = err.message || 'Connection failed. Please try again.';
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
        <h1>L'excellence des soins, <br/>à votre service.</h1>
        <p>Rejoignez notre réseau de professionnels de santé et gérez vos rendez-vous en toute simplicité.</p>
        
        <div class="stats-grid">
          <div class="stat-item">
            <span class="stat-value">10k+</span>
            <span class="stat-label">Patients</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">500+</span>
            <span class="stat-label">IDEL</span>
          </div>
        </div>

        <div class="support-message">
          <p>Besoin d'aide ? <a href="#">Contactez notre support</a></p>
        </div>
      </div>
    </div>

    <!-- Right Side: Login Form -->
    <div class="login-form-side">
      <div class="login-card">
        <div class="login-header">
          <h1>Bon retour</h1>
          <p>Veuillez entrer vos coordonnées pour vous connecter.</p>
        </div>

        <!-- Error Message -->
        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div class="input-group">
            <label for="email">Email</label>
            <div class="input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <input 
                v-model="email" 
                type="text" 
                id="email" 
                placeholder="nom@entreprise.com" 
                required
                :disabled="isLoading"
              />
            </div>
          </div>

          <div class="input-group">
            <label for="password">Mot de passe</label>
            <div class="input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input 
                v-model="password" 
                :type="showPassword ? 'text' : 'password'" 
                id="password" 
                placeholder="••••••••" 
                required
                :disabled="isLoading"
              />
              <button 
                type="button" 
                class="toggle-password" 
                @click="showPassword = !showPassword"
                tabindex="-1"
                :disabled="isLoading"
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

          <div class="form-options">
            <label class="checkbox-container">
              <input type="checkbox" v-model="rememberMe" :disabled="isLoading">
              <span class="checkmark"></span>
              Se souvenir de moi
            </label>
            <a href="#" class="forgot-link" @click.prevent="emit('navigate', 'forgot-password')">Mot de passe oublié ?</a>
          </div>

          <button type="submit" class="login-button" :disabled="isLoading">
            {{ isLoading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <div class="login-footer">
          <p>Vous n'avez pas de compte ? <a href="#" @click.prevent="emit('navigate', 'signup')">En créer un</a></p>
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
  font-size: 2rem;
  font-weight: 800;
}

.stat-label {
  font-size: 1rem;
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

.toggle-password {
  position: absolute;
  right: 1rem;
  background: none;
  border: none;
  color: #a0aec0;
  cursor: pointer;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--text-light);
  user-select: none;
}

.forgot-link {
  color: var(--primary-color);
  text-decoration: none;
  font-weight: 600;
}

.forgot-link:hover {
  text-decoration: underline;
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

/* Responsive */
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

