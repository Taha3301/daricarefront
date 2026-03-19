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
import HelpPage from './pages/HelpPage.vue'
import AboutPage from './pages/AboutPage.vue'
import AvisPage from './pages/AvisPage.vue'
import { PushNotificationService } from './services/PushNotificationService'

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

  // Initialize Push Notifications for Mobile
  PushNotificationService.init();

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

  // Check for deep-link view param (e.g. ?view=avis sent via email)
  const deepView = url.searchParams.get('view');
  const allowedPublicViews = ['avis', 'about', 'help', 'landing'];
  if (deepView && allowedPublicViews.includes(deepView)) {
    currentView.value = deepView;
    window.history.replaceState({}, document.title, window.location.pathname);
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
              <span class="lang-flag">🇹🇳</span>
              <span class="lang-name">العربية</span>
              <span class="lang-tag">تونس</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <Navbar
      v-if="currentView === 'landing' || currentView === 'service-soins' || currentView === 'booking' || currentView === 'nurse-booking' || currentView === 'help' || currentView === 'about' || currentView === 'avis'"
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
      <HelpPage v-else-if="currentView === 'help'" @navigate="(view: string) => currentView = view" />
      <AboutPage v-else-if="currentView === 'about'" @navigate="(view: string) => currentView = view" />
      <AvisPage v-else-if="currentView === 'avis'" @navigate="(view: string) => currentView = view" />
      <Signup v-else-if="currentView === 'signup'" @navigate="(view: string) => currentView = view" />
      <ForgotPassword v-else-if="currentView === 'forgot-password'" @navigate="(view) => currentView = view" />
      <ResetPassword v-else-if="currentView === 'reset-password'" :token="resetToken" @navigate="(view) => currentView = view" />
      <VerificationPage v-else-if="currentView === 'verification'" @navigate="(view) => currentView = view" />
      <Login v-else @navigate="(view) => currentView = view" />
    </main>

    <!-- Floating WhatsApp Button -->
    <Transition name="fade">
      <a
        v-if="currentView !== 'pro' && currentView !== 'admin-dashboard' && currentView !== 'admin-management' && currentView !== 'verification'"
        class="floating-whatsapp-btn"
        href="https://wa.me/21621918926"
        target="_blank"
        rel="noopener noreferrer"
        :title="currentLang === 'ar' ? 'تواصل عبر واتساب' : 'Contactez-nous sur WhatsApp'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </Transition>

    <!-- Floating Avis Button -->
    <Transition name="fade">
      <button 
        v-if="currentView !== 'avis' && currentView !== 'pro' && currentView !== 'admin-dashboard' && currentView !== 'admin-management' && currentView !== 'verification'"
        class="floating-avis-btn"
        @click="currentView = 'avis'"
        :title="currentLang === 'ar' ? 'اترك تقييمًا' : 'Laisser un avis'"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>
      </button>
    </Transition>
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

/* ── Floating WhatsApp Button ── */
.floating-whatsapp-btn {
  position: fixed;
  bottom: 6rem;
  right: 2rem;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #25D366;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(37, 211, 102, 0.45);
  z-index: 998;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: pulse-whatsapp 2s infinite;
}

.floating-whatsapp-btn:hover {
  transform: scale(1.15) rotate(15deg);
  background: #1ebe5d;
  box-shadow: 0 12px 28px rgba(37, 211, 102, 0.6);
}

.lang-ar .floating-whatsapp-btn {
  right: auto;
  left: 2rem;
}

@keyframes pulse-whatsapp {
  0% { box-shadow: 0 8px 20px rgba(37, 211, 102, 0.45), 0 0 0 0 rgba(37, 211, 102, 0.5); }
  70% { box-shadow: 0 8px 20px rgba(37, 211, 102, 0.45), 0 0 0 15px rgba(37, 211, 102, 0); }
  100% { box-shadow: 0 8px 20px rgba(37, 211, 102, 0.45), 0 0 0 0 rgba(37, 211, 102, 0); }
}

@media (max-width: 768px) {
  .floating-whatsapp-btn {
    bottom: 5.5rem;
    right: 1.5rem;
    width: 46px;
    height: 46px;
  }
  .lang-ar .floating-whatsapp-btn {
    left: 1.5rem;
  }
}

/* ── Floating Avis Button ── */
.floating-avis-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 25px rgba(43, 105, 173, 0.4), 0 0 0 0 rgba(43, 105, 173, 0.2);
  z-index: 998;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: pulse 2s infinite;
}

.floating-avis-btn:hover {
  transform: scale(1.1) rotate(12deg);
  background: #1d4d82;
  box-shadow: 0 15px 30px rgba(43, 105, 173, 0.5);
}

.lang-ar .floating-avis-btn {
  right: auto;
  left: 2rem;
}

@keyframes pulse {
  0% { box-shadow: 0 10px 25px rgba(43, 105, 173, 0.4), 0 0 0 0 rgba(43, 105, 173, 0.4); }
  70% { box-shadow: 0 10px 25px rgba(43, 105, 173, 0.4), 0 0 0 15px rgba(43, 105, 173, 0); }
  100% { box-shadow: 0 10px 25px rgba(43, 105, 173, 0.4), 0 0 0 0 rgba(43, 105, 173, 0); }
}

@media (max-width: 768px) {
  .floating-avis-btn {
    display: none;
  }
}
</style>
