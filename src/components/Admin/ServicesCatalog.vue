<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const services = ref<any[]>([]);
const isLoading = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(5);

const fetchAllServices = async () => {
  const token = localStorage.getItem('access_token');
  try {
    isLoading.value = true;
    const response = await fetch('/api/services', {
      headers: { 
        'accept': '*/*',
        'Authorization': `Bearer ${token}` 
      }
    });
    if (response.ok) {
      services.value = await response.json();
    }
  } catch (err) {
    console.error('Failed to fetch services catalog:', err);
  } finally {
    isLoading.value = false;
  }
};

const paginatedServices = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return services.value.slice(start, end);
});

const totalPages = computed(() => Math.ceil(services.value.length / itemsPerPage.value));

onMounted(fetchAllServices);
</script>

<template>
  <div class="services-catalog">
    <div class="header-section">
      <div class="header-content">
        <h1>Catalogue des Services</h1>
        <p class="subtitle">Vue d'ensemble complète de la structure médicale et des formulaires.</p>
      </div>
      <div class="stats-badges">
        <div class="stat-badge">
          <span class="stat-value">{{ services.length }}</span>
          <span class="stat-label">Services</span>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="loader"></div>
      <p>Chargement du catalogue...</p>
    </div>

    <div v-else class="catalog-grid">
      <div v-if="services.length === 0" class="empty-state">
        <p>Aucun service configuré pour le moment.</p>
      </div>

      <div v-for="service in paginatedServices" :key="service.id" class="service-card">
        <div class="service-header">
          <div class="service-main-info">
            <div class="service-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"/><path d="M2 12h20"/><path d="m12 12 4 4"/><path d="m12 12-4-4"/><path d="m12 12 4-4"/><path d="m12 12-4 4"/></svg>
            </div>
            <div>
              <h3>{{ service.name }}</h3>
              <p>{{ service.description || 'Aucune description' }}</p>
            </div>
          </div>
          <span class="soin-count">{{ service.soins?.length || 0 }} Soins</span>
        </div>

        <div class="soins-container">
          <div v-for="soin in service.soins" :key="soin.id" class="soin-block">
            <div class="soin-info">
              <div class="soin-dot"></div>
              <div class="soin-text">
                <div class="soin-name-header">
                  <span class="soin-name">{{ soin.name }}</span>
                  <span v-if="soin.price" class="catalog-price-tag">{{ soin.price }} DT</span>
                </div>
                <p class="soin-desc">{{ soin.description }}</p>
              </div>
            </div>

            <div class="form-elements-preview">
              <div v-if="!soin.checkboxes?.length && !soin.radios?.length && !soin.dropdowns?.length && !soin.texts?.length" class="no-fields">
                Aucun champ de formulaire
              </div>
              
              <div class="fields-grid">
                <!-- Checkboxes -->
                <div v-for="field in soin.checkboxes" :key="'cb-'+field.id" class="field-card">
                  <div class="field-info">
                    <span class="field-type checkbox">Multi</span>
                    <span class="field-name">{{ field.name }}</span>
                  </div>
                  <div class="field-choices">
                    <span v-for="choice in field.choices" :key="choice" class="choice-dot">{{ choice }}</span>
                  </div>
                </div>

                <!-- Radios -->
                <div v-for="field in soin.radios" :key="'rd-'+field.id" class="field-card">
                  <div class="field-info">
                    <span class="field-type radio">Unique</span>
                    <span class="field-name">{{ field.name }}</span>
                  </div>
                  <div class="field-choices">
                    <span v-for="choice in field.choices" :key="choice" class="choice-dot">{{ choice }}</span>
                  </div>
                </div>

                <!-- Dropdowns -->
                <div v-for="field in soin.dropdowns" :key="'dr-'+field.id" class="field-card">
                  <div class="field-info">
                    <span class="field-type dropdown">Liste</span>
                    <span class="field-name">{{ field.name }}</span>
                  </div>
                  <div class="field-choices">
                    <span v-for="choice in field.choices" :key="choice" class="choice-dot">{{ choice }}</span>
                  </div>
                </div>

                <!-- Texts -->
                <div v-for="field in soin.texts" :key="'txt-'+field.id" class="field-card">
                  <div class="field-info">
                    <span class="field-type text">Texte</span>
                    <span class="field-name">{{ field.name }}</span>
                  </div>
                  <div class="field-placeholder">Champ de saisie libre</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div v-if="totalPages > 1" class="pagination-section">
      <button 
        class="page-btn" 
        :disabled="currentPage === 1"
        @click="currentPage--"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Précédent
      </button>

      <div class="page-numbers">
        <button 
          v-for="page in totalPages" 
          :key="page"
          :class="['page-number', { active: currentPage === page }]"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
      </div>

      <button 
        class="page-btn" 
        :disabled="currentPage === totalPages"
        @click="currentPage++"
      >
        Suivant
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.services-catalog {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
  width: 100%;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  font-size: 1.875rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 1rem;
}

.stat-badge {
  background: white;
  padding: 0.75rem 1.25rem;
  border-radius: 16px;
  border: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #2b69ad;
}

.stat-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
}

.catalog-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.service-card {
  background: white;
  border-radius: 24px;
  border: 1px solid #f1f5f9;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}

.service-header {
  padding: 1.75rem;
  background: #f8fafc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
}

.service-main-info {
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.service-icon {
  width: 48px;
  height: 48px;
  background: white;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2b69ad;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.service-main-info h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.service-main-info p {
  font-size: 0.875rem;
  color: #64748b;
}

.soin-count {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
  font-weight: 700;
}

.soins-container {
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.soin-block {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 16px;
  padding: 1.25rem;
  transition: all 0.2s;
}

.soin-block:hover {
  border-color: #e2e8f0;
  transform: translateX(4px);
}

.soin-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.soin-dot {
  width: 8px;
  height: 8px;
  background: #2b69ad;
  border-radius: 50%;
  margin-top: 0.625rem;
}

.soin-name {
  font-size: 1.0625rem;
  font-weight: 700;
  color: #0f172a;
  display: block;
}

.soin-desc {
  font-size: 0.875rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.soin-name-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.catalog-price-tag {
  background: #f0fdf4;
  color: #15803d;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.125rem 0.625rem;
  border-radius: 99px;
  border: 1px solid #dcfce7;
}


.form-elements-preview {
  margin-left: 1.5rem;
  padding: 1rem;
  background: #f8fafc;
  border-radius: 12px;
}

.no-fields {
  font-size: 0.8125rem;
  color: #94a3b8;
  font-style: italic;
  text-align: center;
}

.fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.field-card {
  background: white;
  padding: 1rem;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
}

.field-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.field-type {
  font-size: 0.625rem;
  font-weight: 800;
  text-transform: uppercase;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
}

.field-type.checkbox { background: #dcfce7; color: #15803d; }
.field-type.radio { background: #fef3c7; color: #b45309; }
.field-type.dropdown { background: #e0f2fe; color: #0369a1; }
.field-type.text { background: #f1f5f9; color: #475569; }

.field-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
}

.field-choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.choice-dot {
  font-size: 0.75rem;
  background: #f1f5f9;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  color: #64748b;
}

.field-placeholder {
  font-size: 0.8125rem;
  color: #94a3b8;
  border-bottom: 1px dashed #cbd5e1;
  padding-bottom: 2px;
  display: inline-block;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 5rem;
}

.loader {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2b69ad;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.empty-state {
  text-align: center;
  padding: 4rem;
  background: white;
  border-radius: 24px;
  color: #94a3b8;
}

/* Pagination Styles */
.pagination-section {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-top: 2rem;
  padding: 1.5rem;
  background: white;
  border-radius: 20px;
  border: 1px solid #f1f5f9;
}

.page-numbers {
  display: flex;
  gap: 0.5rem;
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #64748b;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  border-color: #2b69ad;
  color: #2b69ad;
  background: #f0f7ff;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid transparent;
  background: transparent;
  color: #64748b;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.page-number:hover {
  background: #f1f5f9;
}

.page-number.active {
  background: #2b69ad;
  color: white;
}
@media (max-width: 1024px) {
  .catalog-grid, .fields-grid {
    grid-template-columns: 1fr;
  }
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .header-actions, .stats-badges {
    width: 100%;
    justify-content: flex-start;
  }
  .service-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .soin-info {
    flex-direction: column;
    gap: 0.5rem;
  }
  .soin-dot { margin-top: 0.4rem; }
}
</style>
