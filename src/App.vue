<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storage } from './utils/storage'
import Navbar from './components/Navbar.vue'
import Login from './components/login/Login.vue'
import Signup from './components/login/signup.vue'
import ForgotPassword from './components/login/ForgotPassword.vue'
import ResetPassword from './components/login/ResetPassword.vue'
import VerificationPage from './pages/VerificationPage.vue'
import LandingPage from './components/landingpage.vue'
import ProDashboard from './components/Professional/page1.vue'
import AdminDashboard from './components/Admin/Dashboaed.vue'
import BookingForm from './components/HelpRequestForm.vue'
import NurseBookingForm from './components/NurseBookingForm.vue'
import ServiceSoinsPage from './components/ServiceSoinsPage.vue'
import ServiceSelection from './components/ServiceSelection.vue'

const currentView = ref('landing')
const resetToken = ref('')
const selectedService = ref('')
const selectedServiceId = ref<number | null>(null)

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
  // Check for reset password token in URL
  const urlParams = new URLSearchParams(window.location.search);
  const resetPassToken = urlParams.get('token');
  const path = window.location.pathname;

  if (path === '/reset-password' && resetPassToken) {
    resetToken.value = resetPassToken;
    currentView.value = 'reset-password';
    // Clean up URL without reload
    window.history.replaceState({}, document.title, "/");
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
  <div class="app-container">
    <Navbar
      v-if="currentView === 'landing' || currentView === 'service-soins' || currentView === 'booking' || currentView === 'nurse-booking' || currentView === 'service-selection'"
      @navigate="(view: string, service?: string) => { currentView = view; if (service) selectedService = service; }"
    />
    
    <main>
      <LandingPage
        v-if="currentView === 'landing'"
        @navigate="(view: string, serviceId?: number) => { 
          currentView = view; 
          if (serviceId != null) selectedServiceId = serviceId; 
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
      <Signup v-else-if="currentView === 'signup'" @navigate="(view) => currentView = view" />
      <ForgotPassword v-else-if="currentView === 'forgot-password'" @navigate="(view) => currentView = view" />
      <ResetPassword v-else-if="currentView === 'reset-password'" :token="resetToken" @navigate="(view) => currentView = view" />
      <VerificationPage v-else-if="currentView === 'verification'" @navigate="(view) => currentView = view" />
      <Login v-else @navigate="(view) => currentView = view" />
    </main>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --primary-color: #2b69ad;
  --secondary-color: #69aa62;
  --text-dark: #1e293b;
  --text-light: #64748b;
  --bg-light: #f8fafc;
}

* {
  box-sizing: border-box;}

body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-light);
  color: var(--text-dark);
  -webkit-font-smoothing: antialiased;
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
</style>

