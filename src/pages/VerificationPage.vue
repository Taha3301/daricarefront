<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { getApiUrl } from '../config/api';
import { storage } from '../utils/storage';
import logoUrl from '../assets/LOGO H.png';
const localStorage = storage;

const emit = defineEmits(['navigate']);

const step = ref(1);
const isLoading = ref(false);
const errorMessage = ref('');
const alerts = ref<any[]>([]);
const existingDocs = ref<any[]>([]);
const updatingDocId = ref<number | null>(null);
const updatedDocIds = ref<number[]>([]);
const isFinalizing = ref(false);
const services = ref<any[]>([]);

const isAlreadySubmitted = computed(() => {
  return !!(formData.value.cin && existingDocs.value.length > 0 && alerts.value.every(a => a.update === true));
});

const unverifiedAlertDocs = computed(() => {
  // Aggregate all documents from alerts that are NOT resolved (update === false)
  const activeAlerts = alerts.value.filter((a: any) => a.update === false);
  const allAlertDocs = activeAlerts.flatMap((a: any) => a.documents || []);
  
  // Create a unique set of docs to avoid duplicates
  const uniqueDocsMap = new Map();
  allAlertDocs.forEach((doc: any) => {
    // We prioritize the doc state from the alert itself
    uniqueDocsMap.set(doc.id, { ...doc });
  });
  
  return Array.from(uniqueDocsMap.values());
});

const activeAlertComments = computed(() => {
  // Get comments from all alerts that are NOT resolved
  return alerts.value
    .filter((a: any) => a.update === false)
    .map((a: any) => a.comment);
});

const hasUpdatedAllDocs = computed(() => {
  if (unverifiedAlertDocs.value.length === 0) return false;
  return unverifiedAlertDocs.value.every(d => updatedDocIds.value.includes(d.id));
});

const openUrl = (url: string) => {
  window.open(url, '_blank');
};

const formData = ref({
  specialty: '',
  experience: '',
  address: '',
  city: '',
  personalPhone: '',
  cin: '',
  diplomaName: '',
  latitude: 0,
  longitude: 0
});

const getLocation = () => {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition((position) => {
      formData.value.latitude = position.coords.latitude;
      formData.value.longitude = position.coords.longitude;
      alert('Position capturée avec succès !');
    }, (error) => {
      console.error("Error getting location:", error);
      alert("Impossible de récupérer la position. Veuillez autoriser l'accès à la localisation.");
    });
  } else {
    alert("La géolocalisation n'est pas supportée par votre navigateur.");
  }
};

const files = ref({
  idCard: null as File | null,
  diploma: null as File | null,
  professionalLicense: null as File | null
});

const docDescriptions = ref({
  idCard: '',
  diploma: '',
  professionalLicense: ''
});

const handleFileChange = (event: Event, type: keyof typeof files.value) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    files.value[type] = file;
  }
};

const fetchUserProfile = async () => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(getApiUrl('/auth/profile'), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Profile data fetched:', data);
      
      const actualId = data.id || (data.user && data.user.id);
      if (actualId) {
        console.log('Updating user_id in storage:', actualId);
        localStorage.setItem('user_id', actualId.toString());
      }

      formData.value.specialty = data.speciality || '';
      formData.value.experience = data.yearsOfExperience?.toString() || '';
      formData.value.address = data.professionalAddress || '';
      formData.value.city = data.city || '';
      formData.value.personalPhone = data.phone || '';
      formData.value.cin = data.cin || '';
      formData.value.diplomaName = data.diploma || '';
      formData.value.latitude = data.latitude || 0;
      formData.value.longitude = data.longitude || 0;
    }
  } catch (err) {
    console.error('Failed to fetch profile:', err);
  }
};

const fetchUserDocuments = async (userId: string) => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(getApiUrl(`/documents/professional/${userId}`), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      existingDocs.value = await response.json();
      console.log('Existing docs fetched:', existingDocs.value);
      
      existingDocs.value.forEach(doc => {
        if (doc.type === 'ID_CARD') docDescriptions.value.idCard = doc.description || '';
        if (doc.type === 'DIPLOMA') docDescriptions.value.diploma = doc.description || '';
        if (doc.type === 'LICENSE') docDescriptions.value.professionalLicense = doc.description || '';
      });
    }
  } catch (err) {
    console.error('Failed to fetch documents:', err);
  }
};

const fetchServices = async () => {
  try {
    const response = await fetch(getApiUrl('/services/only'), {
      headers: {
        'accept': '*/*'
      }
    });

    if (response.ok) {
      services.value = await response.json();
      console.log('Services fetched:', services.value);
    }
  } catch (err) {
    console.error('Failed to fetch services:', err);
  }
};

const truncateText = (text: string, length: number = 40) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const fetchAlerts = async (proId: string) => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(getApiUrl(`/alerts/professional/${proId}`), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      alerts.value = await response.json();
    }
  } catch (err) {
    console.error('Failed to fetch alerts:', err);
  }
};

const checkStepProgress = () => {
  // Direct redirection to step 3 if there are unresolved alerts
  const hasActiveAlerts = alerts.value.some((a: any) => a.update === false);
  if (hasActiveAlerts || unverifiedAlertDocs.value.length > 0) {
    step.value = 3;
    console.log('Redirecting to alert resolution (Step 3)');
  } else {
    step.value = 1;
    console.log('Staying/Redirecting to initial form (Step 1)');
  }
};

onMounted(async () => {
  // Always fetch services for the dropdown, regardless of userId
  fetchServices();

  const token = localStorage.getItem('access_token');
  let userId = localStorage.getItem('user_id');
  
  // If we have a token but no user_id, try to fetch the profile to get the ID
  if (token) {
    isLoading.value = true;
    try {
      // First, ensure we have the profile (and thus the user_id)
      await fetchUserProfile();
      
      // Re-read userId as it might have been set by fetchUserProfile
      userId = localStorage.getItem('user_id');
      
      if (userId && userId !== 'undefined') {
        // Now fetch specific data
        await Promise.all([
          fetchAlerts(userId),
          fetchUserDocuments(userId)
        ]);
        checkStepProgress();
      } else {
        console.warn('Could not identify user even after profile fetch');
        errorMessage.value = "Impossible d'identifier votre profil. Veuillez vous reconnecter.";
      }
    } catch (err) {
      console.error('Error during initial data fetch:', err);
    } finally {
      isLoading.value = false;
    }
  } else {
    errorMessage.value = "Session expirée. Veuillez vous reconnecter.";
  }
});

const patchDocument = async (docId: number, file: File) => {
  errorMessage.value = '';
  updatingDocId.value = docId;
  
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');

  if (!token || !userId) return;

  try {
    const patchFormData = new FormData();
    patchFormData.append('file', file);
    patchFormData.append('professionalId', userId);
    patchFormData.append('update', 'true');
    
    const response = await fetch(getApiUrl(`/documents/${docId}`), {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: patchFormData
    });

    if (response.ok) {
      alert('Document mis à jour avec succès !');
      if (!updatedDocIds.value.includes(docId)) {
        updatedDocIds.value.push(docId);
      }
      await fetchUserProfile();
      if (userId) await fetchAlerts(userId);
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Échec de la mise à jour du document.");
    }
  } catch (err: any) {
    console.error('Patch document error:', err);
    errorMessage.value = err.message;
  } finally {
    updatingDocId.value = null;
  }
};

const finalizeAlertUpdates = async () => {
  // Finalize all alerts that have pending updates
  const pendingAlerts = alerts.value.filter(a => a.update === false);
  if (pendingAlerts.length === 0) return;

  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    isFinalizing.value = true;
    
    // Execute all toggles in parallel
    const togglePromises = pendingAlerts.map(alert => 
      fetch(getApiUrl(`/alerts/${alert.id}/toggle-update`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'accept': '*/*'
        }
      })
    );

    const results = await Promise.all(togglePromises);
    const allOk = results.every(res => res.ok);

    if (allOk) {
      alert('Vos modifications ont été soumises avec succès !');
      const userId = localStorage.getItem('user_id');
      if (userId) await fetchAlerts(userId);
    } else {
      throw new Error('Échec de la validation de certaines modifications.');
    }
  } catch (err: any) {
    console.error('Finalize error:', err);
    errorMessage.value = err.message;
  } finally {
    isFinalizing.value = false;
  }
};

const submitProfile = async () => {
  errorMessage.value = '';
  
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');

  if (!token || !userId || userId === 'undefined') {
    errorMessage.value = "Session expirée ou profil non identifié.";
    return false;
  }

  try {
    const payload = {
      phone: formData.value.personalPhone,
      speciality: formData.value.specialty,
      cin: formData.value.cin,
      diploma: formData.value.diplomaName,
      yearsOfExperience: Number(formData.value.experience) || 0,
      professionalAddress: formData.value.address,
      city: formData.value.city,
      latitude: Number(formData.value.latitude) || 0,
      longitude: Number(formData.value.longitude) || 0
    };

    const response = await fetch(getApiUrl(`/auth/admin/user/${userId}`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Échec de la mise à jour du profil.");
    }

    return true;

  } catch (err: any) {
    console.error('Profile update error:', err);
    errorMessage.value = err.message || "Une erreur est survenue lors de la mise à jour.";
    return false;
  }
};

const consolidatedSubmit = async () => {
  isLoading.value = true;
  try {
    const profileSuccess = await submitProfile();
    if (!profileSuccess) {
      return;
    }
    await submitDocuments();
  } finally {
    isLoading.value = false;
  }
};

const submitDocuments = async () => {
  errorMessage.value = '';
  isLoading.value = true;
  
  const token = localStorage.getItem('access_token');
  const userId = localStorage.getItem('user_id');

  if (!token) {
    errorMessage.value = "Session expirée. Veuillez vous reconnecter.";
    isLoading.value = false;
    return;
  }

  if (!userId || userId === 'undefined') {
    errorMessage.value = "Profil non identifié. Veuillez vous reconnecter.";
    isLoading.value = false;
    return;
  }

  try {
    const uploadDocument = async (file: File, type: string, description: string) => {
      const docFormData = new FormData();
      docFormData.append('type', type);
      docFormData.append('professionalId', userId);
      docFormData.append('description', description);
      docFormData.append('files', file);

      const docResponse = await fetch(getApiUrl('/documents'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: docFormData
      });

      if (!docResponse.ok) {
        throw new Error(`Échec de l'upload du document: ${type}`);
      }
    };

    if (files.value.idCard) await uploadDocument(files.value.idCard, 'ID_CARD', docDescriptions.value.idCard || 'Carte d\'identité');
    if (files.value.diploma) await uploadDocument(files.value.diploma, 'DIPLOMA', docDescriptions.value.diploma || 'Diplôme d\'état');
    if (files.value.professionalLicense) await uploadDocument(files.value.professionalLicense, 'LICENSE', docDescriptions.value.professionalLicense || 'Carte professionnelle');
    
    isLoading.value = false;
    emit('navigate', 'login');
    alert('Profil et documents soumis avec succès pour vérification !');

  } catch (err: any) {
    console.error('Documents upload error:', err);
    errorMessage.value = err.message || "Une erreur est survenue lors de l'envoi des documents.";
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="verification-wrapper">
    <div class="verification-container">
      <div class="verification-card">
        <!-- Header -->
        <div class="header">
          <div class="brand">
            <img :src="logoUrl" alt="daricare logo" class="brand-logo-img" />
          </div>
          <h1>Vérification du compte</h1>
          <p>Complétez votre profil pour commencer à exercer sur la plateforme.</p>
        </div>

        <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>
        <div v-if="unverifiedAlertDocs.length > 0 && step !== 3" class="alert-action-banner" @click="step = 3">
          <div class="banner-icon">⚠️</div>
          <div class="banner-content">
            <p class="banner-title">Une action est requise sur votre dossier</p>
            <p class="banner-desc">L'administrateur a demandé des modifications. Cliquez ici pour les consulter.</p>
          </div>
          <button class="banner-btn">Mettre à jour</button>
        </div>

        <div v-if="isAlreadySubmitted && step === 1 && unverifiedAlertDocs.length === 0" class="info-banner">
          👋 Votre dossier est en cours de traitement. Vous ne pouvez pas le modifier pour le moment.
        </div>

        <!-- Consolidated Flow -->
        <div v-if="step === 1" class="form-step">
          <!-- Section 1: Informations -->
          <div class="form-section">
            <h3>1. Informations professionnelles</h3>
            <div class="form-grid">
              <div class="input-group">
                <label>Spécialité</label>
                <select v-model="formData.specialty">
                  <option value="" disabled>Sélectionnez votre spécialité</option>
                  <option v-for="service in services" :key="service.id" :value="service.name">
                    {{ truncateText(service.name, 35) }}
                  </option>
                </select>
              </div>
              <div class="input-group">
                <label>Années d'expérience</label>
                <input v-model="formData.experience" type="number" placeholder="Ex: 5" />
              </div>
              <div class="input-group full-width">
                <label>Adresse professionnelle</label>
                <input v-model="formData.address" type="text" placeholder="12 rue de la Paix" />
              </div>
              <div class="input-group">
                <label>Ville</label>
                <input v-model="formData.city" type="text" placeholder="Paris" />
              </div>
              <div class="input-group">
                <label>CIN (Carte d'Identité)</label>
                <input v-model="formData.cin" type="text" placeholder="12345678" />
              </div>
              <div class="input-group">
                <label>Téléphone personnel</label>
                <input v-model="formData.personalPhone" type="tel" placeholder="01 02 03 04 05" />
              </div>
              <div class="input-group">
                <label>Intitulé du Diplôme</label>
                <input v-model="formData.diplomaName" type="text" placeholder="Ex: Diplôme d'État d'Infirmier" />
              </div>
              <div class="input-group full-width">
                <div class="location-status" v-if="formData.latitude">
                  📍 Position capturée: {{ formData.latitude.toFixed(4) }}, {{ formData.longitude.toFixed(4) }}
                </div>
                <button type="button" class="btn-location full-width" @click="getLocation">
                  📍 {{ formData.latitude ? 'Mettre à jour ma position' : 'Capturer ma position pour la zone d\'intervention' }}
                </button>
              </div>
            </div>
          </div>

          <!-- Section 2: Documents -->
          <div class="form-section">
            <h3>2. Pièces justificatives</h3>
            <div class="upload-grid">
              <div class="upload-item">
                <label>Pièce d'identité (Recto/Verso)</label>
                <div v-if="existingDocs.find(d => d.type === 'ID_CARD')" class="existing-doc-preview">
                  <img :src="getApiUrl(existingDocs.find(d => d.type === 'ID_CARD').filePath)" alt="CIN" class="doc-thumbnail" @click="openUrl(getApiUrl(existingDocs.find(d => d.type === 'ID_CARD').filePath))" />
                </div>
                <div class="file-drop" :class="{ hasFile: files.idCard }">
                  <input type="file" @change="handleFileChange($event, 'idCard')" accept="image/*,.pdf" />
                  <div class="drop-content">
                    <span class="icon">📄</span>
                    <p>{{ files.idCard ? files.idCard.name : (existingDocs.find(d => d.type === 'ID_CARD') ? 'Remplacer le document' : 'Cliquez pour uploader') }}</p>
                  </div>
                </div>
                <input v-model="docDescriptions.idCard" type="text" placeholder="Description de la pièce d'identité..." class="doc-desc-input" />
              </div>

              <div class="upload-item">
                <label>Diplôme d'État</label>
                <div v-if="existingDocs.find(d => d.type === 'DIPLOMA')" class="existing-doc-preview">
                  <img :src="getApiUrl(existingDocs.find(d => d.type === 'DIPLOMA').filePath)" alt="Diplôme" class="doc-thumbnail" @click="openUrl(getApiUrl(existingDocs.find(d => d.type === 'DIPLOMA').filePath))" />
                </div>
                <div class="file-drop" :class="{ hasFile: files.diploma }">
                  <input type="file" @change="handleFileChange($event, 'diploma')" accept="image/*,.pdf" />
                  <div class="drop-content">
                    <span class="icon">🎓</span>
                    <p>{{ files.diploma ? files.diploma.name : (existingDocs.find(d => d.type === 'DIPLOMA') ? 'Remplacer le diplôme' : 'Cliquez pour uploader') }}</p>
                  </div>
                </div>
                <input v-model="docDescriptions.diploma" type="text" placeholder="Description du diplôme..." class="doc-desc-input" />
              </div>

              <div class="upload-item">
                <label>Carte Professionnelle / CPS</label>
                <div v-if="existingDocs.find(d => d.type === 'LICENSE')" class="existing-doc-preview">
                  <img :src="getApiUrl(existingDocs.find(d => d.type === 'LICENSE').filePath)" alt="Licence" class="doc-thumbnail" @click="openUrl(getApiUrl(existingDocs.find(d => d.type === 'LICENSE').filePath))" />
                </div>
                <div class="file-drop" :class="{ hasFile: files.professionalLicense }">
                  <input type="file" @change="handleFileChange($event, 'professionalLicense')" accept="image/*,.pdf" />
                  <div class="drop-content">
                    <span class="icon">💳</span>
                    <p>{{ files.professionalLicense ? files.professionalLicense.name : (existingDocs.find(d => d.type === 'LICENSE') ? 'Remplacer la carte pro' : 'Cliquez pour uploader') }}</p>
                  </div>
                </div>
                <input v-model="docDescriptions.professionalLicense" type="text" placeholder="Description de la carte pro..." class="doc-desc-input" />
              </div>
            </div>
          </div>

          <div class="form-actions">
            <button class="btn-submit" @click="consolidatedSubmit" :disabled="isLoading || isAlreadySubmitted">
              {{ isLoading ? 'Envoi en cours...' : (isAlreadySubmitted ? 'Dossier déjà soumis' : 'Soumettre pour vérification') }}
            </button>
            <button class="btn-home" @click="emit('navigate', 'landing')" :disabled="isLoading">
              Retour à la page d'accueil
            </button>
          </div>
        </div>

        <!-- Step 3: Alert Resolution -->
        <div v-if="step === 3" class="form-step">
          <div class="alert-resolution-header">
            <div class="alert-icon-large">⚠️</div>
            <h2>Action Requise</h2>
            <p>Certains de vos documents nécessitent une mise à jour suite à l'examen de l'administrateur.</p>
          </div>

          <div v-if="activeAlertComments.length > 0" class="admin-comments-box">
            <label>Commentaires de l'administrateur :</label>
            <div class="comments-list">
              <p v-for="(comment, index) in activeAlertComments" :key="index" class="comment-item">
                "{{ comment }}"
              </p>
            </div>
          </div>

          <div class="resolution-grid">
            <div v-for="doc in unverifiedAlertDocs" :key="doc.id" class="resolve-item">
              <div class="resolve-info">
                <span class="resolve-doc-type">{{ doc.type }}</span>
                <span class="resolve-reason">{{ doc.description }}</span>
              </div>
              
              <div class="resolve-upload">
                <div v-if="updatedDocIds.includes(doc.id)" class="update-success-indicator">
                  <span class="icon">✅</span>
                  <span>Modifié</span>
                </div>
                <div class="file-drop-mini" :class="{ isUpdating: updatingDocId === doc.id, success: updatedDocIds.includes(doc.id) }">
                  <input type="file" @change="(e) => { const f = (e.target as HTMLInputElement).files?.[0]; if(f) patchDocument(doc.id, f); }" accept="image/*,.pdf" :disabled="updatingDocId === doc.id" />
                  <div class="drop-content-mini">
                    <span class="icon">📁</span>
                    <span>{{ updatingDocId === doc.id ? 'Mise à jour' : (updatedDocIds.includes(doc.id) ? 'Remplacer encore' : 'Remplacer') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="resolution-info-banner">
            Une fois tous vos documents mis à jour, cliquez sur le bouton ci-dessous pour informer l'administrateur.
          </div>
          
          <div class="resolution-actions">
            <button class="btn-submit" @click="finalizeAlertUpdates" :disabled="isFinalizing || !hasUpdatedAllDocs">
              {{ isFinalizing ? 'Traitement...' : 'Finaliser les modifications' }}
            </button>
            <button class="btn-home" @click="emit('navigate', 'landing')" :disabled="isFinalizing">
              Retour à la page d'accueil
            </button>
            <button class="btn-back" @click="emit('navigate', 'login')" :disabled="isFinalizing">
              Retour à la connexion
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.verification-wrapper {
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background-color: #f8fafc;
  background-image: 
    radial-gradient(at 0% 0%, rgba(43, 105, 173, 0.05) 0, transparent 50%), 
    radial-gradient(at 100% 0%, rgba(105, 170, 98, 0.05) 0, transparent 50%);
  background-attachment: fixed;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 4rem 1.5rem;
  font-family: 'Outfit', sans-serif;
  box-sizing: border-box;
}

.verification-wrapper * {
  box-sizing: border-box;
}

.verification-container {
  width: 100%;
  max-width: 900px;
  position: relative;
  z-index: 2;
  animation: fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.verification-card {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  padding: 3rem;
  width: 100%;
  border-radius: 32px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 1);
}

.header {
  text-align: center;
  margin-bottom: clamp(2rem, 5vw, 4rem);
}

.brand {
  margin-bottom: 2rem;
}

.brand-logo-img {
  height: 70px;
  width: auto;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.05));
}

.header h1 {
  font-size: clamp(1.75rem, 5vw, 2.5rem);
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.75rem;
  letter-spacing: -0.04em;
  line-height: 1.2;
}

.header p {
  color: #64748b;
  font-size: clamp(0.9rem, 2vw, 1.125rem);
  max-width: 500px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Form Sections */
.form-section {
  margin-bottom: 4rem;
}

.form-section h3 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 2.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f1f5f9;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 900px) {
  .form-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 2rem;
  }
}

.full-width {
  grid-column: 1 / -1;
}

.form-grid > * {
  min-width: 0;
  width: 100%;
}

/* Input Styling */
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  width: 100%;
  min-width: 0; /* Critical for grid children to shrink */
}

.input-group label {
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
}

.input-group input, 
.input-group select,
.doc-desc-input {
  width: 100%;
  display: block;
  padding: 0.8rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  background: white;
  font-size: 0.95rem;
  color: #0f172a;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: inherit;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
}

.input-group select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%232b69ad' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.25rem;
  padding-right: 2.5rem;
}

.input-group input:hover, 
.input-group select:hover {
  border-color: #cbd5e1;
}

.input-group input:focus, 
.input-group select:focus,
.doc-desc-input:focus {
  border-color: #2b69ad;
  background: white;
  outline: none;
  box-shadow: 0 0 0 4px rgba(43, 105, 173, 0.1);
  transform: translateY(-2px);
}

/* File Upload Redesign */
.upload-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;
}

.upload-item {
  background: #f8fafc;
  padding: 2rem;
  border-radius: 24px;
  transition: all 0.3s ease;
  border: 1px solid #f1f5f9;
}

.upload-item:hover {
  background: #f1f5f9;
  transform: translateY(-4px);
  box-shadow: 0 10px 20px rgba(0,0,0,0.02);
}

.file-drop {
  position: relative;
  border: 2px dashed #0ea5e9;
  border-radius: 20px;
  padding: 2.5rem;
  text-align: center;
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
  margin-bottom: 1.5rem;
}

.file-drop:hover {
  border-color: #2b69ad;
  background: rgba(43, 105, 173, 0.02);
  transform: scale(1.01);
}

.file-drop.hasFile {
  border-style: solid;
  border-color: #10b981;
  background: #f0fdf4;
}

.file-drop input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
}

.drop-content .icon {
  font-size: 2.5rem;
  display: block;
  margin-bottom: 1rem;
  filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));
}

.drop-content p {
  font-size: 1rem;
  font-weight: 600;
  color: #475569;
  margin: 0;
}

/* Location Button */
.btn-location {
  padding: 1.125rem;
  background: white;
  border: 2px solid #2b69ad;
  color: #2b69ad;
  border-radius: 16px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.btn-location:hover {
  background: #2b69ad;
  color: white;
  box-shadow: 0 8px 20px rgba(43, 105, 173, 0.2);
  transform: translateY(-2px);
}

/* Action Buttons */
.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-top: 2rem;
}

.btn-submit {
  width: 100%;
  padding: 1.25rem;
  background: linear-gradient(135deg, #2b69ad 0%, #1d4d82 100%);
  color: white;
  border: none;
  border-radius: 18px;
  font-weight: 800;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 25px rgba(43, 105, 173, 0.3);
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 15px 35px rgba(43, 105, 173, 0.4);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  filter: grayscale(1);
}

.btn-home {
  padding: 1.125rem;
  background: #f1f5f9;
  border: none;
  border-radius: 18px;
  font-weight: 700;
  color: #475569;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-home:hover {
  background: #e2e8f0;
  color: #1e293b;
}

/* Responsive Tweak */
@media (max-width: 900px) {
  .verification-wrapper {
    padding: 1rem 0.5rem;
  }

  .verification-card {
    padding: 1.5rem 0.875rem;
    border-radius: 20px;
  }
  
  .form-section {
    margin-bottom: 2rem;
  }

  .form-section h3 {
    font-size: 1.15rem;
    margin-bottom: 1.25rem;
  }
  
  .input-group label {
    font-size: 0.85rem;
  }
  
  .input-group input, 
  .input-group select,
  .doc-desc-input {
    padding: 0.7rem 0.875rem;
    font-size: 0.9rem;
    border-radius: 12px;
  }
  
  .input-group select {
    padding-right: 2rem;
    background-size: 1.1rem;
    background-position: right 0.5rem center;
  }
}

@media (max-width: 480px) {
  .header {
    margin-bottom: 2.5rem;
  }
  
  .brand-logo-img {
    height: 50px;
  }
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
  padding: 1.25rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.info-banner {
  background: #f0f9ff;
  border: 1px solid #bae6fd;
  color: #0369a1;
  padding: 1.25rem;
  border-radius: 16px;
  margin-bottom: 2rem;
  font-weight: 600;
}

.resolve-item {
  background: white;
  border: 2px solid #f1f5f9;
  padding: 1.75rem;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: all 0.3s ease;
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .resolve-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.resolve-item:hover {
  border-color: #2b69ad;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.alert-resolution-header {
  text-align: center;
  margin-bottom: 3rem;
}

.alert-icon-large {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  display: block;
}

.alert-resolution-header h2 {
  font-size: 2rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 0.75rem;
}

.alert-resolution-header p {
  color: #64748b;
  font-size: 1.1rem;
}

.admin-comments-box {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  padding: 2rem;
  border-radius: 24px;
  margin-bottom: 3rem;
}

.admin-comments-box label {
  display: block;
  font-weight: 800;
  color: #c2410c;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 1.25rem;
}

.comment-item {
  font-size: 1.125rem;
  color: #7c2d12;
  font-weight: 600;
  line-height: 1.6;
  font-style: italic;
  padding-left: 1.5rem;
  border-left: 4px solid #f97316;
}

.resolution-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  margin-bottom: 3rem;
}

.resolve-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}

.resolve-doc-type {
  font-size: 0.8rem;
  font-weight: 800;
  color: #2b69ad;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.resolve-reason {
  font-size: 1rem;
  color: #475569;
  font-weight: 600;
}

.resolve-upload {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.update-success-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f0fdf4;
  color: #166534;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.875rem;
}

.file-drop-mini {
  position: relative;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  padding: 1rem 1.5rem;
  background: #f8fafc;
  transition: all 0.2s;
  cursor: pointer;
}

.file-drop-mini:hover {
  border-color: #2b69ad;
  background: #f0f9ff;
}

.file-drop-mini.success {
  border-color: #10b981;
  background: #f0fdf4;
}

.file-drop-mini.isUpdating {
  opacity: 0.6;
  cursor: wait;
}

.file-drop-mini input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.drop-content-mini {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #475569;
  font-weight: 700;
  font-size: 0.9rem;
}

.resolution-info-banner {
  background: #f1f5f9;
  padding: 1.25rem;
  border-radius: 16px;
  text-align: center;
  color: #475569;
  font-weight: 600;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.resolution-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 640px) {
  .resolution-actions {
    flex-direction: row;
    justify-content: center;
  }
}

.btn-back {
  padding: 1.125rem 2rem;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 18px;
  color: #64748b;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  border-color: #94a3b8;
  color: #1e293b;
}

.alert-action-banner {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 1px solid #fed7aa;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 2.5rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.alert-action-banner:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(249, 115, 22, 0.1);
}

.banner-icon { font-size: 2rem; }
.banner-content { flex: 1; }
.banner-title { font-weight: 800; color: #9a3412; font-size: 1.1rem; margin: 0; }
.banner-desc { color: #c2410c; margin: 0.25rem 0 0 0; font-size: 0.9rem; font-weight: 500; }

.banner-btn {
  background: #f97316;
  color: white;
  border: none;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
}

.banner-btn:hover { background: #ea580c; }

</style>
