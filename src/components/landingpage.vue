<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from 'vue';
import { getApiUrl } from '../config/api';
import Footer from './Footer.vue';
import { useLanguage } from '../composables/useLanguage';

const { t, isAr } = useLanguage();

type Service = {
  id: number;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  image?: string | null;
  soins?: any[];
};

const emit = defineEmits<{
  (e: 'navigate', view: string, serviceId?: number, soinId?: number): void;
}>();

const services = ref<Service[]>([]);
const isLoading = ref(false);
const errorMsg = ref<string | null>(null);
const searchQuery = ref('');
const showDropdown = ref(false);

type SoinResult = {
  soinId: number;
  soinName: string;
  soinNameAr?: string | null;
  soinDesc: string;
  soinDescAr?: string | null;
  serviceId: number;
  serviceName: string;
  serviceNameAr?: string | null;
};

const allSoins = computed<SoinResult[]>(() => {
  const results: SoinResult[] = [];
  for (const svc of services.value) {
    for (const soin of (svc.soins || [])) {
      results.push({
        soinId: soin.id,
        soinName: soin.name,
        soinNameAr: soin.name_ar,
        soinDesc: soin.description || '',
        soinDescAr: soin.description_ar || '',
        serviceId: svc.id,
        serviceName: svc.name,
        serviceNameAr: svc.name_ar,
      });
    }
  }
  return results;
});

const filteredSoins = computed<SoinResult[]>(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return [];
  return allSoins.value.filter(s =>
    s.soinName.toLowerCase().includes(q) ||
    (s.soinNameAr && s.soinNameAr.includes(q)) ||
    s.soinDesc.toLowerCase().includes(q) ||
    (s.soinDescAr && s.soinDescAr.includes(q)) ||
    s.serviceName.toLowerCase().includes(q) ||
    (s.serviceNameAr && s.serviceNameAr.includes(q))
  ).slice(0, 20);
});

const selectSoin = (result: SoinResult) => {
  searchQuery.value = '';
  showDropdown.value = false;
  emit('navigate', 'service-soins', result.serviceId, result.soinId);
};

const onSearchFocus = () => { showDropdown.value = true; };
const onSearchBlur = () => { setTimeout(() => { showDropdown.value = false; }, 150); };

const fetchServices = async () => {
  const token = localStorage.getItem('access_token');
  try {
    isLoading.value = true;
    errorMsg.value = null;

    const headers: Record<string, string> = { accept: '*/*' };
    if (token) headers.Authorization = `Bearer ${token}`;

    // Using the /services/only endpoint to get services with images
    const response = await fetch(getApiUrl('/services/only'), { headers });

    if (response.status === 401) {
      console.warn('Unauthorized. Redirecting to login.');
      emit('navigate', 'login');
      return;
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch services (${response.status})`);
    }

    services.value = await response.json();
  } catch (err: any) {
    console.error('Failed to fetch services:', err);
    errorMsg.value = err?.message || 'Impossible de charger les services.';
  } finally {
    isLoading.value = false;
  }
};

const sortedServices = computed(() => {
  const last = new Set([2, 3]);
  const normal = services.value.filter(s => !last.has(s.id)).sort((a, b) => a.id - b.id);
  const deferred = services.value.filter(s => last.has(s.id)).sort((a, b) => a.id - b.id);
  return [...normal, ...deferred];
});

onMounted(() => {
  fetchServices();
});

onUnmounted(() => {
  // cleanup if any
});
</script>

<template>
  <div class="landing-page">
    <!-- Hero Section: Full Screen Premium -->
    <section class="hero-section">
      <!-- Background Image -->
      <div class="hero-bg">
        <div class="hero-overlay"></div>
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
        <div class="blob blob-3"></div>
      </div>
      
      <div class="container hero-content">
        <div class="hero-header">
          <h1 class="hero-title">
            {{ t.hero_title_1 }} <span class="highlight">{{ t.hero_title_highlight }}</span>{{ t.hero_title_2 }}
          </h1>
          <p class="hero-subtitle">{{ t.hero_subtitle }}</p>
        </div>
        
        <div class="search-bar-wrap">
          <div class="search-bar">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="t.search_placeholder"
              @focus="onSearchFocus"
              @blur="onSearchBlur"
            />
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Dropdown results -->
          <div v-if="showDropdown && searchQuery && filteredSoins.length > 0" class="search-dropdown">
            <button
              v-for="result in filteredSoins"
              :key="result.soinId"
              class="search-result-item"
              @mousedown.prevent="selectSoin(result)"
            >
              <div class="result-soin-name">{{ isAr && result.soinNameAr ? result.soinNameAr : result.soinName }}</div>
              <div class="result-service-name">{{ isAr && result.serviceNameAr ? result.serviceNameAr : result.serviceName }}</div>
            </button>
          </div>

          <!-- No results -->
          <div v-else-if="showDropdown && searchQuery && filteredSoins.length === 0" class="search-dropdown">
            <div class="search-no-results">{{ t.search_no_results_prefix }} "{{ searchQuery }}"</div>
          </div>
        </div>

        <div class="services-wrapper">
          <div v-if="isLoading" class="loader-wrap">
            <div class="spinner"></div>
            <p>{{ t.loading_services }}</p>
          </div>
          
          <div v-else-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
          
          <div v-else class="services-grid" :class="{ 'is-rtl': isAr }">
            <div 
              v-for="service in sortedServices.slice(0, 6)" 
              :key="service.id" 
              class="service-card"
              @click="emit('navigate', 'service-soins', service.id)"
            >
              <div 
                class="card-image" 
                :style="{ backgroundImage: service.image ? `url('${service.image}')` : 'none' }"
                role="img"
                :aria-label="isAr && service.name_ar ? service.name_ar : service.name"
              ></div>
              <div class="card-shimmer"></div>
              <div class="card-overlay"></div>
              <div class="card-content">
                <div class="card-text">
                  <h3 :dir="isAr ? 'rtl' : 'ltr'">{{ isAr && service.name_ar ? service.name_ar : service.name }}</h3>
                  <p v-if="service.description" class="service-teaser">
                    {{ isAr && service.description_ar ? service.description_ar : service.description }}
                  </p>
                </div>
                <div class="card-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path v-if="!isAr" d="M5 12h14"></path>
                    <path v-if="!isAr" d="M12 5l7 7-7 7"></path>
                    <path v-if="isAr" d="M19 12H5"></path>
                    <path v-if="isAr" d="M12 19l-7-7 7-7"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Content Section: Why Choose Us -->
    <section class="content-section">
      <div class="container">
        <div class="section-header">
          <h2 class="section-title">{{ t.features_title_1 }} <span class="highlight">{{ t.features_title_highlight }}</span> {{ t.features_title_2 }}</h2>
          <p class="section-subtitle">{{ t.features_subtitle }}</p>
        </div>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon icon-blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h3>{{ t.feat1_title }}</h3>
            <p>{{ t.feat1_desc }}</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon icon-green">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            </div>
            <h3>{{ t.feat2_title }}</h3>
            <p>{{ t.feat2_desc }}</p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon icon-purple">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
            </div>
            <h3>{{ t.feat3_title }}</h3>
            <p>{{ t.feat3_desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <Footer />
  </div>
</template>

<style scoped>
.landing-page {
  font-family: 'Outfit', sans-serif;
  min-height: 100vh;
  /* overflow: hidden; Removed to allow scrolling */
  position: relative;
  background: #f8fafc;
}

/* Premium Hero Section */
.hero-section {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  overflow: hidden;
  padding: 0 0 2rem;
}

/* Background Image */
.hero-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-image: url('../assets/bg.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  animation: kenBurns 40s ease-in-out infinite;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

@keyframes kenBurns {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 100%);
  z-index: 2;
}

/* Floating Blobs */
.blob {
  position: absolute;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  filter: blur(100px);
  z-index: 1;
  opacity: 0.4;
  pointer-events: none;
}

.blob-1 {
  top: -100px;
  right: -100px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0) 70%);
  animation: float-1 30s infinite alternate;
}

.blob-2 {
  bottom: -200px;
  left: -100px;
  background: radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, rgba(16, 185, 129, 0) 70%);
  animation: float-2 35s infinite alternate;
}

.blob-3 {
  top: 50%;
  left: 50%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0) 70%);
  animation: float-3 40s infinite alternate;
}

@keyframes float-1 {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(-100px, 100px) scale(1.1); }
}

@keyframes float-2 {
  0% { transform: translate(0, 0) scale(1.1); }
  100% { transform: translate(150px, -50px) scale(1); }
}

@keyframes float-3 {
  0% { transform: translate(-50%, -50%) rotate(0deg); }
  100% { transform: translate(-20%, -30%) rotate(180deg); }
}

/* Content Layout */
.hero-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.25rem;
  width: 100%;
  max-width: 1400px;
  padding: 0 2rem;
  padding-top: 6rem;
}

/* ── Search Bar ── */
.search-bar-wrap {
  width: 100%;
  max-width: 620px;
  position: relative;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: rgba(255, 255, 255, 0.4);
  border: 1.5px solid rgba(255, 255, 255, 0.6);
  border-radius: 99px;
  padding: 0.75rem 1.25rem;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: border-color 0.3s, box-shadow 0.3s;
}

.search-bar:focus-within {
  border-color: rgba(59, 130, 246, 0.7);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.search-icon {
  color: rgba(30, 41, 59, 0.6);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #1e293b;
  font-family: 'Outfit', sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
}

.search-input::placeholder {
  color: rgba(30, 41, 59, 0.5);
}

.search-clear {
  background: transparent;
  border: none;
  color: rgba(30, 41, 59, 0.5);
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 0;
  transition: color 0.2s;
  flex-shrink: 0;
}

.search-clear:hover {
  color: #1e293b;
}

/* ── Search Dropdown ── */
.search-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: rgba(10, 20, 50, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  overflow-y: auto;
  max-height: 320px;
  z-index: 100;
  box-shadow: 0 16px 40px rgba(0,0,0,0.4);
  animation: none;
}

.search-result-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  width: 100%;
  padding: 0.85rem 1.25rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  cursor: pointer;
  text-align: left;
  font-family: 'Outfit', sans-serif;
  transition: background 0.2s;
}

.search-result-item:last-child {
  border-bottom: none;
}

.search-result-item:hover {
  background: rgba(96, 165, 250, 0.15);
}

.result-soin-name {
  font-size: 0.92rem;
  font-weight: 700;
  color: #ffffff;
}

.result-service-name {
  font-size: 0.75rem;
  color: rgba(255,255,255,0.45);
  font-weight: 500;
}

.search-no-results {
  padding: 1rem 1.25rem;
  color: rgba(255,255,255,0.5);
  font-size: 0.9rem;
  font-family: 'Outfit', sans-serif;
}

/* Custom Scrollbar for Search Dropdown */
.search-dropdown::-webkit-scrollbar {
  width: 6px;
}

.search-dropdown::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.search-dropdown::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
}

.search-dropdown::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.hero-header {
  text-align: center;
}

.hero-title {
  font-size: 3.2rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.03em;
  line-height: 1;
  margin-bottom: 0.15rem;
  text-shadow: 0 2px 10px rgba(255,255,255,0.5);
}

.highlight {
  background: linear-gradient(120deg, #2b69ad 0%, #3b82f6 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1rem;
  color: #475569;
  font-weight: 600;
  text-shadow: 0 1px 4px rgba(255,255,255,0.3);
}

/* Services Grid */
.services-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  width: 100%;
  max-width: 1200px;
}

/* Glassmorphism Card */
.service-card {
  position: relative;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  /* Organic Multi-Axis Animation */
  animation: none;
  animation-delay: 0s;
  height: 200px;
  display: flex;
  align-items: flex-end; /* Align content to bottom */
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

.card-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.service-card:hover .card-image {
  transform: scale(1.1);
}

.service-card:hover {
  box-shadow: 0 25px 40px -10px rgba(59, 130, 246, 0.25);
  border-color: #3b82f6;
  z-index: 10;
}

.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(15, 23, 42, 0.95) 0%,
    rgba(15, 23, 42, 0.6) 50%,
    rgba(15, 23, 42, 0) 100%
  );
  z-index: 1;
  transition: all 0.5s ease;
}

.is-rtl .card-overlay {
  background: linear-gradient(
    to top,
    rgba(15, 23, 42, 0.95) 0%,
    rgba(15, 23, 42, 0.6) 50%,
    rgba(15, 23, 42, 0) 100%
  );
}

.service-card:hover .card-overlay {
  background: linear-gradient(
    to top,
    rgba(37, 99, 235, 0.9) 0%,
    rgba(29, 78, 216, 0.4) 100%
  );
}

/* Premium Shimmer Effect */
.card-shimmer {
  position: absolute;
  inset: 0;
  background: radial-gradient(
    circle at -100% 50%,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0) 60%
  );
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
  z-index: 1;
}

.service-card:hover .card-shimmer {
  opacity: 1;
  background-position: 200% 50%;
  transform: translateX(150%);
}

/* Removing the small icon style as we are using full background images */


.service-card:hover .service-img {
  transform: scale(1.1);
}

.card-content {
  position: relative;
  z-index: 2;
  padding: 1.5rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.is-rtl .card-content {
  flex-direction: row-reverse;
}

.card-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  overflow: hidden;
}

.card-content h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #ffffff;
  margin: 0;
  transition: all 0.3s ease;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  line-height: 1.2;
}

.service-teaser {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.service-card:hover h3 {
  color: white;
}

.card-icon {
  color: #3b82f6;
  display: flex;
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  background: #eff6ff;
  padding: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.service-card:hover .card-icon {
  background: #3b82f6;
  color: white;
  transform: scale(1.1);
}

.services-grid:not(.is-rtl) .service-card:hover .card-icon {
  transform: translateX(5px) scale(1.1);
}

.services-grid.is-rtl .service-card:hover .card-icon {
  transform: translateX(-5px) scale(1.1);
}

/* Content Section Styles */
.content-section {
  padding: 6rem 2rem;
  background: white;
  position: relative;
  z-index: 5;
}

.section-header {
  text-align: center;
  margin-bottom: 4rem;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.1rem;
  color: #64748b;
  line-height: 1.6;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  padding: 2.5rem;
  background: #f8fafc;
  border-radius: 24px;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.feature-card:hover {
  background: white;
  box-shadow: 0 20px 40px -5px rgba(0, 0, 0, 0.05);
  border-color: #e2e8f0;
}

.feature-icon {
  width: 60px;
  height: 60px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.icon-blue { background: #eff6ff; color: #3b82f6; }
.icon-green { background: #f0fdf4; color: #22c55e; }
.icon-purple { background: #faf5ff; color: #a855f7; }

.feature-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 1rem;
}

.feature-card p {
  color: #64748b;
  line-height: 1.6;
  font-size: 0.95rem;
}

/* Loader */
.loader-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #64748b;
  margin-top: 2rem;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 2px solid #e2e8f0;
  border-top-color: #2b69ad;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes premiumFadeInUp {
  0% { 
    opacity: 0; 
    transform: translateY(40px) scale(0.9);
    filter: blur(15px);
  }
  100% { 
    opacity: 1; 
    transform: translateY(0) scale(1);
    filter: blur(0);
  }
}

@keyframes organicSway {
  0% { transform: translateY(0) rotate(-1deg); }
  50% { transform: translateY(-8px) rotate(0.5deg); }
  100% { transform: translateY(-4px) rotate(-0.5deg); }
}

@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Responsive */
@media (max-width: 1200px) {
  .services-grid { grid-template-columns: repeat(3, 1fr); }
  .features-grid { gap: 1.5rem; }
  .hero-title { font-size: 3rem; }
}

@media (max-width: 900px) {
  .features-grid { grid-template-columns: 1fr; max-width: 600px; margin: 0 auto; }
  .section-title { font-size: 2rem; }
  .content-section { padding: 4rem 2rem; }
}

@media (max-width: 768px) {
  .hero-content {
    padding-top: 2.5rem;
    gap: 0.75rem;
    padding-left: 1rem;
    padding-right: 1rem;
  }
  
  .hero-title {
    font-size: 1.7rem;
    line-height: 1.1;
    margin-bottom: 0.1rem;
  }

  .hero-subtitle {
    font-size: 0.9rem;
  }

  .services-grid { 
    grid-template-columns: repeat(2, 1fr); 
    gap: 0.75rem;
  }
  
  .hero-bg {
    animation: none; /* Disable Ken Burns on mobile */
  }
  
  .blob {
    display: none; /* Hide expensive blur blobs on mobile */
  }
  
  .search-bar {
    padding: 0.6rem 1rem;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    background: rgba(255, 255, 255, 0.7);
  }

  .search-input {
    font-size: 0.85rem;
  }
  
  .search-dropdown {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: rgba(10, 20, 50, 0.98);
  }
  
  .service-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease; /* Faster transitions */
    height: 140px; /* Slightly taller for safety and premium feel */
  }

  .card-content {
    padding: 0.85rem;
  }

  .card-content h3 {
    font-size: 0.9rem; /* Slightly smaller for more space */
    font-weight: 700;
    margin-bottom: 0.15rem;
    white-space: normal;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.1;
  }

  .service-teaser {
    font-size: 0.7rem;
    line-height: 1.1;
    display: -webkit-box;
    -webkit-line-clamp: 1; /* Limit to 1 line on mobile to avoid overlap */
    line-clamp: 1;
    color: rgba(255, 255, 255, 0.9);
  }

  .card-icon {
    padding: 8px;
    background: #3b82f6; /* Solid blue for better visibility */
    color: white;
    box-shadow: 0 4px 10px rgba(59, 130, 246, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-icon svg {
    width: 16px;
    height: 16px;
  }

  .content-section {
    padding: 3rem 1rem;
  }

  .section-header {
    margin-bottom: 2rem;
  }

  .section-title {
    font-size: 1.6rem;
  }

  .feature-card {
    padding: 1.75rem 1.25rem;
    text-align: left;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 1.25rem;
  }

  .feature-icon {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
    margin: 0;
  }

  .feature-card h3 {
    font-size: 1.1rem;
    margin-bottom: 0.25rem;
  }

  .feature-card p {
    font-size: 0.88rem;
    line-height: 1.4;
  }
}

.landing-page {
  overflow-x: hidden; /* Prevent horizontal scroll/shift */
  width: 100%;
}

@media (max-width: 600px) {
  /* Maintain 2 columns on even smaller screens to keep 6 cards in one view */
  .hero-title { font-size: 1.6rem; }
  .card-image { height: 100%; }
}

</style>
