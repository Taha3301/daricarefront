<script setup lang="ts">
import { ref } from 'vue';
import { useLanguage } from '../../composables/useLanguage';
import { getApiUrl } from '../../config/api';
import { storage } from '../../utils/storage';
import logoUrl from '../../assets/LOGO H.png';

const { t, currentLang } = useLanguage();
const emit = defineEmits(['navigate']);

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const isLoading = ref(false);
const rememberMe = ref(false);
const errorMessage = ref('');
const currentStep = ref(1);

const nextStep = () => {
  if (name.value && email.value) {
    currentStep.value = 2;
  }
};

const prevStep = () => {
  currentStep.value = 1;
};

const handleSignup = async () => {
  errorMessage.value = '';
  
  if (password.value !== confirmPassword.value) {
    errorMessage.value = currentLang.value === 'ar' ? 'كلمات المرور غير متطابقة.' : 'Les mots de passe ne correspondent pas.';
    return;
  }

  isLoading.value = true;
  
  try {
    const response = await fetch(getApiUrl('/auth/professional/register'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': '*/*'
      },
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        name: name.value
      })
    });

    const data = await response.json();
    console.log('Signup successful:', data);
    
    // Store user_id and token if returned
    storage.clear(); // Clear existing to avoid mixups
    
    const userId = data.id || (data.user && data.user.id);
    if (userId) {
      console.log('Storing user_id after signup:', userId);
      storage.setItem('user_id', userId, rememberMe.value);
    }
    if (data.access_token) {
      storage.setItem('access_token', data.access_token, rememberMe.value);
    }

    alert(currentLang.value === 'ar' ? 'تم إنشاء الحساب بنجاح! يرجى تسجيل الدخول.' : 'Compte créé avec succès ! Veuillez vous connecter.');
    emit('navigate', 'login');
  } catch (err: any) {
    console.error('Signup error:', err);
    errorMessage.value = err.message || (currentLang.value === 'ar' ? 'فشل الاتصال. يرجى المحاولة مرة أخرى.' : 'La connexion a échoué. Veuillez réessayer.');
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="signup-wrapper">
    <!-- Left Side: Brand/Info -->
    <div class="signup-info-side">
      <div class="info-content">
        <div class="brand-badge" @click="emit('navigate', 'landing')" style="cursor: pointer;">
          <img :src="logoUrl" alt="daricare logo" class="brand-logo-img" />
        </div>
        <h1>{{ t.signup_title }}</h1>
        <p>{{ t.signup_subtitle }}</p>
        
        
      </div>
    </div>

    <!-- Right Side: Signup Form -->
    <div class="signup-form-side">
      <div class="signup-card">
        <button class="back-to-home" @click="emit('navigate', 'landing')" title="Retour à l'accueil">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div class="card-logo" @click="emit('navigate', 'landing')">
          <img :src="logoUrl" alt="daricare logo" />
        </div>
        <div class="signup-header">
          <h1>{{ t.signup_welcome }}</h1>
          <p>{{ t.signup_fields_subtitle }}</p>
        </div>

        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>

        <form @submit.prevent="handleSignup" class="signup-form">
          <!-- Step 1: Name & Email -->
          <div v-if="currentStep === 1" class="step-container">
            <div class="input-group">
              <label for="name">{{ t.signup_name_label }}</label>
              <div class="input-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <input 
                  v-model="name" 
                  type="text" 
                  id="name" 
                  placeholder="Dr. Jean Dupont" 
                  required
                  :disabled="isLoading"
                />
              </div>
            </div>

            <div class="input-group">
              <label for="email">{{ t.login_email_label }}</label>
              <div class="input-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="input-icon">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input 
                  v-model="email" 
                  type="email" 
                  id="email" 
                  placeholder="jean@exemple.com" 
                  required
                  :disabled="isLoading"
                />
              </div>
            </div>

            <button type="button" class="signup-button" @click="nextStep" :disabled="!name || !email">
              {{ currentLang === 'ar' ? 'التالي' : 'Suivant' }}
            </button>
          </div>

          <!-- Step 2: Password -->
          <div v-if="currentStep === 2" class="step-container">
            <div class="input-group">
              <label for="password">{{ t.login_password_label }}</label>
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

            <div class="input-group">
              <label for="confirmPassword">{{ t.login_password_label }} ({{ t.nav_lang_label }})</label>
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
              </div>
            </div>

            <div class="form-options">
              <label class="checkbox-container">
                <input type="checkbox" v-model="rememberMe" :disabled="isLoading">
                <span class="checkmark"></span>
                {{ t.login_remember_me }}
              </label>
            </div>

            <div class="button-group">
              <button type="button" class="back-button" @click="prevStep" :disabled="isLoading">
                {{ currentLang === 'ar' ? 'السابق' : 'Retour' }}
              </button>
              <button type="submit" class="signup-button" :disabled="isLoading || !password">
                {{ isLoading ? t.signup_loading : t.signup_btn }}
              </button>
            </div>
          </div>
        </form>

        <div class="signup-footer">
          <p>{{ t.signup_has_account }} <a href="#" @click.prevent="emit('navigate', 'login')">{{ t.login_btn }}</a></p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.signup-wrapper {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: white;
  overflow: hidden;
}

/* Left Side: Info */
.signup-info-side {
  flex: 1.2;
  background: linear-gradient(135deg, #1e3a8a 0%, #2b69ad 50%, #1d4d82 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  color: white;
  position: relative;
  overflow: hidden;
}

.signup-info-side::after {
  content: '';
  position: absolute;
  bottom: -10%;
  left: -10%;
  width: 400px;
  height: 400px;
  background: rgba(43, 105, 173, 0.1);
  border-radius: 50%;
  filter: blur(60px);
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



/* Right Side: Form */
.signup-form-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #f8fafc;
  overflow-y: auto;
  height: 100%;
}

.signup-card {
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 2.5rem;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
  position: relative;
}

.back-to-home {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #f8fafc;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4a5568;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 10;
}

.back-to-home:hover {
  background: #2b69ad;
  color: white;
  transform: translateX(-3px);
}

.signup-header {
  margin-bottom: 2.5rem;
  text-align: center;
}

.signup-header h1 {
  font-size: 2rem;
  font-weight: 700;
  color: #1a202c;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.5px;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
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
  color: #4a5568;
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
  border-color: #2b69ad;
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

.step-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.button-group {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.back-button {
  flex: 1;
  background: white;
  color: #4a5568;
  padding: 1rem;
  border: 2px solid #edf2f7;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-button:hover {
  background: #f8fafc;
  border-color: #cbd5e0;
}

.signup-button {
  flex: 2;
  background: #2b69ad;
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.signup-button:hover:not(:disabled) {
  background: #1d4d82;
  transform: translateY(-1px);
}

.signup-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.signup-footer {
  margin-top: 2rem;
  text-align: center;
  font-size: 0.95rem;
  color: #718096;
}

.signup-footer a {
  color: #2b69ad;
  font-weight: 700;
  text-decoration: none;
}

.signup-footer a:hover {
  text-decoration: underline;
}

.form-options {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  font-size: 0.875rem;
  margin-top: -0.5rem;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: #718096;
  user-select: none;
}

.error-banner {
  background: #fff5f5;
  color: #c53030;
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid #feb2b2;
  margin-bottom: 1.5rem;
  text-align: center;
  font-size: 0.9rem;
}

.card-logo {
  display: flex;
  justify-content: center;
  margin-bottom: 2rem;
  cursor: pointer;
}

.card-logo img {
  height: 48px;
  width: auto;
}

@media (max-width: 1024px) {
  .signup-info-side {
    display: none;
  }
}
</style>
