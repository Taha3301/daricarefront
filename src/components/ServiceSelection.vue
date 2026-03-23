<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getApiUrl } from '../config/api';
import { useLanguage } from '../composables/useLanguage';
const { t, isAr } = useLanguage();

type Service = {
  id: number;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  image?: string | null;
};

const emit = defineEmits<{
  (e: 'navigate', view: string, serviceId?: number): void;
}>();

const services = ref<Service[]>([]);
const isLoading = ref(false);
const errorMsg = ref<string | null>(null);

const fetchServices = async () => {
  const token = localStorage.getItem('access_token');
  try {
    isLoading.value = true;
    errorMsg.value = null;

    const headers: Record<string, string> = { accept: '*/*' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(getApiUrl('/services/only'), { headers });

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

const selectService = (serviceId: number) => {
  emit('navigate', 'service-soins', serviceId);
};

// Get icon based on service name
const getServiceIcon = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes('infirm')) return '🩺';
  if (n.includes('kiné')) return '💪';
  if (n.includes('sage') || n.includes('matern')) return '👶';
  if (n.includes('diabèt') || n.includes('diabet')) return '💉';
  if (n.includes('plaie') || n.includes('cicatris')) return '🩹';
  if (n.includes('post') || n.includes('opérat')) return '🏥';
  if (n.includes('chronique') || n.includes('surveill')) return '📋';
  if (n.includes('technique') || n.includes('spécialis')) return '⚕️';
  return '🏥';
};

onMounted(fetchServices);
</script>

<template>
  <div class="selection-page">
    <!-- Background -->
    <div class="page-bg">
      <div class="page-overlay"></div>
    </div>

    <!-- Logo top left -->
    <div class="page-logo">
      <img src="../assets/logowhite.png" alt="DariCare" />
    </div>

    <!-- Back button top right -->
    <button class="btn-back-top" @click="emit('navigate', 'landing')">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
      {{ t ? t.sel_back : 'Retour à l\'accueil' }}
    </button>

    <!-- Main content -->
    <div class="page-content">
      <div class="page-header" :dir="isAr ? 'rtl' : 'ltr'">
        <p class="page-tag">{{ t ? t.sel_tag : 'Soins à domicile' }}</p>
        <h1 class="page-title" v-html="t ? t.sel_title : 'De quel professionnel<br/>avez-vous besoin ?'"></h1>
        <p class="page-subtitle">{{ t ? t.sel_subtitle : 'Sélectionnez le type de service pour votre demande de soins à domicile.' }}</p>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="state-wrap">
        <div class="spinner"></div>
        <p>Chargement des services...</p>
      </div>

      <!-- Error -->
      <div v-else-if="errorMsg" class="state-wrap error">
        <p>{{ errorMsg }}</p>
        <button class="btn-retry" @click="fetchServices">Réessayer</button>
      </div>

      <!-- Services grid -->
      <div 
        v-else 
        class="services-list" 
        :style="{ '--total-count': services.length }"
      >
        <button
          v-for="(service, index) in services"
          :key="service.id"
          class="service-item"
          :style="{
            animationDelay: `${index * 80}ms`
          }"
          @click="selectService(service.id)"
        >
          <!-- Card Image for Zoom Effect -->
          <div class="card-image" :style="{ backgroundImage: service.image ? `url('${service.image}')` : 'none' }"></div>

          <!-- Card Index Counter (CSS-based) -->
          <div class="card-counter"></div>

          <!-- Overlay -->
          <div class="card-overlay"></div>

          <!-- Emoji fallback (shown only when no image) -->
          <div v-if="!service.image" class="item-emoji-bg">{{ getServiceIcon(service.name) }}</div>

          <!-- Info -->
          <div class="item-info" :dir="isAr ? 'rtl' : 'ltr'">
            <span class="item-name">{{ isAr && service.name_ar ? service.name_ar : service.name }}</span>
            <span class="item-desc">{{ (isAr && service.description_ar ? service.description_ar : service.description) || (t ? t.sel_default_desc : 'Soins professionnels à domicile.') }}</span>
          </div>

          <!-- Arrow -->
          <div class="item-arrow" :dir="isAr ? 'rtl' : 'ltr'">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            {{ t ? t.sel_choose : 'Choisir' }}
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── Page Shell ── */
.selection-page {
  font-family: 'Outfit', sans-serif;
  position: relative;
  height: auto;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
}

/* ── Background ── */
.page-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url('../assets/bg1.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.page-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    rgba(5, 15, 35, 0.72) 0%,
    rgba(10, 30, 60, 0.60) 50%,
    rgba(5, 20, 45, 0.70) 100%
  );
}

/* ── Logo ── */
.page-logo {
  position: fixed;
  top: 1.2rem;
  left: 1.75rem;
  z-index: 20;
  animation: fadeInDown 0.6s ease-out;
}

.page-logo img {
  height: 38px;
  width: auto;
}

/* ── Back button ── */
.btn-back-top {
  position: fixed;
  top: 1.2rem;
  right: 1.75rem;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 99px;
  font-family: 'Outfit', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(12px);
  transition: all 0.3s ease;
  animation: fadeInDown 0.6s ease-out;
}

.btn-back-top:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateX(-3px);
}

/* ── Main Content ── */
.page-content {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 1100px;
  padding: 5rem 2rem 3rem;
  animation: fadeInUp 0.7s ease-out;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* ── Header ── */
.page-header {
  margin-bottom: 0;
}

.page-tag {
  display: inline-block;
  background: rgba(59, 130, 246, 0.25);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #93c5fd;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 0.28rem 0.85rem;
  border-radius: 99px;
  margin-bottom: 0.6rem;
}

.page-title {
  font-size: clamp(1.5rem, 3.5vw, 2.2rem);
  font-weight: 800;
  color: #ffffff;
  line-height: 1.15;
  letter-spacing: -0.03em;
  margin: 0 0 0.4rem;
  text-shadow: 0 2px 20px rgba(0,0,0,0.3);
}

.page-subtitle {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
  line-height: 1.4;
  margin: 0;
}

/* ── Services Grid/Slider ── */
.services-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  counter-reset: service-counter;
  transition: all 0.4s ease;
}

.service-item {
  display: flex;
  flex-direction: row;
  align-items: flex-end; /* Align content to bottom */
  gap: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  padding: 1.5rem 1.75rem;
  height: 180px;
  cursor: pointer;
  text-align: left;
  width: 100%;
  font-family: 'Outfit', sans-serif;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInUp 0.5s ease-out backwards;
  position: relative;
  overflow: hidden;
  counter-increment: service-counter;
}

.card-image {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 0;
}

.service-item:hover .card-image {
  transform: scale(1.1);
}

/* ── Card Counter ── */
.card-counter {
  position: absolute;
  top: 1rem;
  right: 1.25rem;
  z-index: 5;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  color: white;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 99px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.card-counter::after {
  content: counter(service-counter) " / " var(--total-count);
}

.lang-ar .card-counter {
  right: auto;
  left: 1.25rem;
}

/* Dark gradient overlay on top of the bg image to ensure readability */
.card-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    rgba(5, 15, 35, 0.95) 0%,
    rgba(5, 15, 35, 0.5) 50%,
    rgba(5, 15, 35, 0.1) 100%
  );
  transition: all 0.4s ease;
  z-index: 1;
}

.service-item:hover .card-overlay {
  background: linear-gradient(
    to top,
    rgba(37, 99, 235, 0.9) 0%,
    rgba(37, 99, 235, 0.6) 50%,
    rgba(37, 99, 235, 0.2) 100%
  );
}

/* Emoji fallback background */
.item-emoji-bg {
  font-size: 2rem;
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 44px;
  text-align: center;
}

.service-item:hover {
  border-color: rgba(59, 130, 246, 0.6);
  transform: translateY(-4px);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(59, 130, 246, 0.25);
}

/* ── Item Info ── */
.item-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  position: relative;
  z-index: 1;
}

.item-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0,0,0,0.6);
}

.item-desc {
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  line-height: 1.4;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Arrow / CTA ── */
.item-arrow {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.78rem;
  font-weight: 600;
  flex-shrink: 0;
  margin-left: auto;
  position: relative;
  z-index: 1;
  transition: all 0.3s ease;
}

.service-item:hover .item-arrow {
  color: #60a5fa;
  gap: 0.5rem;
}

/* ── States ── */
.state-wrap {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
  font-weight: 500;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(255,255,255,0.2);
  border-top-color: #60a5fa;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
  margin: 0 auto 1rem;
}

.btn-retry {
  margin-top: 1rem;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.3);
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 99px;
  font-family: 'Outfit', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-retry:hover {
  background: rgba(255,255,255,0.25);
}

/* ── Animations ── */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-16px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-20px); }
  to   { opacity: 1; transform: translateX(0); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Responsive Slider ── */
@media (max-width: 900px) {
  .services-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .page-content {
    padding: 6rem 0 3rem; /* padding: top left&right bottom */
    gap: 2rem;
  }

  .page-header {
    padding: 0 1.5rem;
  }

  .page-title {
    font-size: 1.75rem;
  }

  .services-list {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    gap: 1rem;
    padding: 0 1.5rem 1.5rem;
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .services-list::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  .service-item {
    flex: 0 0 85%;
    scroll-snap-align: center;
    padding: 1.75rem;
    height: 300px; /* Increased height for phone */
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-start;
  }

  .item-name {
    font-size: 1.4rem;
  }

  .item-desc {
    display: block;
    font-size: 0.9rem;
    opacity: 0.9;
    -webkit-line-clamp: 3;
    line-clamp: 3;
  }

  .item-arrow {
    margin-top: 1rem;
    width: 100%;
    justify-content: space-between;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
  }

  /* Adjust logo/back for mobile */
  .page-logo { left: 1rem; top: 1rem; }
  .page-logo img { height: 32px; }
  .btn-back-top { right: 1rem; top: 1rem; padding: 0.4rem 0.8rem; font-size: 0.75rem; }
}
</style>
