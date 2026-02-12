<script setup lang="ts">
import { onMounted, ref } from 'vue';

type Service = {
  id: number;
  name: string;
  description?: string | null;
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

    const response = await fetch('/api/services', { headers });

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

onMounted(fetchServices);
</script>

<template>
  <div class="service-selection-page">
    <div class="container">
      <div class="header">
        <h1 class="title">De quel professionnel avez-vous besoin ?</h1>
        <p class="subtitle">Sélectionnez le type de service pour votre demande de soins à domicile.</p>
      </div>

      <div v-if="isLoading" class="state-container">
        <div class="loader"></div>
        <p>Chargement des services...</p>
      </div>
      
      <div v-else-if="errorMsg" class="state-container error">
        <p>{{ errorMsg }}</p>
        <button class="btn-retry" @click="fetchServices">Réessayer</button>
      </div>

      <div v-else class="services-grid">
        <div 
          v-for="service in services" 
          :key="service.id" 
          class="service-card"
          @click="selectService(service.id)"
        >
          <div class="service-icon">
            <template v-if="service.name.toLowerCase().includes('infirm')">🩺</template>
            <template v-else-if="service.name.toLowerCase().includes('kiné')">💪</template>
            <template v-else-if="service.name.toLowerCase().includes('sage')">👶</template>
            <template v-else>🏥</template>
          </div>
          <div class="service-info">
            <h2 class="service-name">{{ service.name }}</h2>
            <p class="service-desc">{{ service.description || 'Soins professionnels à domicile' }}</p>
          </div>
          <div class="service-arrow">→</div>
        </div>
      </div>

      <div class="footer">
        <button class="btn-back" @click="emit('navigate', 'landing')">← Retour à l'accueil</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.service-selection-page {
  width: 100%;
  min-height: 80vh;
  padding: clamp(2rem, 8vw, 4rem) 1.5rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.container {
  max-width: 900px;
  width: 100%;
}

.header {
  text-align: left;
  margin-bottom: clamp(2rem, 6vw, 4rem);
}

.title {
  font-size: clamp(1.8rem, 5vw, 2.5rem);
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.75rem;
  letter-spacing: -0.025em;
  line-height: 1.2;
}

.subtitle {
  font-size: clamp(1rem, 2.5vw, 1.15rem);
  color: #64748b;
  font-weight: 500;
  line-height: 1.5;
}

.services-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.service-card {
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  padding: clamp(1.25rem, 5vw, 2rem);
  display: flex;
  align-items: center;
  gap: clamp(1rem, 4vw, 2rem);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.service-card:hover {
  border-color: #2b69ad;
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(43, 105, 173, 0.1);
  background: #f0f9ff;
}

.service-icon {
  font-size: clamp(1.5rem, 5vw, 2.5rem);
  width: clamp(50px, 15vw, 70px);
  height: clamp(50px, 15vw, 70px);
  background: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  transition: all 0.3s;
  flex-shrink: 0;
}

.service-card:hover .service-icon {
  background: white;
  transform: scale(1.1);
}

.service-info {
  flex: 1;
}

.service-name {
  font-size: 1.4rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.service-desc {
  color: #64748b;
  font-weight: 500;
  line-height: 1.4;
}

.service-arrow {
  font-size: 1.5rem;
  color: #cbd5e1;
  font-weight: 700;
  transition: all 0.3s;
}

.service-card:hover .service-arrow {
  color: #2b69ad;
  transform: translateX(5px);
}

.state-container {
  text-align: center;
  padding: 4rem;
  color: #64748b;
  font-weight: 600;
}

.loader {
  width: 40px;
  height: 40px;
  border: 4px solid #f1f5f9;
  border-top-color: #2b69ad;
  border-radius: 50%;
  animation: spinner 0.8s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spinner {
  to { transform: rotate(360deg); }
}

.btn-back {
  background: transparent;
  border: none;
  color: #64748b;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 3rem;
}

.btn-back:hover {
  color: #2b69ad;
}

@media (max-width: 640px) {
  .header {
    padding-right: 2rem;
  }

  .service-name {
    font-size: 1.2rem;
  }
  
  .service-desc {
    font-size: 0.9rem;
  }
  
  .service-arrow {
    display: none;
  }
  
  .services-grid {
    padding-right: 2rem; /* Make them smaller from the right side */
  }

  .btn-back {
    margin-top: 2rem;
    width: 100%;
    text-align: left;
    padding: 1rem 0;
  }
}
</style>
