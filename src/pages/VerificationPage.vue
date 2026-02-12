<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { storage } from '../utils/storage';
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
  // Aggregate all unverified documents mentionned in all alerts
  const allAlertDocs = alerts.value.flatMap((a: any) => a.documents || []);
  // Filter for unique documents that remain unverified based on existingDocs state
  const uniqueDocsMap = new Map();
  allAlertDocs.forEach((doc: any) => {
    const currentDoc = existingDocs.value.find((d: any) => d.id === doc.id);
    if (currentDoc && !currentDoc.verified) {
      uniqueDocsMap.set(doc.id, { ...doc, verified: false });
    }
  });
  return Array.from(uniqueDocsMap.values());
});

const activeAlertComments = computed(() => {
  // Get comments from alerts that still have unverified documents
  return alerts.value
    .filter((a: any) => a.update === false || (a.documents && a.documents.some((d: any) => {
      const currentDoc = existingDocs.value.find((ed: any) => ed.id === d.id);
      return currentDoc && !currentDoc.verified;
    })))
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
  licenseNumber: '',
  address: '',
  city: '',
  phone: '', // This will be professional phone
  personalPhone: '',
  cin: '',
  diplomaName: '',
  licenseName: '',
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
    const response = await fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'accept': '*/*'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log('Profile data fetched:', data);
      
      if (data.id) {
        localStorage.setItem('user_id', data.id.toString());
      }

      formData.value.specialty = data.speciality || '';
      formData.value.experience = data.yearsOfExperience?.toString() || '';
      formData.value.licenseNumber = data.adeliRppsNumber || '';
      formData.value.address = data.professionalAddress || '';
      formData.value.city = data.city || '';
      formData.value.phone = data.professionalPhone || '';
      formData.value.personalPhone = data.phone || '';
      formData.value.cin = data.cin || '';
      formData.value.diplomaName = data.diploma || '';
      formData.value.licenseName = data.license || '';
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
    const response = await fetch(`/api/documents/professional/${userId}`, {
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
    const response = await fetch('/api/services/only', {
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

const fetchAlerts = async (proId: string) => {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const response = await fetch(`/api/alerts/professional/${proId}`, {
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
  if (unverifiedAlertDocs.value.length > 0) {
    step.value = 3;
  } else {
    step.value = 1;
  }
};

onMounted(async () => {
  const userId = localStorage.getItem('user_id');
  if (userId) {
    isLoading.value = true;
    try {
      // Fetch everything, then decide the step
      await Promise.all([
        fetchServices(),
        fetchUserProfile(),
        fetchAlerts(userId),
        fetchUserDocuments(userId)
      ]);
      checkStepProgress();
    } finally {
      isLoading.value = false;
    }
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
    
    const response = await fetch(`/api/documents/${docId}`, {
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
      fetch(`/api/alerts/${alert.id}/toggle-update`, {
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
      license: formData.value.licenseName,
      yearsOfExperience: Number(formData.value.experience) || 0,
      adeliRppsNumber: formData.value.licenseNumber,
      professionalPhone: formData.value.phone,
      professionalAddress: formData.value.address,
      city: formData.value.city,
      latitude: Number(formData.value.latitude) || 0,
      longitude: Number(formData.value.longitude) || 0
    };

    const response = await fetch(`/api/auth/admin/user/${userId}`, {
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
  const profileSuccess = await submitProfile();
  if (!profileSuccess) {
    isLoading.value = false;
    return;
  }
  await submitDocuments();
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

      const docResponse = await fetch('/api/documents', {
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
            <img src="../assets/LOGO H.png" alt="daricare logo" class="brand-logo-img" />
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
                    {{ service.name }}
                  </option>
                </select>
              </div>
              <div class="input-group">
                <label>Années d'expérience</label>
                <input v-model="formData.experience" type="number" placeholder="Ex: 5" />
              </div>
              <div class="input-group">
                <label>Numéro ADELI / RPPS</label>
                <input v-model="formData.licenseNumber" type="text" placeholder="123456789" />
              </div>
              <div class="input-group">
                <label>Téléphone professionnel</label>
                <input v-model="formData.phone" type="tel" placeholder="06 00 00 00 00" />
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
              <div class="input-group">
                <label>Référence Licence</label>
                <input v-model="formData.licenseName" type="text" placeholder="Ex: LIC-123456" />
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
                  <img :src="'/api/' + existingDocs.find(d => d.type === 'ID_CARD').filePath" alt="CIN" class="doc-thumbnail" @click="openUrl('/api/' + existingDocs.find(d => d.type === 'ID_CARD').filePath)" />
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
                  <img :src="'/api/' + existingDocs.find(d => d.type === 'DIPLOMA').filePath" alt="Diplôme" class="doc-thumbnail" @click="openUrl('/api/' + existingDocs.find(d => d.type === 'DIPLOMA').filePath)" />
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
                  <img :src="'/api/' + existingDocs.find(d => d.type === 'LICENSE').filePath" alt="Licence" class="doc-thumbnail" @click="openUrl('/api/' + existingDocs.find(d => d.type === 'LICENSE').filePath)" />
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
  width: 100vw;
  background-color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.verification-container {
  width: 100%;
  max-width: 800px;
}

.verification-card {
  background: white;
  padding: 3rem;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.05);
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.brand {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.brand-logo-img {
  height: 60px;
  width: auto;
}

.header h1 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
  letter-spacing: -1px;
}

.header p {
  color: #64748b;
}

/* Form Section */
.form-section {
  margin-bottom: 3.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #f1f5f9;
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 2rem;
}

.form-section h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* Form Styling */
.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.full-width {
  grid-column: span 2;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
}

.input-group input, .input-group select {
  padding: 0.8rem 1rem;
  border: 2px solid #f1f5f9;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 1rem;
  transition: all 0.2s;
}

.input-group input:focus, .input-group select:focus {
  border-color: #2b69ad;
  background: white;
  outline: none;
  box-shadow: 0 0 0 4px rgba(43, 105, 173, 0.1);
}

.error-banner {
  padding: 1rem;
  background: #fef2f2;
  border-left: 4px solid #ef4444;
  color: #b91c1c;
  border-radius: 8px;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.info-banner {
  padding: 1rem;
  background: #f0f9ff;
  border-left: 4px solid #0ea5e9;
  color: #0369a1;
  border-radius: 8px;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.location-status {
  padding: 0.8rem;
  background: #f0fdf4;
  border: 1px solid #22c55e;
  border-radius: 12px;
  color: #166534;
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: center;
}

.btn-location {
  padding: 0.8rem 1.5rem;
  background: white;
  border: 2px solid #2b69ad;
  color: #2b69ad;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-location:hover {
  background: #2b69ad;
  color: white;
}

/* Upload Grid */
.upload-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.upload-item label {
  display: block;
  font-size: 0.85rem;
  font-weight: 700;
  color: #475569;
  margin-bottom: 0.75rem;
}

.file-drop {
  position: relative;
  border: 2px dashed #e2e8f0;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  background: #f8fafc;
  transition: all 0.2s;
}

.file-drop:hover {
  border-color: #2b69ad;
  background: rgba(43, 105, 173, 0.02);
}

.file-drop.hasFile {
  border-style: solid;
  border-color: #69aa62;
  background: #f0fdf4;
}

.file-drop input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.drop-content .icon {
  font-size: 1.5rem;
  display: block;
  margin-bottom: 0.5rem;
}

.drop-content p {
  font-size: 0.9rem;
  color: #64748b;
  margin: 0;
}

/* Buttons */
.btn-submit {
  width: 100%;
  padding: 1rem;
  background: #2b69ad;
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover {
  background: #1d4d82;
  transform: translateY(-2px);
}

.btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-back {
  padding: 1rem 2rem;
  background: #f1f5f9;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-home {
  padding: 1rem 2rem;
  background: white;
  border: 2px solid #2b69ad;
  border-radius: 12px;
  font-weight: 700;
  color: #2b69ad;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-home:hover {
  background: #2b69ad;
  color: white;
}

.btn-home:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.doc-desc-input {
  width: 100%;
  margin-top: 1rem;
  padding: 0.8rem 1rem;
  border: 2px solid #f1f5f9;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.doc-desc-input:focus {
  border-color: #2b69ad;
  background: white;
  outline: none;
}
/* Alert Resolution Styles */
.alert-resolution-header { text-align: center; margin-bottom: 2.5rem; }
.alert-icon-large { font-size: 3rem; margin-bottom: 1rem; }
.alert-resolution-header h2 { font-size: 1.75rem; font-weight: 800; color: #9a3412; margin-bottom: 0.5rem; }
.alert-resolution-header p { color: #64748b; font-size: 0.95rem; }

.admin-comments-box {
  background: #fff7ed; border: 1px solid #ffedd5; padding: 1.5rem; 
  border-radius: 20px; margin-bottom: 2.5rem;
}
.admin-comments-box label { display: block; font-size: 0.75rem; font-weight: 800; color: #c2410c; text-transform: uppercase; margin-bottom: 0.75rem; }
.admin-comments-box p { font-size: 1.125rem; color: #431407; font-weight: 700; font-style: italic; }

.resolution-grid { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2.5rem; }
.resolve-item {
  background: white; border: 1px solid #f1f5f9; padding: 1.5rem; border-radius: 20px;
  display: flex; align-items: center; justify-content: space-between; gap: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02);
}
.resolve-info { flex: 1; }
.resolve-doc-type { display: block; font-weight: 800; font-size: 1rem; color: #0f172a; margin-bottom: 0.25rem; }
.resolve-reason { font-size: 0.875rem; color: #64748b; }

.file-drop-mini {
  position: relative; width: 220px; height: 56px;
  background: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}

.existing-doc-preview {
  margin-bottom: 1rem;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  max-width: 200px;
  cursor: pointer;
  transition: transform 0.2s;
}

.existing-doc-preview:hover {
  transform: scale(1.02);
}

.doc-thumbnail {
  width: 100%;
  height: 120px;
  object-fit: cover;
  display: block;
  background: #f1f5f9;
}

.file-drop-mini:hover { border-color: #2b69ad; background: rgba(43, 105, 173, 0.02); }
.file-drop-mini.isUpdating { opacity: 0.5; cursor: not-allowed; }
.file-drop-mini.success { border-style: solid; border-color: #69aa62; background: #f0fdf4; }
.file-drop-mini input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.drop-content-mini { display: flex; align-items: center; gap: 0.75rem; color: #475569; font-weight: 700; font-size: 0.875rem; }

.update-success-indicator {
  display: flex; align-items: center; gap: 0.5rem; color: #166534; font-weight: 800;
  font-size: 0.875rem; margin-bottom: 0.5rem; justify-content: flex-end;
}

.resolution-info-banner {
  padding: 1rem; background: #eff6ff; border-radius: 12px; text-align: center;
  font-size: 0.875rem; color: #1e40af; margin-bottom: 2rem; border: 1px solid #dbeafe;
}

.resolution-actions {
  display: flex; flex-direction: column; gap: 1rem;
}
/* Alert Action Banner */
.alert-action-banner {
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 1px solid #fed7aa;
  border-radius: 16px;
  padding: 1.25rem 1.75rem;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px -1px rgba(124, 45, 18, 0.05);
}

.alert-action-banner:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(124, 45, 18, 0.1);
  border-color: #f97316;
}

.banner-icon {
  font-size: 1.5rem;
  background: white;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.banner-content {
  flex: 1;
}

.banner-title {
  font-weight: 800;
  color: #9a3412;
  font-size: 1rem;
  margin-bottom: 0.25rem;
}

.banner-desc {
  font-size: 0.875rem;
  color: #c2410c;
  font-weight: 500;
}

.banner-btn {
  background: #f97316;
  color: white;
  border: none;
  padding: 0.625rem 1.25rem;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.2s;
}

.banner-btn:hover {
  background: #ea580c;
}

</style>
