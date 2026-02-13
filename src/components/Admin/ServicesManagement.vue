<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { getApiUrl } from '../../config/api';
import { storage } from '../../utils/storage';
const localStorage = storage;

const services = ref<any[]>([]);
const isLoading = ref(false);
const showServiceModal = ref(false);
const showSoinModal = ref(false);
const showContentModal = ref(false);
const editingService = ref<any>(null);
const editingSoin = ref<any>(null);
const selectedService = ref<any>(null);
const selectedSoin = ref<any>(null);
const soins = ref<any[]>([]);

const serviceForm = ref({
  name: '',
  description: ''
});

const soinForm = ref({
  name: '',
  description: '',
  price: 0,
  serviceId: 0
});

const contentForm = ref({
  id: null as number | null,
  type: 'text' as 'checkbox' | 'radio' | 'dropdown' | 'text',
  name: '',
  choices: [] as string[],
  newChoice: ''
});

const editingContent = ref<any>(null);
const originalType = ref<string>('');

const fetchServices = async () => {
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
    console.error('Failed to fetch services:', err);
  } finally {
    isLoading.value = false;
  }
};

const fetchSoins = async (serviceId: number) => {
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch(`/api/soins/service/${serviceId}`, {
      headers: { 
        'accept': '*/*',
        'Authorization': `Bearer ${token}` 
      }
    });
    if (response.ok) {
      soins.value = await response.json();
    }
  } catch (err) {
    console.error('Failed to fetch soins:', err);
  }
};

const handleSaveService = async () => {
  const token = localStorage.getItem('access_token');
  const method = editingService.value ? 'PATCH' : 'POST';
  const url = editingService.value 
    ? getApiUrl(`/services/${editingService.value.id}`)
    : getApiUrl('/services');

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: serviceForm.value.name,
        description: serviceForm.value.description
      })
    });

    if (response.ok) {
      showServiceModal.value = false;
      fetchServices();
      resetServiceForm();
    } else {
      const errorData = await response.json().catch(() => ({}));
      alert('Erreur: ' + (errorData.message || 'Échec de l\'opération'));
    }
  } catch (err) {
    console.error('Failed to save service:', err);
    alert('Une erreur réseau est survenue.');
  }
};

const handleDeleteService = async (id: number) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch(`/api/services/${id}`, {
      method: 'DELETE',
      headers: { 
        'accept': '*/*',
        'Authorization': `Bearer ${token}` 
      }
    });
    if (response.ok) {
      fetchServices();
      if (selectedService.value?.id === id) selectedService.value = null;
    }
  } catch (err) {
    console.error('Failed to delete service:', err);
  }
};

const handleSaveSoin = async () => {
  const token = localStorage.getItem('access_token');
  const method = editingSoin.value ? 'PATCH' : 'POST';
  const url = editingSoin.value
    ? getApiUrl(`/soins/${editingSoin.value.id}`)
    : getApiUrl('/soins');

  // Construct payload explicitly as per Swagger
  const payload: any = {
    name: soinForm.value.name,
    description: soinForm.value.description,
    price: Number(soinForm.value.price),
    serviceId: Number(selectedService.value.id)
  };

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      showSoinModal.value = false;
      fetchSoins(selectedService.value.id);
      resetSoinForm();
    } else {
      const errorData = await response.json().catch(() => ({}));
      alert('Erreur: ' + (errorData.message || 'Échec de l\'opération'));
    }
  } catch (err) {
    console.error('Failed to save soin:', err);
    alert('Une erreur réseau est survenue.');
  }
};

const handleDeleteSoin = async (id: number) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce soin ?')) return;
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch(`/api/soins/${id}`, {
      method: 'DELETE',
      headers: { 
        'accept': '*/*',
        'Authorization': `Bearer ${token}` 
      }
    });
    if (response.ok) {
      fetchSoins(selectedService.value.id);
      if (selectedSoin.value?.id === id) selectedSoin.value = null;
    }
  } catch (err) {
    console.error('Failed to delete soin:', err);
  }
};

const handleSaveContent = async () => {
  const token = localStorage.getItem('access_token');
  const type = contentForm.value.type;
  
  // Handle type change: if editing and type changed, we must delete and recreate
  const typeChanged = editingContent.value && type !== originalType.value;
  
  if (typeChanged) {
    // Delete old one first
    try {
      await fetch(`/api/soins/content/${originalType.value}/${contentForm.value.id}`, {
        method: 'DELETE',
        headers: { 
          'accept': '*/*',
          'Authorization': `Bearer ${token}` 
        }
      });
    } catch (err) {
      console.error('Failed to delete old content during type change:', err);
    }
  }

  const method = (contentForm.value.id && !typeChanged) ? 'PATCH' : 'POST';
  const url = (contentForm.value.id && !typeChanged)
    ? `/api/soins/content/${type}/${contentForm.value.id}`
    : `/api/soins/content/${type}`;
  
  const payload: any = {
    name: contentForm.value.name,
    soinId: Number(selectedSoin.value.id)
  };

  if (type !== 'text') {
    payload.choices = contentForm.value.choices;
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        'accept': '*/*',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      showContentModal.value = false;
      fetchSoins(selectedService.value.id);
      resetContentForm();
    } else {
      const errorData = await response.json().catch(() => ({}));
      alert('Erreur: ' + (errorData.message || 'Échec de l\'opération'));
    }
  } catch (err) {
    console.error('Failed to save content:', err);
  }
};

const handleDeleteContent = async (item: any, type: string) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce champ ?')) return;
  const token = localStorage.getItem('access_token');
  try {
    const response = await fetch(`/api/soins/content/${type}/${item.id}`, {
      method: 'DELETE',
      headers: { 
        'accept': '*/*',
        'Authorization': `Bearer ${token}` 
      }
    });
    if (response.ok) {
      fetchSoins(selectedService.value.id);
    }
  } catch (err) {
    console.error('Failed to delete content:', err);
  }
};

const addChoice = () => {
  if (contentForm.value.newChoice.trim()) {
    contentForm.value.choices.push(contentForm.value.newChoice.trim());
    contentForm.value.newChoice = '';
  }
};

const removeChoice = (index: number) => {
  contentForm.value.choices.splice(index, 1);
};

const openServiceModal = (service: any = null) => {
  if (service) {
    editingService.value = service;
    serviceForm.value = { name: service.name, description: service.description };
  } else {
    resetServiceForm();
  }
  showServiceModal.value = true;
};

const openSoinModal = (soin: any = null) => {
  if (soin) {
    editingSoin.value = soin;
    soinForm.value = { 
      name: soin.name, 
      description: soin.description, 
      price: soin.price || 0,
      serviceId: selectedService.value.id 
    };
  } else {
    resetSoinForm();
  }
  showSoinModal.value = true;
};

const openContentModal = (item: any = null, type: any = 'text') => {
  if (item) {
    editingContent.value = item;
    originalType.value = type;
    contentForm.value = {
      id: item.id,
      type: type,
      name: item.name,
      choices: item.choices ? [...item.choices] : [],
      newChoice: ''
    };
  } else {
    resetContentForm();
  }
  showContentModal.value = true;
};

const resetServiceForm = () => {
  editingService.value = null;
  serviceForm.value = { name: '', description: '' };
};

const resetSoinForm = () => {
  editingSoin.value = null;
  soinForm.value = { name: '', description: '', price: 0, serviceId: 0 };
};

const resetContentForm = () => {
  editingContent.value = null;
  originalType.value = '';
  contentForm.value = {
    id: null,
    type: 'text',
    name: '',
    choices: [],
    newChoice: ''
  };
};

const selectService = (service: any) => {
  selectedService.value = service;
  selectedSoin.value = null;
  fetchSoins(service.id);
};

onMounted(fetchServices);
</script>

<template>
  <div class="services-management">
    <div class="header-section">
      <div class="header-content">
        <h1>Gestion des Services et Soins</h1>
        <p class="subtitle">Configurez les services médicaux et les actes de soin associés.</p>
      </div>
      <button class="add-btn" @click="openServiceModal()">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nouveau Service
      </button>
    </div>

    <div class="management-grid">
      <!-- Services List -->
      <div class="grid-card">
        <div class="card-header">
          <h3>Services</h3>
          <span class="count">{{ services.length }}</span>
        </div>
        <div class="services-list">
          <div 
            v-for="service in services" 
            :key="service.id" 
            :class="['service-item', { active: selectedService?.id === service.id }]"
            @click="selectService(service)"
          >
            <div class="service-info">
              <span class="service-name">{{ service.name }}</span>
              <p class="service-desc">{{ service.description }}</p>
            </div>
            <div class="item-actions">
              <button class="icon-btn edit" @click.stop="openServiceModal(service)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="icon-btn delete" @click.stop="handleDeleteService(service.id)">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Soins List -->
      <div class="grid-card">
        <div class="card-header">
          <div class="header-with-context">
            <h3>Soins</h3>
            <span v-if="selectedService" class="context-tag">{{ selectedService.name }}</span>
          </div>
          <button 
            v-if="selectedService" 
            class="add-small-btn"
            @click="openSoinModal()"
          >
            Ajouter un soin
          </button>
        </div>

        <div v-if="!selectedService" class="empty-selection">
          <div class="empty-icon">👈</div>
          <p>Sélectionnez un service pour gérer ses soins</p>
        </div>

        <div v-else class="soins-list">
          <div v-if="soins.length === 0" class="no-items">
            Aucun soin configuré pour ce service.
          </div>
          <div v-for="soin in soins" :key="soin.id" class="soin-container">
            <div :class="['soin-item', { active: selectedSoin?.id === soin.id }]" @click="selectedSoin = soin">
              <div class="soin-info">
                <div class="soin-name-row">
                  <span class="soin-name">{{ soin.name }}</span>
                  <span v-if="soin.price" class="price-tag">{{ soin.price }} DT</span>
                </div>
                <p class="soin-desc">{{ soin.description }}</p>
              </div>
              <div class="item-actions">
                <button class="icon-btn edit" @click.stop="openSoinModal(soin)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="icon-btn delete" @click.stop="handleDeleteSoin(soin.id)">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </div>

            <!-- Soin Content (Form Elements) -->
            <div v-if="selectedSoin?.id === soin.id" class="soin-content-section">
              <div class="content-header">
                <h4>Éléments du formulaire</h4>
                <button class="add-content-btn" @click="openContentModal">
                  + Ajouter un champ
                </button>
              </div>
              
              <div class="content-list">
                <div v-if="!soin.checkboxes?.length && !soin.radios?.length && !soin.dropdowns?.length && !soin.texts?.length" class="no-content">
                  Aucun champ configuré pour ce formulaire.
                </div>
                
                <div v-for="item in (soin.checkboxes || [])" :key="item.id" class="content-item">
                  <div class="item-main">
                    <span class="type-badge checkbox">Multi</span>
                    <span class="item-label">{{ item.name }}</span>
                  </div>
                  <div class="item-actions">
                    <button class="mini-icon-btn" @click.stop="openContentModal(item, 'checkbox')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="mini-icon-btn delete" @click.stop="handleDeleteContent(item, 'checkbox')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
                <div v-for="item in (soin.radios || [])" :key="item.id" class="content-item">
                  <div class="item-main">
                    <span class="type-badge radio">Unique</span>
                    <span class="item-label">{{ item.name }}</span>
                  </div>
                  <div class="item-actions">
                    <button class="mini-icon-btn" @click.stop="openContentModal(item, 'radio')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="mini-icon-btn delete" @click.stop="handleDeleteContent(item, 'radio')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
                <div v-for="item in (soin.dropdowns || [])" :key="item.id" class="content-item">
                  <div class="item-main">
                    <span class="type-badge dropdown">Liste</span>
                    <span class="item-label">{{ item.name }}</span>
                  </div>
                  <div class="item-actions">
                    <button class="mini-icon-btn" @click.stop="openContentModal(item, 'dropdown')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="mini-icon-btn delete" @click.stop="handleDeleteContent(item, 'dropdown')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
                <div v-for="item in (soin.texts || [])" :key="item.id" class="content-item">
                  <div class="item-main">
                    <span class="type-badge text">Texte</span>
                    <span class="item-label">{{ item.name }}</span>
                  </div>
                  <div class="item-actions">
                    <button class="mini-icon-btn" @click.stop="openContentModal(item, 'text')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button class="mini-icon-btn delete" @click.stop="handleDeleteContent(item, 'text')">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Service Modal -->
    <div v-if="showServiceModal" class="modal-overlay" @click.self="showServiceModal = false">
      <div class="modal-content">
        <h2>{{ editingService ? 'Modifier le Service' : 'Nouveau Service' }}</h2>
        <form @submit.prevent="handleSaveService" class="admin-form">
          <div class="form-group">
            <label>Nom du service</label>
            <input v-model="serviceForm.name" type="text" placeholder="Ex: Soins Infirmiers" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="serviceForm.description" placeholder="Description du service..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="showServiceModal = false">Annuler</button>
            <button type="submit" class="submit-btn">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Soin Modal -->
    <div v-if="showSoinModal" class="modal-overlay" @click.self="showSoinModal = false">
      <div class="modal-content">
        <h2>{{ editingSoin ? 'Modifier le Soin' : 'Nouveau Soin' }}</h2>
        <p class="modal-subtitle">Pour le service: {{ selectedService?.name }}</p>
        <form @submit.prevent="handleSaveSoin" class="admin-form">
          <div class="form-group">
            <label>Nom du soin</label>
            <input v-model="soinForm.name" type="text" placeholder="Ex: Pansement simple" required />
          </div>
          <div class="form-group">
            <label>Prix (DT)</label>
            <input v-model="soinForm.price" type="number" step="0.001" placeholder="Ex: 15.500" required />
          </div>
          <div class="form-group">
            <label>Description</label>
            <textarea v-model="soinForm.description" placeholder="Description du soin..."></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="showSoinModal = false">Annuler</button>
            <button type="submit" class="submit-btn">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>
    <!-- Content (Form Field) Modal -->
    <div v-if="showContentModal" class="modal-overlay" @click.self="showContentModal = false">
      <div class="modal-content field-modal">
        <h2>{{ editingContent ? 'Modifier le champ' : 'Ajouter un champ' }}</h2>
        <p class="modal-subtitle">Configurez l'élément pour le soin: {{ selectedSoin?.name }}</p>
        
        <form @submit.prevent="handleSaveContent" class="admin-form">
          <div class="form-group">
            <label>Type de champ</label>
            <select v-model="contentForm.type" class="type-select">
              <option value="text">Saisie de texte</option>
              <option value="dropdown">Liste déroulante (Dropdown)</option>
              <option value="radio">Choix unique (Radio)</option>
              <option value="checkbox">Choix multiples (Checkbox)</option>
            </select>
          </div>

          <div class="form-group">
            <label>Question / Libellé</label>
            <input v-model="contentForm.name" type="text" placeholder="Ex: Avez-vous une ordonnance ?" required />
          </div>

          <div v-if="contentForm.type !== 'text'" class="choices-section">
            <label>Options de réponse</label>
            <div class="choice-input-group">
              <input v-model="contentForm.newChoice" type="text" placeholder="Ajouter une option..." @keyup.enter.prevent="addChoice" />
              <button type="button" class="add-choice-btn" @click="addChoice">Ajouter</button>
            </div>
            
            <div class="choices-list">
              <div v-for="(choice, index) in contentForm.choices" :key="index" class="choice-tag">
                {{ choice }}
                <span class="remove-choice" @click="removeChoice(index)">&times;</span>
              </div>
            </div>
          </div>

          <div class="modal-actions">
            <button type="button" class="cancel-btn" @click="showContentModal = false">Annuler</button>
            <button type="submit" class="submit-btn">{{ editingContent ? 'Enregistrer les modifications' : 'Ajouter au formulaire' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.services-management {
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

.add-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  background: #2b69ad;
  color: white;
  border: none;
  border-radius: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(43, 105, 173, 0.2);
}

.add-btn:hover {
  background: #1d4d82;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(43, 105, 173, 0.3);
}

.management-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.grid-card {
  background: white;
  border-radius: 24px;
  padding: 1.75rem;
  border: 1px solid #f1f5f9;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
}

.count {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 700;
}

.header-with-context {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.context-tag {
  background: rgba(43, 105, 173, 0.1);
  color: #2b69ad;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 700;
}

.add-small-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  color: #2b69ad;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.add-small-btn:hover {
  background: #f0f7ff;
  border-color: #2b69ad;
}

.services-list, .soins-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.service-item, .soin-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 16px;
  border: 1px solid transparent;
  transition: all 0.2s;
  cursor: pointer;
}

.service-item:hover, .soin-item:hover {
  background: #f1f5f9;
  border-color: #e2e8f0;
}

.service-item.active, .soin-item.active {
  background: #f0f7ff;
  border-color: #2b69ad;
}

.service-info, .soin-info {
  flex: 1;
}

.service-name, .soin-name {
  display: block;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 0.25rem;
}

.service-desc, .soin-desc {
  font-size: 0.875rem;
  color: #64748b;
  line-height: 1.4;
}

.item-actions {
  display: flex;
  gap: 0.5rem;
}

.icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
  border: 1px solid #e2e8f0;
}

.icon-btn.edit {
  color: #64748b;
}

.icon-btn.edit:hover {
  color: #2b69ad;
  border-color: #2b69ad;
  background: #f0f7ff;
}

.icon-btn.delete {
  color: #94a3b8;
}

.icon-btn.delete:hover {
  color: #ef4444;
  border-color: #fee2e2;
  background: #fff5f5;
}

/* Soin Content Section Styles */
.soin-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.soin-content-section {
  margin-left: 1.5rem;
  padding: 1.5rem;
  background: #ffffff;
  border: 1px dashed #e2e8f0;
  border-radius: 16px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.content-header h4 {
  font-size: 0.9375rem;
  font-weight: 700;
  color: #475569;
}

.add-content-btn {
  font-size: 0.75rem;
  font-weight: 700;
  color: #2b69ad;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.add-content-btn:hover {
  background: #f0f7ff;
}

.content-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.content-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-radius: 10px;
  transition: all 0.2s;
}

.content-item:hover {
  background: #f1f5f9;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.mini-icon-btn {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s;
}

.mini-icon-btn:hover {
  border-color: #2b69ad;
  color: #2b69ad;
}

.mini-icon-btn.delete:hover {
  border-color: #ef4444;
  color: #ef4444;
  background: #fff5f5;
}

.type-badge.checkbox { background: #dcfce7; color: #15803d; }
.type-badge.radio { background: #fef3c7; color: #b45309; }
.type-badge.dropdown { background: #e0f2fe; color: #0369a1; }
.type-badge.text { background: #f1f5f9; color: #475569; }

.item-label {
  font-size: 0.875rem;
  color: #334155;
  font-weight: 500;
}

.no-content {
  font-size: 0.8125rem;
  color: #94a3b8;
  font-style: italic;
  padding: 1rem;
  text-align: center;
}

/* Modals Additionals */
.type-select {
  padding: 0.875rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 1rem;
}

.choices-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.choice-input-group {
  display: flex;
  gap: 0.5rem;
}

.choice-input-group input {
  flex: 1;
}

.add-choice-btn {
  padding: 0 1rem;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 700;
  cursor: pointer;
}

.choices-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  min-height: 40px;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 12px;
}

.choice-tag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 0.8125rem;
  color: #475569;
}

.remove-choice {
  color: #ef4444;
  cursor: pointer;
  font-weight: 800;
}

.field-modal {
  max-width: 600px;
}

.empty-selection, .no-items {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  color: #94a3b8;
  text-align: center;
}

.soin-name-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.price-tag {
  background: #dcfce7;
  color: #15803d;
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.125rem 0.625rem;
  border-radius: 99px;
  border: 1px solid #bdf0d2;
}


.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

/* Modal Styling */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  width: 100%;
  max-width: 500px;
  border-radius: 24px;
  padding: 2.5rem;
  box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}

.modal-content h2 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.5rem;
}

.modal-subtitle {
  color: #64748b;
  margin-bottom: 2rem;
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 700;
  color: #475569;
}

.form-group input, .form-group textarea {
  padding: 0.875rem 1rem;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-group input:focus, .form-group textarea:focus {
  outline: none;
  border-color: #2b69ad;
  box-shadow: 0 0 0 4px rgba(43, 105, 173, 0.1);
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.cancel-btn {
  flex: 1;
  padding: 0.875rem;
  background: #f1f5f9;
  border: none;
  border-radius: 12px;
  color: #64748b;
  font-weight: 700;
  cursor: pointer;
}

.submit-btn {
  flex: 2;
  padding: 0.875rem;
  background: #2b69ad;
  border: none;
  border-radius: 12px;
  color: white;
  font-weight: 700;
  cursor: pointer;
}

@media (max-width: 1024px) {
  .management-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .header-section {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .add-btn { width: 100%; justify-content: center; }
  
  .service-item, .soin-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .item-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .modal-content {
    max-width: 100%;
    height: 100%;
    border-radius: 0;
    padding: 1.5rem;
  }
  
  .content-list {
    max-height: 50vh;
    overflow-y: auto;
  }
  
  .content-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
  
  .item-main { width: 100%; }
}
</style>
