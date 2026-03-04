<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from 'vue';
import { getApiUrl } from '../config/api';
import Footer from './Footer.vue';
import { useLanguage } from '../composables/useLanguage';

const { t } = useLanguage();

type Service = {
  id: number;
  name: string;
  description?: string | null;
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
  soinDesc: string;
  serviceId: number;
  serviceName: string;
};

const allSoins = computed<SoinResult[]>(() => {
  const results: SoinResult[] = [];
  for (const svc of services.value) {
    for (const soin of (svc.soins || [])) {
      results.push({
        soinId: soin.id,
        soinName: soin.name,
        soinDesc: soin.description || '',
        serviceId: svc.id,
        serviceName: svc.name,
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
    s.soinDesc.toLowerCase().includes(q) ||
    s.serviceName.toLowerCase().includes(q)
  ).slice(0, 8);
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

    // Using the /services endpoint
    const response = await fetch(getApiUrl('/services'), { headers });

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
  return [...services.value].sort((a, b) => a.id - b.id);
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
              <div class="result-soin-name">{{ result.soinName }}</div>
              <div class="result-service-name">{{ result.serviceName }}</div>
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
          
          <div v-else class="services-grid">
            <div 
              v-for="(service, index) in sortedServices.slice(0, 6)" 
              :key="service.id" 
              class="service-card glass compact-card"
              :style="{ animationDelay: `${index * 100}ms` }"
              @click="emit('navigate', 'service-soins', service.id)"
            >
              <!-- No overlay needed without images -->
              <div class="card-content">
                <h3>{{ service.name }}</h3>
                <div class="card-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
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
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

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
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding-bottom: 4rem;
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
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.4) 100%);
}

/* Content Layout */
.hero-content {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3rem;
  width: 100%;
  max-width: 1400px;
  padding: 0 2rem;
  padding-top: 4rem; /* Moved up ~2cm */
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
  background: rgba(10, 20, 50, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
  z-index: 100;
  box-shadow: 0 16px 40px rgba(0,0,0,0.4);
  animation: fadeInUp 0.2s ease-out;
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

.hero-header {
  text-align: center;
  animation: fadeInDown 0.8s ease-out;
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 800;
  color: #1e293b;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 0.5rem;
  text-shadow: 0 2px 10px rgba(255,255,255,0.5);
}

.highlight {
  background: linear-gradient(120deg, #2b69ad 0%, #3b82f6 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 1.1rem;
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
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  width: 100%;
  max-width: 800px;
}

/* Glassmorphism Card */
/* Glassmorphism Card */
.service-card {
  position: relative;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);
  animation: fadeInUp 0.8s ease-out backwards;
  height: 80px;
  display: flex;
  background: white;
  border: 1.5px solid #e2e8f0;
}

.service-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 30px -5px rgba(43, 105, 173, 0.15);
  border-color: rgba(43, 105, 173, 0.3);
}

.card-overlay-btn {
  display: none;
}

.card-content {
  position: relative;
  z-index: 2;
  padding: 1.25rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  align-self: flex-end;
}

.card-content h3 {
  font-size: 1.05rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-icon {
  color: #3b82f6;
  display: flex;
  transition: transform 0.3s ease, color 0.3s ease;
  background: #eff6ff;
  padding: 8px;
  border-radius: 50%;
}

.service-card:hover .card-icon {
  transform: translateX(4px);
  color: #3b82f6;
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
  transform: translateY(-5px);
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
  .services-grid { grid-template-columns: repeat(2, 1fr); }
  .features-grid { grid-template-columns: 1fr; max-width: 500px; }
  .hero-title { font-size: 2.5rem; }
  .hero-content { padding-top: 4rem; }
  .section-title { font-size: 2rem; }
}

@media (max-width: 600px) {
  .services-grid { grid-template-columns: 1fr; }
  .hero-title { font-size: 2rem; }
  .card-image { height: 160px; }
}

</style>
