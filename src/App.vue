<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storage } from './utils/storage'
import { useLanguage, type Lang } from './composables/useLanguage'
import Navbar from './components/Navbar.vue'
import Login from './components/login/Login.vue'
import Signup from './components/login/signup.vue'
import ForgotPassword from './components/login/ForgotPassword.vue'
import ResetPassword from './components/login/ResetPassword.vue'
import VerificationPage from './pages/VerificationPage.vue'
import LandingPage from './components/landingpage.vue'
import ProDashboard from './components/Professional/page1.vue'
import AdminDashboard from './components/Admin/Dashboaed.vue'
import AdminManagementPage from './components/Admin/AdminManagementPage.vue'
import BookingForm from './components/HelpRequestForm.vue'
import NurseBookingForm from './components/NurseBookingForm.vue'
import ServiceSoinsPage from './components/ServiceSoinsPage.vue'
import ServiceSelection from './components/ServiceSelection.vue'

const { currentLang, setLang } = useLanguage();

const currentView = ref('landing')
const resetToken = ref('')
const selectedService = ref('')
const selectedServiceId = ref<number | null>(null)
const selectedSoinId = ref<number | null>(null)
const showLangPopup = ref(false)

interface MedicalRequest {
  id: number;
  clientName: string;
  type: string;
  urgency: 'high' | 'medium' | 'low';
  time: string;
  distance: string;
  description: string;
}

const medicalRequests = ref<MedicalRequest[]>([]);

onMounted(() => {
  // Show language popup if no preference saved yet
  if (!localStorage.getItem('daricare_lang')) {
    showLangPopup.value = true;
  }

  // Check for reset password token in URL
  const fullUrl = window.location.href;
  const url = new URL(fullUrl.replace('/#/', '/'));
  const resetPassToken = url.searchParams.get('token');
  const path = window.location.pathname;

  if ((path.endsWith('/reset-password') || fullUrl.includes('/reset-password')) && resetPassToken) {
    resetToken.value = resetPassToken;
    currentView.value = 'reset-password';
    const baseUrl = fullUrl.split('/reset-password')[0] || '/';
    window.history.replaceState({}, document.title, baseUrl);
    return;
  }

  const token = storage.getItem('access_token');
  const role = storage.getItem('user_role');
  const status = storage.getItem('user_status');

  if (token && role) {
    if (status === 'PENDING') {
      currentView.value = 'verification';
    } else if (role === 'admin') {
      currentView.value = 'admin-dashboard';
    } else if (role === 'professional') {
      currentView.value = 'pro';
    }
  }
});

const chooseLang = (lang: Lang) => {
  setLang(lang);
  showLangPopup.value = false;
};

const handleNewRequest = (data: any) => {
  const newRequest: MedicalRequest = {
    id: Date.now(),
    clientName: data.name,
    type: data.serviceType || 'Aide générale',
    urgency: data.urgency as any,
    time: 'A l\'instant',
    distance: 'Calcul...',
    description: data.description
  };
  medicalRequests.value.unshift(newRequest);
};
</script>

<template>
  <div class="app-container" :class="{ 'lang-ar': currentLang === 'ar' }">

    <!-- ── Language Picker Popup ── -->
    <Transition name="pop">
      <div v-if="showLangPopup" class="lang-popup-overlay">
        <div class="lang-popup">
          <!-- Logo -->
          <div class="popup-logo">
            <img src="./assets/LOGO H.png" alt="DariCare" />
          </div>

          <h2 class="popup-title">
            {{ currentLang === 'ar' ? 'اختر لغتك' : 'Choisissez votre langue' }}
          </h2>
          <p class="popup-subtitle">
            {{ currentLang === 'ar'
              ? 'يمكنك تغييرها في أي وقت من شريط التنقل.'
              : 'Vous pourrez la changer à tout moment dans la barre de navigation.' }}
          </p>

          <div class="popup-options">
            <!-- French -->
            <button class="lang-option" @click="chooseLang('fr')">
              <span class="lang-flag">🇫🇷</span>
              <span class="lang-name">Français</span>
              <span class="lang-tag">Par défaut</span>
            </button>

            <!-- Arabic -->
            <button class="lang-option lang-option-ar" @click="chooseLang('ar')">
              <span class="lang-flag">🇸🇦</span>
              <span class="lang-name">العربية</span>
              <span class="lang-tag">عربي</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Navbar
      v-if="currentView === 'landing' || currentView === 'service-soins' || currentView === 'booking' || currentView === 'nurse-booking'"
      @navigate="(view: string, service?: string) => { currentView = view; if (service) selectedService = service; }"
    />
    
    <main>
      <LandingPage
        v-if="currentView === 'landing'"
        @navigate="(view: string, serviceId?: number, soinId?: number) => { 
          currentView = view; 
          if (serviceId != null) selectedServiceId = serviceId;
          if (soinId != null) selectedSoinId = soinId;
          else selectedSoinId = null;
        }"
      />
      <ServiceSelection
        v-else-if="currentView === 'service-selection'"
        @navigate="(view: string, serviceId?: number) => { 
          currentView = view; 
          if (serviceId != null) selectedServiceId = serviceId; 
        }"
      />
      <ServiceSoinsPage
        v-else-if="currentView === 'service-soins'"
        :serviceId="selectedServiceId || 0"
        :initialSoinId="selectedSoinId ?? undefined"
        @navigate="(view: string) => currentView = view"
        @save="(payload) => { console.log('Saved soin form:', payload); }"
      />
      <ProDashboard 
        v-else-if="currentView === 'pro'" 
        :requests="medicalRequests"
        @navigate="(view) => currentView = view" 
      />
      <AdminDashboard
        v-else-if="currentView === 'admin-dashboard'"
        @navigate="(view: string) => currentView = view"
      />
      <AdminManagementPage
        v-else-if="currentView === 'admin-management'"
        @navigate="(view: string) => currentView = view"
      />
      <BookingForm 
        v-else-if="currentView === 'booking'" 
        :initialService="selectedService"
        @navigate="(view) => currentView = view" 
        @submit="handleNewRequest"
      />
      <NurseBookingForm
        v-else-if="currentView === 'nurse-booking'"
        :service="selectedService"
        @navigate="(view: string) => currentView = view"
        @submit="handleNewRequest"
      />
      <Signup v-else-if="currentView === 'signup'" @navigate="(view: string) => currentView = view" />
      <ForgotPassword v-else-if="currentView === 'forgot-password'" @navigate="(view) => currentView = view" />
      <ResetPassword v-else-if="currentView === 'reset-password'" :token="resetToken" @navigate="(view) => currentView = view" />
      <VerificationPage v-else-if="currentView === 'verification'" @navigate="(view) => currentView = view" />
      <Login v-else @navigate="(view) => currentView = view" />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');

:root {
  --primary-color: #2b69ad;
  --secondary-color: #69aa62;
  --text-dark: #1e293b;
  --text-light: #64748b;
  --bg-light: #f8fafc;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-light);
  color: var(--text-dark);
  -webkit-font-smoothing: antialiased;
}

.lang-ar body,
.lang-ar {
  font-family: 'Tajawal', 'Inter', sans-serif;
}

#app {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
  width: 100%;
}

/* ── Language Popup ── */
.lang-popup-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 15, 40, 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.lang-popup {
  background: #ffffff;
  border-radius: 28px;
  padding: 3rem 2.5rem;
  max-width: 500px;
  width: calc(100% - 2rem);
  text-align: center;
  box-shadow: 0 40px 80px rgba(0,0,0,0.3);
  animation: popIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.popup-logo {
  margin-bottom: 1.75rem;
}
.popup-logo img {
  height: 48px;
  width: auto;
}

.popup-title {
  font-size: 1.65rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0 0 0.6rem;
  letter-spacing: -0.02em;
}

.popup-subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0 0 2.25rem;
  line-height: 1.5;
}

.popup-options {
  display: flex;
  gap: 1rem;
}

.lang-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.75rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 20px;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
}

.lang-option:hover {
  border-color: #2b69ad;
  background: #eff6ff;
  transform: translateY(-4px);
  box-shadow: 0 12px 30px rgba(43, 105, 173, 0.18);
}

.lang-option-ar:hover {
  border-color: #059669;
  background: #f0fdf4;
  box-shadow: 0 12px 30px rgba(5, 150, 105, 0.18);
}

.lang-flag {
  font-size: 2.5rem;
  line-height: 1;
}

.lang-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
}

.lang-tag {
  font-size: 0.72rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

/* Popup transition */
.pop-enter-active { animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.pop-leave-active { animation: popOut 0.25s ease-in; }

.pop-enter-active .lang-popup-overlay,
.pop-leave-active .lang-popup-overlay {
  transition: opacity 0.3s;
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes popOut {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.9); }
}
</style>
