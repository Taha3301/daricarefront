<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { getApiUrl } from '../config/api';

type Service = {
  id: number;
  name: string;
  description?: string | null;
  soins?: any[];
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

const selectService = (serviceId: number) => {
  emit('navigate', 'service-soins', serviceId);
};

onMounted(fetchServices);
</script>

<template>
  <div class="landing-page">
    <div class="content-wrapper">
      <section class="hero-section">
        <header class="hero">
          <div class="hero-text">
            <h1 class="title">
              <img src="../assets/LOGO H.png" alt="daricare logo" class="hero-logo-img" /> vous trouve une <br />
              <span class="accent">infirmière</span>, un <span class="accent">kinésithérapeute</span>, <br />
              une <span class="accent">sage-femme</span> à domicile
            </h1>
            
            <p class="subtitle">Disponible pour vos soins ou ceux d'un proche.</p>
            
            <div class="selection-container">
              <p class="selection-label">Choisissez un service :</p>
              
              <div class="options-grid">
                <div v-if="isLoading" class="inline-status">Chargement des services…</div>
                <div v-else-if="errorMsg" class="inline-error">{{ errorMsg }}</div>
                <template v-else>
                  <button
                    v-for="service in services"
                    :key="service.id"
                    class="service-card"
                    @click="selectService(service.id)"
                    :aria-label="`Sélectionner ${service.name}`"
                  >
                    <span class="label">{{ service.name }}</span>
                  </button>
                </template>
              </div>
            </div>

            <p class="footer-text">
              <span>Une demande en 3 minutes et une réponse <br /> en moins d'une heure !</span>
            </p>
          </div>

          <div class="hero-image">
            <img src="../assets/medical-illustration.png" alt="Medical Illustration" class="illustration" />
          </div>
        </header>
      </section>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

.landing-page {
  font-family: 'Outfit', sans-serif;
  background-color: transparent;
  width: 100%;
  color: #422b44;
}

.content-wrapper {
  max-width: 1280px;
  width: 100%;
  padding: 2rem;
}

.hero-section {
  padding: 4rem 0;
}

.hero {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 5rem;
  align-items: center;
  animation: fadeIn 0.8s ease-out;
}

.hero-text {
  text-align: left;
}

.hero-logo-img {
  height: 45px;
  width: auto;
  vertical-align: middle;
  margin-right: 0.5rem;
}

@media (max-width: 768px) {
  .hero-logo-img {
    height: 30px;
  }
}

.title {
  font-size: clamp(2rem, 5vw, 3.25rem);
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 2rem;
  letter-spacing: -0.03em;
}

.accent {
  background: linear-gradient(120deg, rgba(43, 105, 173, 0.1) 0%, rgba(43, 105, 173, 0.1) 100%);
  background-repeat: no-repeat;
  background-size: 100% 0.3em;
  background-position: 0 88%;
  color: #2b69ad;
}

.subtitle {
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  font-weight: 400;
  opacity: 0.85;
  margin-bottom: 3rem;
  max-width: 600px;
  line-height: 1.5;
}

.selection-container {
  margin-bottom: 4rem;
}

.selection-label {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.6;
}

.options-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: flex-start;
}

.inline-status {
  font-weight: 600;
  color: #64748b;
}

.inline-error {
  font-weight: 600;
  color: #b91c1c;
}

.service-card {
  background: transparent;
  padding: 1.25rem 2.5rem;
  border-radius: 16px;
  border: 1.5px solid #e2e8f0;
  color: #2b69ad;
  font-size: 1.15rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
  min-width: 190px;
  position: relative;
  overflow: hidden;
}

.service-card:hover {
  transform: translateY(-2px);
  border-color: #2b69ad;
  background-color: rgba(43, 105, 173, 0.02);
}

.service-card.active {
  background-color: #2b69ad;
  border-color: #2b69ad;
  color: white;
  box-shadow: 0 10px 20px rgba(43, 105, 173, 0.15);
}

.footer-text {
  font-size: clamp(0.9rem, 2.5vw, 1.05rem);
  font-weight: 500;
  color: #718096;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  line-height: 1.5;
  margin-top: 1rem;
}

.footer-text::before {
  content: '✓';
  color: #69aa62;
  font-weight: 800;
}

.hero-image {
  display: flex;
  justify-content: center;
  position: relative;
}

.illustration {
  width: 100%;
  max-width: 550px;
  height: auto;
  filter: drop-shadow(0 30px 60px rgba(0,0,0,0.03));
  animation: float 6s ease-in-out infinite;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
  100% { transform: translateY(0px); }
}

@media (max-width: 1100px) {
  .hero {
    grid-template-columns: 1fr;
    text-align: left;
    gap: 3rem;
  }
  
  .hero-text {
    text-align: left;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .title {
    max-width: 100%;
  }

  .subtitle {
    margin-bottom: 2.5rem;
    margin-left: 0;
  }

  .options-grid {
    justify-content: flex-start;
  }

  .footer-text {
    flex-direction: row;
    align-items: flex-start;
    justify-content: flex-start;
    text-align: left;
    width: 100%;
    margin-top: 2rem;
    padding: 0;
    gap: 0.75rem;
  }
}

@media (max-width: 768px) {
  .hero-section {
    padding: 2rem 0;
  }

  .title {
    font-size: 2.1rem;
    line-height: 1.2;
    margin-bottom: 1.5rem;
  }

  .subtitle {
    margin-bottom: 2rem;
  }

  .selection-container {
    margin-bottom: 2.5rem;
  }

  .options-grid {
    gap: 1rem;
  }

  .hero-image {
    width: 100%;
    display: flex;
    justify-content: center;
    margin-top: 1rem;
  }

  .illustration {
    max-width: 300px;
    height: auto;
    margin: 0 auto 0 calc(50% - 150px - 4px); /* Centered with a slight 4px (~1mm) left shift */
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.85rem;
  }

  .subtitle {
    font-size: 1.05rem;
  }

  .content-wrapper {
    padding: 1rem;
  }

  .service-card {
    padding: 1rem 1.5rem;
    font-size: 1rem;
    min-width: 0;
  }

  .footer-text {
    font-size: 0.95rem;
    line-height: 1.5;
  }

  /* Optional: hide illustration on very small vertical screens if it pushes important content too low */
  @media (max-height: 700px) {
    .hero-image {
      order: -1;
    }
    .illustration {
      max-width: 200px;
    }
  }
}
</style>
