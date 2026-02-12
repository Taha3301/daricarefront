<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

type ChoiceField = {
  id: number;
  name: string;
  choices: string[];
  soinId: number;
};

type TextField = {
  id: number;
  name: string;
  soinId: number;
};

type Soin = {
  id: number;
  name: string;
  description?: string | null;
  price?: number;
  serviceId: number;
  checkboxes: ChoiceField[];
  radios: ChoiceField[];
  dropdowns: ChoiceField[];
  texts: TextField[];
};

type Service = {
  id: number;
  name: string;
  description?: string | null;
  soins: Soin[];
};

type FieldKey = `checkbox:${number}` | `radio:${number}` | `dropdown:${number}` | `text:${number}` | 'visitType' | 'frequencyCount' | 'frequencyPeriod';

const props = defineProps<{
  serviceId: number;
}>();

const emit = defineEmits<{
  (e: 'navigate', view: string): void;
  (e: 'save', payload: { serviceId: number; soinId: number; answers: Record<FieldKey, string | string[]> }): void;
}>();

const isLoading = ref(false);
const errorMsg = ref<string | null>(null);
const services = ref<Service[]>([]);

const service = computed(() => services.value.find((s) => s.id === props.serviceId) ?? null);
const soins = computed(() => service.value?.soins ?? []);

const isModalOpen = ref(false);
const activeSoinId = ref<number | null>(null);
const answers = ref<Record<FieldKey, string | string[]>>({} as any);

const saved = ref<Array<{ soinId: number; answers: Record<FieldKey, string | string[]> }>>([]);

const currentStep = ref(1);
const steps = [
  { id: 1, title: 'Voulez-vous ajouter un autre soin ?' },
  { id: 2, title: 'Avez-vous une ordonnance ?' },
  { id: 3, title: 'Où et quand souhaitez-vous faire vos soins ?' },
  { id: 4, title: 'Qui est le patient ?' },
  { id: 5, title: 'Récapitulatif de votre demande' },
];

const formData = ref({
  hasOrdonnance: '' as string,
  prescriptionFiles: [] as File[],
  address: '',
  isIndifferent: false,
  startDate: '2026-01-23',
  durationMode: '1',
  customDuration: 1,
  availabilitySlots: [] as { start: string, end: string }[],
  patientCivility: 'Mme' as string,
  patientFirstname: '',
  patientLastname: '',
  patientBirthDate: '',
  patientPhone: '',
  patientPhoneConfirm: '',
  patientEmail: '',
  addressComplement: '',
  latitude: null as number | null,
  longitude: null as number | null
});

const addSlot = () => {
  formData.value.availabilitySlots = [{ start: '08:00', end: '10:00' }];
};

const removeSlot = () => {
  formData.value.availabilitySlots = [];
};

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileUpload = () => {
  fileInput.value?.click();
};

const handleFiles = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files) {
    const newFiles = Array.from(input.files);
    const validFiles = newFiles.filter(f => f.size <= 6 * 1024 * 1024);
    if (validFiles.length < newFiles.length) {
      alert("Certains fichiers dépassent 6 Mo.");
    }
    if (formData.value.prescriptionFiles.length + validFiles.length > 6) {
      alert("Maximum 6 documents autorisés.");
      formData.value.prescriptionFiles.push(...validFiles.slice(0, 6 - formData.value.prescriptionFiles.length));
    } else {
      formData.value.prescriptionFiles.push(...validFiles);
    }
  }
};

const removeFile = (index: number) => {
  formData.value.prescriptionFiles.splice(index, 1);
};

const initAnswersForSoin = (soin: Soin): Record<FieldKey, string | string[]> => {
  const a = {} as Record<FieldKey, string | string[]>;
  for (const f of soin.checkboxes ?? []) a[`checkbox:${f.id}`] = [];
  for (const f of soin.radios ?? []) a[`radio:${f.id}`] = '';
  for (const f of soin.dropdowns ?? []) a[`dropdown:${f.id}`] = '';
  for (const f of soin.texts ?? []) a[`text:${f.id}`] = '';
  a['visitType'] = 'once';
  a['frequencyCount'] = '1';
  a['frequencyPeriod'] = 'jour';
  return a;
};

const activeSoin = computed(() => {
  if (activeSoinId.value == null) return null;
  return soins.value.find((s) => s.id === activeSoinId.value) ?? null;
});

const fetchServices = async () => {
  const token = localStorage.getItem('access_token');
  try {
    isLoading.value = true;
    errorMsg.value = null;

    const headers: Record<string, string> = { accept: '*/*' };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch('/api/services', { headers });
    
    if (res.status === 401) {
      console.warn('Unauthorized. Redirecting to login.');
      emit('navigate', 'login');
      return;
    }

    if (!res.ok) throw new Error(`Failed to fetch services (${res.status})`);
    services.value = await res.json();
    console.log('📦 Services loaded in booking page:', services.value.map(s => `ID ${s.id}: ${s.name}`));
    console.log('🎯 Targeted Service ID:', props.serviceId);
    
    if (!service.value) {
      console.warn('⚠️ Service not found for ID:', props.serviceId);
    }
  } catch (err: any) {
    console.error('Failed to fetch services:', err);
    errorMsg.value = err?.message || 'Impossible de charger les services.';
  } finally {
    isLoading.value = false;
  }
};

const openSoinForm = (soinId: number) => {
  activeSoinId.value = soinId;
  const soin = soins.value.find((s) => s.id === soinId);
  if (!soin) return;
  const savedSoin = saved.value.find(s => s.soinId === soinId);
  if (savedSoin) {
    answers.value = savedSoin.answers;
  } else {
    answers.value = initAnswersForSoin(soin);
  }
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  activeSoinId.value = null;
};

const saveModal = () => {
  if (!activeSoin.value) return;
  const payload = {
    serviceId: props.serviceId,
    soinId: activeSoin.value.id,
    answers: answers.value
  };
  const existingIndex = saved.value.findIndex(s => s.soinId === payload.soinId);
  if (existingIndex >= 0) {
    saved.value[existingIndex] = { soinId: payload.soinId, answers: payload.answers };
  } else {
    saved.value.push({ soinId: payload.soinId, answers: payload.answers });
  }
  emit('save', payload);
  closeModal();
  // Stay on step 1 to allow adding more soins
};

const editSoin = (soinId: number) => {
  const savedSoin = saved.value.find(s => s.soinId === soinId);
  if (savedSoin) {
    answers.value = savedSoin.answers;
    openSoinForm(soinId);
  }
};

const getSoinName = (soinId: number) => {
  return soins.value.find(s => s.id === soinId)?.name || 'Soin';
};

const formatSoinAnswers = (soinId: number) => {
  const savedSoin = saved.value.find(s => s.soinId === soinId);
  if (!savedSoin) return '';
  const soin = soins.value.find(s => s.id === soinId);
  if (!soin) return '';
  
  const parts: string[] = [];
  for (const [key, value] of Object.entries(savedSoin.answers)) {
    const [type, idStr] = key.split(':');
    if (!idStr) continue;
    const id = parseInt(idStr);
    if (type === 'checkbox' && Array.isArray(value) && value.length > 0) {
      const field = soin.checkboxes.find(f => f.id === id);
      if (field) parts.push(value.join(', '));
    } else if (type === 'radio' && value) {
      const field = soin.radios.find(f => f.id === id);
      if (field) parts.push(value as string);
    } else if (type === 'dropdown' && value) {
      const field = soin.dropdowns.find(f => f.id === id);
      if (field) parts.push(value as string);
    } else if (type === 'text' && value) {
      parts.push(value as string);
    }
  }

  // Add frequency info
  if (savedSoin.answers['visitType'] === 'recurring') {
    const count = savedSoin.answers['frequencyCount'];
    const period = savedSoin.answers['frequencyPeriod'];
    parts.push(`${count} fois / ${period}`);
  } else {
    parts.push('Une seule fois');
  }

  return parts.join(' / ') || '';
};

const nextStep = () => {
  if (currentStep.value < 5) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const isSubmitting = ref(false);

const submitRequest = async () => {
  if (isSubmitting.value) return;

  try {
    isSubmitting.value = true;
    errorMsg.value = null;

    const fd = new FormData();

    // Basic Header Info
    fd.append('serviceId', props.serviceId.toString());
    fd.append('patientCivility', formData.value.patientCivility);
    fd.append('patientFirstname', formData.value.patientFirstname);
    fd.append('patientLastname', formData.value.patientLastname);
    fd.append('patientBirthdate', formData.value.patientBirthDate);
    fd.append('patientPhone', formData.value.patientPhone);
    if (formData.value.patientEmail) {
      fd.append('patientEmail', formData.value.patientEmail);
    }
    fd.append('address', formData.value.address);
    fd.append('addressComplement', formData.value.addressComplement || '');
    if (formData.value.latitude !== null) fd.append('latitude', formData.value.latitude.toString());
    if (formData.value.longitude !== null) fd.append('longitude', formData.value.longitude.toString());
    fd.append('isIndifferent', formData.value.isIndifferent.toString());
    fd.append('startDate', formData.value.startDate);
    
    // Backend expects 'fixed' but we can send our mode, or just map '1','7'... to 'fixed'
    fd.append('durationMode', formData.value.durationMode === 'long' ? 'long' : 'fixed');

    // Calculate Duration Value
    let dVal = 0;
    if (formData.value.durationMode === 'long') dVal = 60;
    else if (formData.value.durationMode === 'custom') dVal = formData.value.customDuration;
    else dVal = parseInt(formData.value.durationMode);
    fd.append('durationValue', dVal.toString());

    // Slots
    if (formData.value.availabilitySlots && formData.value.availabilitySlots.length > 0) {
      fd.append('availabilityStart', formData.value.availabilitySlots[0]?.start || '08:00');
      fd.append('availabilityEnd', formData.value.availabilitySlots[0]?.end || '10:00');
    }

    // Backend log showed 'available'. We map our internal states.
    const pStat = formData.value.hasOrdonnance === 'none' ? 'pending' : 'available';
    fd.append('prescriptionStatus', pStat);

    // Soins Array
    const mappedSoins = saved.value.map(s => {
      const answersCopy = { ...s.answers } as any;
      // Extract frequency fields
      const visitType = answersCopy['visitType'] || 'once';
      const count = answersCopy['frequencyCount'] || '1';
      const period = answersCopy['frequencyPeriod'] || 'jour';
      
      // Remove them from answers object to keep it "clean" as per documentation
      delete answersCopy['visitType'];
      delete answersCopy['frequencyCount'];
      delete answersCopy['frequencyPeriod'];

      return {
        soinId: s.soinId,
        answers: answersCopy, // Only custom fields here
        visitType: visitType,
        frequencyCount: parseInt(count),
        frequencyPeriod: period
      };
    });
    fd.append('soins', JSON.stringify(mappedSoins));

    // Files
    formData.value.prescriptionFiles.forEach(file => {
      fd.append('prescriptions', file);
    });

    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers,
      body: fd
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Submission failed with status ${res.status}`);
    }

    alert(`Votre demande de rendez-vous a été enregistrée avec succès ! \nMontant total : ${totalPrice.value} DT`);
    emit('navigate', 'landing');

  } catch (err: any) {
    console.error('Submission error:', err);
    errorMsg.value = "Une erreur est survenue lors de l'enregistrement de votre demande : " + err.message;
    
    // Auto-navigate to Step 4 if the error is about patient details or email
    const msg = err.message.toLowerCase();
    if (msg.includes('patient') || msg.includes('email') || msg.includes('phone')) {
      currentStep.value = 4;
    }
  } finally {
    isSubmitting.value = false;
  }
};

const isSoinSaved = (soinId: number) => {
  return saved.value.some((s) => s.soinId === soinId);
};

const totalPrice = computed(() => {
  let total = 0;
  
  // Get duration
  let duration = 1;
  if (formData.value.durationMode === 'long') duration = 60;
  else if (formData.value.durationMode === 'custom') duration = formData.value.customDuration;
  else duration = parseInt(formData.value.durationMode) || 1;

  saved.value.forEach(s => {
    const soinObj = soins.value.find(soin => soin.id === s.soinId);
    if (soinObj && soinObj.price) {
      const frequency = Number(s.answers['frequencyCount']) || 1;
      total += soinObj.price * frequency * duration;
    }
  });

  return total;
});

// Time Slider Helpers
const timeToMinutes = (time: string) => {
  const parts = (time || '00:00').split(':');
  const h = Number(parts[0] || 0);
  const m = Number(parts[1] || 0);
  return h * 60 + m;
};

const minutesToTime = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const getSliderPos = (time: string) => (timeToMinutes(time) / 1440) * 100;

const getLocation = () => {
  if (!navigator.geolocation) {
    alert("La géolocalisation n'est pas supportée par votre navigateur.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
    const { latitude, longitude } = position.coords;
    console.log('--- GPS DEBUG ---');
    console.log('Latitude:', latitude);
    console.log('Longitude:', longitude);
    console.log('------------------');
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
      const data = await res.json();
      console.log('Reverse Geocoding Result:', data);
      
      if (data && data.display_name) {
        formData.value.address = data.display_name;
        formData.value.latitude = latitude;
        formData.value.longitude = longitude;
        console.log('Address updated to:', data.display_name);
        console.log('Coordinates saved:', { latitude, longitude });
      } else {
        alert("Impossible de déterminer l'adresse exacte.");
      }
    } catch (err) {
      console.error("Geocoding error:", err);
      alert("Erreur lors de la récupération de l'adresse.");
    }
  }, (error) => {
    console.error("Geolocation error:", error);
    let msg = "L'accès à la localisation a échoué.";
    if (error.code === error.PERMISSION_DENIED) msg = "Veuillez autoriser l'accès au GPS pour utiliser cette fonctionnalité.";
    else if (error.code === error.TIMEOUT) msg = "La demande de localisation a expiré.";
    alert(msg);
  }, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  });
};

const requestNotificationPermission = async () => {
  if ('Notification' in window) {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }
};

onMounted(() => {
  fetchServices();
  requestNotificationPermission();
});
</script>

<template>
  <div class="page">
    <div class="layout">
      <!-- Left -->
      <div class="content">
        <header class="header">
          <button class="btn-back" @click="emit('navigate', 'landing')">← Retour</button>
          <div class="header-text">
            <h1 class="title">{{ service?.name || 'Service' }}</h1>
            <p class="subtitle">{{ service?.description || 'Choisissez un soin pour continuer.' }}</p>
          </div>
        </header>

        <div v-if="isLoading" class="state">Chargement…</div>
        
        <template v-else-if="service">
          <!-- Global Error Display (Doesn't hide the form) -->
          <div v-if="errorMsg" class="state error" style="margin-bottom: 2rem; padding: 1rem; background: #fff1f2; border: 1px solid #fda4af; border-radius: 12px; color: #e11d48; font-weight: 700;">
            {{ errorMsg }}
          </div>

          <!-- Mobile Stepper (Horizontal) -->
          <div class="mobile-stepper">
            <template v-for="step in steps" :key="`m-step-title-${step.id}`">
              <div v-if="currentStep === step.id" class="m-step-info">{{ step.title }}</div>
            </template>
            <div class="m-steps-row">
              <div
                v-for="step in steps"
                :key="`m-step-bar-${step.id}`"
                class="m-step"
                :class="{ completed: currentStep > step.id, active: currentStep === step.id }"
              >
              </div>
            </div>
          </div>

          <!-- Step 1: Voulez-vous ajouter un autre soin ? -->
          <div v-if="currentStep === 1" class="step-content">
          <h2 class="step-question">Voulez-vous ajouter un autre soin ?</h2>
          
          <div v-if="saved.length > 0" class="saved-soins-list">
            <div v-for="savedItem in saved" :key="savedItem.soinId" class="saved-soin-item">
              <div class="saved-soin-info">
                <div class="saved-soin-name">{{ getSoinName(savedItem.soinId) }}</div>
                <div class="saved-soin-details">{{ formatSoinAnswers(savedItem.soinId) }}</div>
              </div>
              <button class="btn-modify" @click="editSoin(savedItem.soinId)">Modifier</button>
            </div>
          </div>
          
          <div class="soins-grid">
            <button
              v-for="soin in soins"
              :key="soin.id"
              class="soin-card"
              :class="{ saved: isSoinSaved(soin.id) }"
              @click="openSoinForm(soin.id)"
            >
              <div class="soin-header">
                <div class="soin-name">{{ soin.name }}</div>
                <div v-if="isSoinSaved(soin.id)" class="soin-checkmark">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="soin-desc">{{ soin.description || '—' }}</div>
              <div class="soin-cta">
                <span v-if="isSoinSaved(soin.id)">Déjà ajouté</span>
                <span v-else>Remplir le formulaire</span>
              </div>
            </button>
          </div>
          
          <div v-if="saved.length > 0" class="step-actions">
            <button class="btn-primary" @click="nextStep">Continuer</button>
          </div>
        </div>

        <!-- Step 2: Avez-vous une ordonnance ? -->
        <div v-else-if="currentStep === 2" class="step-content">
          <div class="mandatory-notice">* champs obligatoires</div>
          <h2 class="step-question">Avez-vous une ordonnance ? *</h2>
          
          <div class="ordonnance-options">
            <label class="option-card" :class="{ active: formData.hasOrdonnance === 'home-mention' }">
              <input type="radio" v-model="formData.hasOrdonnance" value="home-mention" class="hidden-input" />
              <div class="option-content">
                <div class="radio-circle"></div>
                <span>Oui, avec mention “à domicile”</span>
              </div>
            </label>

            <label class="option-card" :class="{ active: formData.hasOrdonnance === 'no-mention' }">
              <input type="radio" v-model="formData.hasOrdonnance" value="no-mention" class="hidden-input" />
              <div class="option-content">
                <div class="radio-circle"></div>
                <span>Oui, sans mention</span>
              </div>
            </label>

            <label class="option-card" :class="{ active: formData.hasOrdonnance === 'none' }">
              <input type="radio" v-model="formData.hasOrdonnance" value="none" class="hidden-input" />
              <div class="option-content">
                <div class="radio-circle"></div>
                <span>Non</span>
              </div>
            </label>
          </div>

          <div v-if="formData.hasOrdonnance === 'home-mention'" class="info-box">
            <div class="info-icon">i</div>
            <p>Si vous avez une ordonnance avec mention “à domicile”, l’intervention et le déplacement seront pris en charge par la sécurité sociale et votre mutuelle.</p>
          </div>

          <!-- Upload section if "Oui" -->
          <div v-if="formData.hasOrdonnance && formData.hasOrdonnance !== 'none'" class="upload-section">
            <h3 class="upload-title">Ajoutez votre ordonnance si vous l’avez à disposition (facultatif)</h3>
            <div class="upload-area">
              <input type="file" ref="fileInput" class="hidden" multiple accept=".jpg,.jpeg,.png,.pdf" @change="handleFiles" />
              <button class="btn-upload" @click="triggerFileUpload">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                Ajouter un document
              </button>
              <p class="upload-hint">{{ formData.prescriptionFiles.length }}/6 document(s) - Au format JPG, PNG ou PDF - 6 Mo par fichier</p>
            </div>

            <div v-if="formData.prescriptionFiles.length > 0" class="file-list">
              <div v-for="(file, index) in formData.prescriptionFiles" :key="index" class="file-item">
                <div class="file-info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span class="file-name text-truncate">{{ file.name }}</span>
                </div>
                <button class="btn-remove-file" @click="removeFile(index)">✕</button>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn-secondary" @click="prevStep">Précédent</button>
            <button class="btn-primary" @click="nextStep" :disabled="!formData.hasOrdonnance">Continuer</button>
          </div>
        </div>

        <!-- Step 3: Où et quand souhaitez-vous faire vos soins ? -->
        <div v-else-if="currentStep === 3" class="step-content">
          <div class="mandatory-notice">* champs obligatoires</div>
          <h2 class="step-question">Où et quand souhaitez-vous faire vos soins ?</h2>
          
          <div class="form-group mb-2">
            <div class="label-with-action">
              <label>Lieu des soins</label>
              <button class="btn-text" :class="{ active: formData.isIndifferent }" @click="formData.isIndifferent = !formData.isIndifferent">
                <div class="check-box" :class="{ checked: formData.isIndifferent }">
                  <span v-if="formData.isIndifferent">✓</span>
                </div>
                Indifférent
              </button>
            </div>
            <input v-model="formData.address" type="text" class="form-input" placeholder="Ex: 123 Rue de Médical, Paris" :disabled="formData.isIndifferent" />
          </div>

          <div class="form-group">
            <label>Date de début des soins</label>
            <input v-model="formData.startDate" type="date" class="form-input" />
          </div>

          <div class="form-group">
            <label>Durée des soins (en jours) *</label>
            <div class="duration-pills">
              <label v-for="d in ['1', '7', '10', '15', '30']" :key="d" class="pill-option" :class="{ active: formData.durationMode === d }">
                <input type="radio" v-model="formData.durationMode" :value="d" class="hidden" />
                <span>{{ d }} jour{{ d !== '1' ? 's' : '' }}</span>
              </label>
              <label class="pill-option" :class="{ active: formData.durationMode === 'long' }">
                <input type="radio" v-model="formData.durationMode" value="long" class="hidden" />
                <span>Longue durée (60 jours ou +)</span>
              </label>
              <label class="pill-option" :class="{ active: formData.durationMode === 'custom' }">
                <input type="radio" v-model="formData.durationMode" value="custom" class="hidden" />
                <span>Personnaliser la durée</span>
              </label>
            </div>
            <div v-if="formData.durationMode === 'custom'" class="custom-duration-input mt-1">
              <input v-model="formData.customDuration" type="number" min="1" class="form-input mini" />
              <span class="unit">jours</span>
            </div>
          </div>

          <div class="form-group availabilities">
            <div class="label-row">
              <label>Disponibilités horaires *</label>
            </div>
            <div class="info-tag mb-1">
              L’heure de passage précise sera à définir avec le professionnel de santé
            </div>

            <div v-if="formData.availabilitySlots.length === 0" class="add-slot-box" @click="addSlot">
              <div class="add-icon">+</div>
              <span>Ajouter un créneau de passage</span>
            </div>

            <div v-else class="slot-card">
              <div class="slot-card-header">
                <div class="slot-title">Votre créneau : <span>{{ formData.availabilitySlots[0]?.start }} — {{ formData.availabilitySlots[0]?.end }}</span></div>
                <button class="btn-delete" @click="removeSlot" title="Supprimer">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
              
              <div class="slider-wrapper">
                <p class="slider-hint">Délai d’au moins 2 heures requis</p>
                <div v-if="formData.availabilitySlots[0]" class="dual-range-container">
                  <div class="range-track"></div>
                  <div class="range-highlight" :style="{ 
                    left: getSliderPos(formData.availabilitySlots[0].start) + '%', 
                    width: (getSliderPos(formData.availabilitySlots[0].end) - getSliderPos(formData.availabilitySlots[0].start)) + '%' 
                  }"></div>
                  
                  <input 
                    type="range" 
                    min="0" 
                    max="1440" 
                    step="30" 
                    :value="timeToMinutes(formData.availabilitySlots[0].start)" 
                    @input="(e: any) => { 
                      const val = Number(e.target.value);
                      if (formData.availabilitySlots[0] && val <= timeToMinutes(formData.availabilitySlots[0].end) - 120) formData.availabilitySlots[0].start = minutesToTime(val);
                      else if (formData.availabilitySlots[0]) formData.availabilitySlots[0].start = minutesToTime(timeToMinutes(formData.availabilitySlots[0].end) - 120);
                    }"
                    class="range-input start"
                  />
                  <input 
                    type="range" 
                    min="0" 
                    max="1440" 
                    step="30" 
                    :value="timeToMinutes(formData.availabilitySlots[0].end)" 
                    @input="(e: any) => { 
                      const val = Number(e.target.value);
                      if (formData.availabilitySlots[0] && val >= timeToMinutes(formData.availabilitySlots[0].start) + 120) formData.availabilitySlots[0].end = minutesToTime(val);
                      else if (formData.availabilitySlots[0]) formData.availabilitySlots[0].end = minutesToTime(timeToMinutes(formData.availabilitySlots[0].start) + 120);
                    }"
                    class="range-input end"
                  />
                </div>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn-secondary" @click="prevStep">Précédent</button>
            <button class="btn-primary" @click="nextStep" :disabled="(!formData.address && !formData.isIndifferent) || !formData.startDate || formData.availabilitySlots.length === 0">Continuer</button>
          </div>
        </div>

        <!-- Step 4: Qui est le patient ? -->
        <div v-else-if="currentStep === 4" class="step-content">
          <div class="mandatory-notice">* champs obligatoires</div>
          <h2 class="step-question">Qui est le patient ?</h2>
          <p class="step-instruction">
            Saisissez vos coordonnées afin qu’un professionnel de santé qualifié et disponible prenne contact avec vous pour convenir d’un rendez-vous.
          </p>

          <div class="form-group">
            <label>Civilité *</label>
            <div class="civility-group">
              <label class="civility-option" :class="{ active: formData.patientCivility === 'Mme' }">
                <input type="radio" v-model="formData.patientCivility" value="Mme" class="hidden" />
                <span>Madame</span>
              </label>
              <label class="civility-option" :class="{ active: formData.patientCivility === 'M' }">
                <input type="radio" v-model="formData.patientCivility" value="M" class="hidden" />
                <span>Monsieur</span>
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Prénom *</label>
              <input v-model="formData.patientFirstname" type="text" class="form-input" placeholder="Ex: Jean" />
            </div>
            <div class="form-group">
              <label>Nom *</label>
              <input v-model="formData.patientLastname" type="text" class="form-input" placeholder="Ex: Dupont" />
            </div>
          </div>

          <div class="form-group">
            <label>Date de naissance *</label>
            <input v-model="formData.patientBirthDate" type="date" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Numéro de téléphone *</label>
              <input v-model="formData.patientPhone" type="tel" class="form-input" placeholder="06 00 00 00 00" />
              <p class="field-hint">Le professionnel vous contactera sur ce numéro pour convenir d'un rendez-vous</p>
            </div>
            <div class="form-group">
              <label>Confirmez le téléphone *</label>
              <input v-model="formData.patientPhoneConfirm" type="tel" class="form-input" placeholder="06 00 00 00 00" />
            </div>
          </div>

          <div class="form-group">
            <label>Email</label>
            <input v-model="formData.patientEmail" type="email" class="form-input" placeholder="email@exemple.com" />
          </div>

          <div class="form-group">
            <div class="label-row">
              <label>Adresse *</label>
              <button class="btn-link" @click="getLocation">Je ne trouve pas mon adresse</button>
            </div>
            <input v-model="formData.address" type="text" class="form-input" placeholder="Ex: 123 Rue de la Santé, Paris" />
            <p class="field-hint">Lieu où les soins “à domicile” seront réalisés</p>
          </div>

          <div class="form-group">
            <label>Complément d'adresse (facultatif)</label>
            <input v-model="formData.addressComplement" type="text" class="form-input" placeholder="Bâtiment, code, étage..." />
            <p class="field-hint">Indiquez les informations pour simplifier l'accès au lieu de rendez-vous (bâtiment, codes, étage, etc...)</p>
          </div>

          <div class="step-actions">
            <button class="btn-secondary" @click="prevStep">Précédent</button>
            <button class="btn-primary" @click="nextStep" :disabled="!formData.patientFirstname || !formData.patientLastname || !formData.patientBirthDate || !formData.patientPhone || (!formData.address && !formData.isIndifferent)">Continuer</button>
          </div>
        </div>

        <!-- Step 5: Récapitulatif de votre demande -->
        <div v-else-if="currentStep === 5" class="step-content">
          <h2 class="step-question">Récapitulatif de votre demande</h2>
          <div class="summary-section">
            <div class="summary-item">
              <strong>Soins demandés:</strong>
              <div class="summary-value">
                <div v-for="savedItem in saved" :key="savedItem.soinId" class="summary-soin">
                  {{ getSoinName(savedItem.soinId) }} - {{ formatSoinAnswers(savedItem.soinId) }}
                </div>
              </div>
            </div>
            <div class="summary-item">
              <strong>Ordonnance:</strong>
              <div class="summary-value">
                {{ formData.hasOrdonnance === 'home-mention' ? 'Oui, avec mention “à domicile”' : 
                   formData.hasOrdonnance === 'no-mention' ? 'Oui, sans mention' : 'Non' }}
                <div v-if="formData.prescriptionFiles.length > 0" class="summary-files">
                  ({{ formData.prescriptionFiles.length }} document(s) joint(s))
                </div>
              </div>
            </div>
            <div class="summary-item">
              <strong>Lieu:</strong>
              <div class="summary-value">{{ formData.isIndifferent ? 'Indifférent' : formData.address }}</div>
            </div>
            <div class="summary-item">
              <strong>Début & Durée:</strong>
              <div class="summary-value">
                Le {{ formData.startDate }} pour {{ formData.durationMode === 'custom' ? formData.customDuration : (formData.durationMode === 'long' ? '60+' : formData.durationMode) }} jour(s)
              </div>
            </div>
            <div class="summary-item">
              <strong>Disponibilité:</strong>
              <div class="summary-value">
                <div v-if="formData.availabilitySlots.length > 0">
                  {{ formData.availabilitySlots[0]?.start }} à {{ formData.availabilitySlots[0]?.end }}
                </div>
              </div>
            </div>
            <div class="summary-item">
              <strong>Patient:</strong>
              <div class="summary-value">
                {{ formData.patientCivility }} {{ formData.patientFirstname }} {{ formData.patientLastname }}<br/>
                Né(e) le {{ formData.patientBirthDate }}<br/>
                Tél: {{ formData.patientPhone }}<br/>
                Email: {{ formData.patientEmail }}
              </div>
            </div>
            <div v-if="formData.addressComplement" class="summary-item">
              <strong>Complément d'adresse:</strong>
              <div class="summary-value">{{ formData.addressComplement }}</div>
            </div>

            <div v-if="totalPrice > 0" class="summary-total-card">
              <div class="total-label">Montant total estimé</div>
              <div class="total-amount">{{ totalPrice }} DT</div>
              <p class="total-notice">Le paiement s'effectue directement auprès du professionnel de santé.</p>
            </div>
          </div>
          <div class="step-actions">
            <button class="btn-secondary" @click="prevStep" :disabled="isSubmitting">Précédent</button>
            <button class="btn-primary" @click="submitRequest" :disabled="isSubmitting">
              {{ isSubmitting ? 'Envoi en cours...' : 'Confirmer la demande' }}
            </button>
          </div>
          <div v-if="errorMsg" class="state error mt-1">{{ errorMsg }}</div>
        </div>
        </template>
        <div v-else class="state">
          <p>Désolé, ce service est introuvable ou n'existe plus.</p>
          <button class="btn-primary mt-1" @click="emit('navigate', 'landing')">Retour à l'accueil</button>
        </div>
      </div>

      <!-- Right Stepper -->
      <aside class="stepper">
        <div class="stepper-title">Étapes</div>
        <div class="stepper-track">
          <div
            v-for="step in steps"
            :key="step.id"
            class="step-node"
            :class="{ completed: currentStep > step.id, active: currentStep === step.id }"
          >
            <div class="node-icon">
              <span v-if="currentStep > step.id">✓</span>
              <span v-else>{{ step.id }}</span>
            </div>
            <div class="node-label">{{ step.title }}</div>
          </div>
        </div>

        <div class="stepper-hint">
          <div v-if="currentStep === 1">Ajoutez un ou plusieurs soins, puis continuez.</div>
          <div v-else-if="currentStep === 2">Indiquez si vous avez une ordonnance.</div>
          <div v-else-if="currentStep === 3">Renseignez le lieu et la date des soins.</div>
          <div v-else-if="currentStep === 4">Indiquez les informations du patient.</div>
          <div v-else>Vérifiez votre récapitulatif avant de confirmer.</div>
        </div>
      </aside>
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <div>
            <div class="modal-title">{{ activeSoin?.name }}</div>
            <div class="modal-subtitle">{{ activeSoin?.description || 'Renseignez les champs ci-dessous.' }}</div>
          </div>
          <button class="btn-close" @click="closeModal" aria-label="Fermer">✕</button>
        </div>

        <div class="modal-body">
          <!-- Checkboxes FIRST -->
          <template v-if="activeSoin?.checkboxes && activeSoin.checkboxes.length > 0">
            <div v-for="field in activeSoin.checkboxes" :key="`cb-${field.id}`" class="field">
              <div class="field-label">{{ field.name }} <span class="badge">Multiple</span></div>
              <div class="choices">
                <label v-for="choice in field.choices" :key="choice" class="pill" :class="{ active: (answers[`checkbox:${field.id}`] as string[])?.includes(choice) }">
                  <input type="checkbox" class="hidden" :value="choice" v-model="answers[`checkbox:${field.id}`]" />
                  <span>{{ choice }}</span>
                </label>
              </div>
            </div>
          </template>

          <!-- Radios SECOND (always after checkboxes) -->
          <template v-if="activeSoin?.radios && activeSoin.radios.length > 0">
            <div v-for="field in activeSoin.radios" :key="`rd-${field.id}`" class="field">
              <div class="field-label">{{ field.name }} <span class="badge">Unique</span></div>
              <div class="choices">
                <label v-for="choice in field.choices" :key="choice" class="pill" :class="{ active: answers[`radio:${field.id}`] === choice }">
                  <input
                    type="radio"
                    class="hidden"
                    :name="`radio-${field.id}`"
                    :value="choice"
                    v-model="answers[`radio:${field.id}`]"
                  />
                  <span>{{ choice }}</span>
                </label>
              </div>
            </div>
          </template>

          <!-- Dropdowns THIRD -->
          <template v-if="activeSoin?.dropdowns && activeSoin.dropdowns.length > 0">
            <div v-for="field in activeSoin.dropdowns" :key="`dr-${field.id}`" class="field">
              <div class="field-label">{{ field.name }} <span class="badge">Liste</span></div>
              <select v-model="answers[`dropdown:${field.id}`]" class="select">
                <option value="" disabled>Choisir…</option>
                <option v-for="choice in field.choices" :key="choice" :value="choice">{{ choice }}</option>
              </select>
            </div>
          </template>

          <!-- Texts FOURTH -->
          <template v-if="activeSoin?.texts && activeSoin.texts.length > 0">
            <div v-for="field in activeSoin.texts" :key="`tx-${field.id}`" class="field">
              <div class="field-label">{{ field.name }} <span class="badge">Texte</span></div>
              <input v-model="answers[`text:${field.id}`]" class="input" type="text" placeholder="Votre réponse…" />
            </div>
          </template>

          <!-- Visit Frequency Section -->
          <div class="field frequency-section">
            <div class="field-label">Le professionnel doit passer *</div>
            <div class="frequency-options">
              <label class="radio-card" :class="{ active: answers['visitType'] === 'once' }">
                <input type="radio" v-model="answers['visitType']" value="once" class="hidden" />
                <div class="radio-content">
                  <div class="radio-circle"></div>
                  <span>Une seule fois</span>
                </div>
              </label>

              <label class="radio-card" :class="{ active: answers['visitType'] === 'recurring' }">
                <input type="radio" v-model="answers['visitType']" value="recurring" class="hidden" />
                <div class="radio-content">
                  <div class="radio-circle"></div>
                  <span>Soin récurrent</span>
                </div>
              </label>
            </div>

            <div v-if="answers['visitType'] === 'recurring'" class="recurring-details">
              <div class="frequency-grid">
                <div class="frequency-subgroup">
                  <div class="mini-label">Nombre de passages</div>
                  <div class="pill-group">
                    <label v-for="n in ['1', '2', '3']" :key="n" class="mini-pill" :class="{ active: answers['frequencyCount'] === n }">
                      <input type="radio" v-model="answers['frequencyCount']" :value="n" class="hidden" />
                      <span>{{ n }} fois</span>
                    </label>
                  </div>
                </div>

                <div class="frequency-subgroup">
                  <div class="mini-label">Par *</div>
                  <div class="pill-group">
                    <label v-for="p in ['jour', 'semaine', 'mois']" :key="p" class="mini-pill" :class="{ active: answers['frequencyPeriod'] === p }">
                      <input type="radio" v-model="answers['frequencyPeriod']" :value="p" class="hidden" />
                      <span>{{ p }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Annuler</button>
          <button class="btn-primary" @click="saveModal">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem;
  overflow-x: hidden;
  box-sizing: border-box;
}

.layout {
  width: 100%;
  max-width: 1200px;
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 2rem;
  align-items: start;
  box-sizing: border-box;
}

.content {
  width: 100%;
}

.header {
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  margin-bottom: 2rem;
}

.btn-back {
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 0.7rem 1rem;
  font-weight: 800;
  color: #334155;
  cursor: pointer;
}

.title {
  margin: 0;
  font-size: 2.2rem;
  font-weight: 900;
  color: #0f172a;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.subtitle {
  margin: 0.35rem 0 0 0;
  color: #64748b;
  font-weight: 600;
}

.state {
  padding: 1.25rem;
  color: #64748b;
  font-weight: 700;
}

.state.error {
  color: #b91c1c;
}

.soins-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.soin-card {
  text-align: left;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 1.25rem;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.15s ease;
}

.soin-card:hover {
  transform: translateY(-2px);
  border-color: #2b69ad;
}

.soin-card.saved {
  background: #ecfdf3;
  border-color: #16a34a;
}

.soin-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.soin-name {
  font-weight: 900;
  color: #0f172a;
  flex: 1;
}

.soin-checkmark {
  color: #16a34a;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.soin-desc {
  color: #64748b;
  font-weight: 600;
  margin-bottom: 0.9rem;
}

.soin-cta {
  color: #2b69ad;
  font-weight: 900;
}

.saved-actions-inline {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.75rem;
}
/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  z-index: 10001;
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 680px;
  background: white;
  border-radius: 24px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 40px 100px rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.25rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.modal-title {
  font-weight: 900;
  color: #0f172a;
  font-size: 1.2rem;
}

.modal-subtitle {
  margin-top: 0.25rem;
  color: #64748b;
  font-weight: 600;
}

.btn-close {
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  width: 40px;
  height: 40px;
  cursor: pointer;
  font-weight: 900;
}

.modal-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  overflow-y: auto;
  flex: 1;
  background: white;
}

.field {
  background: #f8fafc;
  border: 1.5px solid #f1f5f9;
  border-radius: 20px;
  padding: 1.25rem;
}

.field-label {
  font-weight: 900;
  color: #334155;
  display: flex;
  gap: 0.6rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.badge {
  font-size: 0.75rem;
  font-weight: 900;
  color: #2b69ad;
  background: rgba(43,105,173,0.1);
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
}

.choices {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.pill {
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 0.65rem 1rem;
  font-weight: 800;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  user-select: none;
}

.pill:hover {
  border-color: #2b69ad;
  background: #f0f7ff;
}

.pill.active {
  background: #2b69ad;
  border-color: #2b69ad;
  color: white;
  box-shadow: 0 4px 12px rgba(43, 105, 173, 0.25);
}

.hidden {
  display: none;
}

.select,
.input {
  width: 100%;
  padding: 0.95rem 1rem;
  border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  background: white;
  font-family: inherit;
  font-weight: 700;
  color: #334155;
}

.frequency-section {
  border-top: 2px solid #f1f5f9;
  margin-top: 1rem;
  padding-top: 1.5rem;
}

.frequency-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 0.75rem;
}

.radio-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.radio-card.active {
  border-color: #2b69ad;
  background: #f0f7ff;
}

.radio-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-weight: 800;
  color: #334155;
}

.radio-card.active .radio-content {
  color: #2b69ad;
}

.radio-circle {
  width: 20px;
  height: 20px;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  position: relative;
}

.active .radio-circle {
  border-color: #2b69ad;
}

.active .radio-circle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #2b69ad;
  border-radius: 50%;
}

.recurring-details {
  margin-top: 1.25rem;
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 16px;
  border: 1.5px solid #e2e8f0;
}

.frequency-grid {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.frequency-subgroup {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.mini-label {
  font-size: 0.75rem;
  font-weight: 800;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.pill-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.mini-pill {
  padding: 0.5rem 1rem;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 10px;
  font-weight: 700;
  font-size: 0.875rem;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  min-width: 80px;
}

.mini-pill:hover {
  border-color: #2b69ad;
  background: #f0f7ff;
}

.mini-pill.active {
  background: #2b69ad;
  border-color: #2b69ad;
  color: white;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.25rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  position: sticky;
  bottom: 0;
}

.label-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.label-with-action label {
  margin-bottom: 0;
}

.btn-text {
  background: transparent;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 800;
  color: #64748b;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-text.active {
  color: #2b69ad;
}

.check-box {
  width: 18px;
  height: 18px;
  border: 2px solid #e2e8f0;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  transition: all 0.2s;
}

.check-box.checked {
  background: #2b69ad;
  border-color: #2b69ad;
  color: white;
}

.duration-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}

.pill-option {
  padding: 0.6rem 1rem;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 999px;
  font-weight: 800;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.pill-option:hover {
  border-color: #2b69ad;
  background: #f8fafc;
}

.pill-option.active {
  background: #2b69ad;
  color: white;
  border-color: #2b69ad;
}

.custom-duration-input {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.form-input.mini {
  width: 100px;
}

.unit {
  font-weight: 800;
  color: #64748b;
}

.info-tag {
  background: #f1f5f9;
  color: #475569;
  padding: 0.6rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  line-height: 1.4;
}

.empty-availabilities {
  padding: 2rem;
  border: 1.5px dashed #e2e8f0;
  border-radius: 16px;
  display: flex;
  justify-content: center;
}

.label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.add-slot-box {
  padding: 1.25rem;
  border: 1.5px dashed #cbd5e1;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #64748b;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  background: #f8fafc;
}

.add-slot-box:hover {
  border-color: #2b69ad;
  color: #2b69ad;
  background: #f0f7ff;
}

.add-icon {
  width: 24px;
  height: 24px;
  background: #2b69ad;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
}

.slot-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 1.25rem;
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.slot-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
}

.slot-title {
  font-weight: 800;
  color: #475569;
}

.slot-title span {
  color: #2b69ad;
}

.btn-delete {
  background: #fff1f2;
  border: none;
  color: #e11d48;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-delete:hover {
  background: #ffe4e6;
  transform: scale(1.05);
}

.slider-wrapper {
  padding: 0 0.5rem;
}

.step-instruction {
  color: #64748b;
  font-weight: 600;
  line-height: 1.5;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

.civility-group {
  display: flex;
  gap: 0.75rem;
}

.civility-option {
  flex: 1;
  padding: 0.85rem;
  background: white;
  border: 1.5px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
  font-weight: 800;
  color: #475569;
  cursor: pointer;
  transition: all 0.2s;
}

.civility-option:hover {
  border-color: #2b69ad;
}

.civility-option.active {
  background: #2b69ad;
  border-color: #2b69ad;
  color: white;
}

.field-hint {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  margin-top: 0.5rem;
  line-height: 1.4;
}

.btn-link {
  background: transparent;
  border: none;
  color: #2b69ad;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.dual-range-container {
  position: relative;
  height: 20px;
  display: flex;
  align-items: center;
}

.range-track {
  position: absolute;
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
}

.range-highlight {
  position: absolute;
  height: 6px;
  background: #2b69ad;
  border-radius: 3px;
  z-index: 1;
}

.range-input {
  position: absolute;
  width: 100%;
  pointer-events: none;
  appearance: none;
  background: none;
  z-index: 2;
  margin: 0;
}

.range-input::-webkit-slider-thumb {
  appearance: none;
  pointer-events: auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  border: 2px solid #2b69ad;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.range-input::-moz-range-thumb {
  pointer-events: auto;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  border: 2px solid #2b69ad;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.btn-text-remove {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  text-decoration: underline;
  transition: color 0.2s;
}

.btn-text-remove:hover {
  color: #ef4444;
}

.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.mt-1 { margin-top: 0.5rem; }

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.step-content {
  padding: 1.5rem 0;
}

.mandatory-notice {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.ordonnance-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.option-card {
  border: 1.5px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: white;
}

.option-card:hover {
  border-color: #2b69ad;
  background: #f8fafc;
}

.option-card.active {
  border-color: #2b69ad;
  background: #f0f7ff;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 800;
  color: #334155;
}

.option-card.active .option-content {
  color: #2b69ad;
}

.radio-circle {
  width: 22px;
  height: 22px;
  border: 2px solid #e2e8f0;
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
}

.active .radio-circle {
  border-color: #2b69ad;
}

.active .radio-circle::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #2b69ad;
  border-radius: 50%;
}

.info-box {
  background: rgba(43, 105, 173, 0.05);
  border: 1px solid rgba(43, 105, 173, 0.1);
  border-radius: 14px;
  padding: 1rem 1.25rem;
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.info-icon {
  width: 20px;
  height: 20px;
  background: #2b69ad;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 900;
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.info-box p {
  margin: 0;
  font-size: 0.9rem;
  color: #475569;
  font-weight: 600;
  line-height: 1.5;
}

.upload-section {
  background: #f8fafc;
  border-radius: 20px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1.5px dashed #e2e8f0;
}

.upload-title {
  font-size: 1rem;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 1.25rem;
}

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.btn-upload {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.85rem 1.75rem;
  background: white;
  border: 1.5px solid #2b69ad;
  color: #2b69ad;
  border-radius: 14px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-upload:hover {
  background: #2b69ad;
  color: white;
}

.upload-hint {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 600;
  text-align: center;
}

.file-list {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #334155;
}

.file-name {
  font-size: 0.875rem;
  font-weight: 700;
  max-width: 250px;
}

.btn-remove-file {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 1rem;
  padding: 0.25rem;
}

.btn-remove-file:hover {
  color: #ef4444;
}

.summary-files {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.step-question {
  font-size: 1.75rem;
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 2rem;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.saved-soins-list {
  margin-bottom: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.saved-soin-item {
  background: #ecfdf3;
  border: 1px solid #16a34a;
  border-radius: 16px;
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.saved-soin-info {
  flex: 1;
}

.saved-soin-name {
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 0.35rem;
}

.saved-soin-details {
  color: #64748b;
  font-weight: 600;
  font-size: 0.9rem;
}

.btn-modify {
  background: white;
  border: 1px solid #16a34a;
  color: #16a34a;
  padding: 0.6rem 1.25rem;
  border-radius: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-modify:hover {
  background: #16a34a;
  color: white;
}

.radio-group {
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
}

.radio-item {
  flex: 1;
  background: #f8fafc;
  padding: 1.5rem;
  border-radius: 16px;
  text-align: center;
  font-weight: 800;
  font-size: 1.1rem;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.radio-item:hover {
  border-color: #2b69ad;
}

.radio-item.active {
  background: #2b69ad;
  color: white;
  border-color: #2b69ad;
}

.hidden-input {
  display: none;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 800;
  color: #334155;
  margin-bottom: 0.75rem;
}

.form-input {
  width: 100%;
  padding: 1rem;
  border-radius: 14px;
  border: 1.5px solid #e2e8f0;
  background: white;
  font-family: inherit;
  font-weight: 700;
  color: #334155;
  font-size: 1rem;
}

.form-input:focus {
  outline: none;
  border-color: #2b69ad;
  box-shadow: 0 0 0 3px rgba(43, 105, 173, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.step-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e2e8f0;
}

.summary-section {
  background: #f8fafc;
  border-radius: 18px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.summary-item {
  margin-bottom: 1.5rem;
}

.summary-item:last-child {
  margin-bottom: 0;
}

.summary-item strong {
  display: block;
  color: #64748b;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
  font-weight: 800;
}

.summary-value {
  font-size: 1.1rem;
  font-weight: 800;
  color: #0f172a;
}

.summary-soin {
  padding: 0.5rem 0;
  border-bottom: 1px solid #e2e8f0;
}

.summary-soin:last-child {
  border-bottom: none;
}

.btn-secondary {
  background: transparent;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 0.85rem 1.1rem;
  font-weight: 900;
  cursor: pointer;
}

.btn-primary {
  background: #2b69ad;
  border: 1px solid #2b69ad;
  color: white;
  border-radius: 14px;
  padding: 0.85rem 1.1rem;
  font-weight: 900;
  cursor: pointer;
}

/* Stepper */
.mobile-stepper {
  display: none;
}

.stepper {
  position: sticky;
  top: 1.25rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  padding: 1.5rem;
}

.stepper-title {
  font-weight: 900;
  color: #0f172a;
  margin-bottom: 1rem;
}

.stepper-track {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  padding-left: 0.25rem;
}

.stepper-track::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e2e8f0;
}

.step-node {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 1;
}

.node-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  background: white;
  border: 2px solid #e2e8f0;
  color: #94a3b8;
  transition: all 0.2s ease;
}

.node-label {
  font-weight: 800;
  color: #94a3b8;
  transition: all 0.2s ease;
}

.step-node.completed .node-icon {
  background: #69aa62;
  border-color: #69aa62;
  color: white;
}

.step-node.completed .node-label {
  color: #334155;
}

.step-node.active .node-icon {
  border-color: #2b69ad;
  color: #2b69ad;
  box-shadow: 0 0 0 4px rgba(43, 105, 173, 0.1);
}

.step-node.active .node-label {
  color: #2b69ad;
}

.stepper-hint {
  margin-top: 1.25rem;
  color: #64748b;
  font-weight: 700;
  line-height: 1.35;
}

@media (max-width: 768px) {
  .page {
    padding: 1rem 0.75rem;
  }

  .layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  /* Hide Desktop Stepper Aside */
  aside.stepper {
    display: none;
  }

  /* Add Mobile Horizontal Stepper */
  .mobile-stepper {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1.25rem;
    background: #f8fafc;
    border-radius: 18px;
    margin-bottom: 2rem;
    border: 1px solid #e2e8f0;
  }

  .m-steps-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
  }

  .m-step {
    flex: 1;
    height: 6px;
    background: #cbd5e1;
    border-radius: 3px;
    position: relative;
  }

  .m-step.completed {
    background: #16a34a;
  }

  .m-step.active {
    background: #2b69ad;
  }

  .m-step-info {
    font-size: 0.9rem;
    font-weight: 800;
    color: #2b69ad;
    text-align: left;
    margin-bottom: 0.25rem;
    position: relative;
    white-space: normal;
    line-height: 1.3;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  .title {
    font-size: 1.75rem;
  }

  .step-question {
    font-size: 1.4rem;
    line-height: 1.3;
    margin-bottom: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .soins-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .soin-card {
    padding: 1.25rem;
  }

  .step-actions {
    flex-direction: column-reverse;
    gap: 0.75rem;
    padding-top: 1.5rem;
  }

  .btn-primary, .btn-secondary {
    width: 100%;
    padding: 1rem;
  }

  .modal-overlay {
    padding: 3rem 1.25rem;
  }

  .modal {
    width: 100%;
    height: auto;
    max-height: calc(100vh - 6rem);
    border-radius: 20px;
    display: flex;
    flex-direction: column;
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
  }

  .modal-header {
    padding: 1.25rem;
  }

  .modal-body {
    flex: 1;
    padding: 1.25rem;
    background: white;
  }

  .field {
    padding: 1rem;
    border-radius: 16px;
  }

  .modal-footer {
    padding: 1rem 1.25rem calc(1rem + env(safe-area-inset-bottom));
    background: #f8fafc;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
  }

  .ordonnance-options {
    gap: 0.75rem;
  }

  .option-card {
    padding: 1rem;
  }

  .duration-pills {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }

  .pill-option {
    padding: 0.75rem 0.5rem;
    font-size: 0.85rem;
  }

  .frequency-options {
    grid-template-columns: 1fr;
  }

  .frequency-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .summary-item {
    padding: 0.75rem 0;
  }

  .summary-value {
    font-size: 1rem;
  }
}

.summary-total-card {
  margin-top: 2.5rem;
  padding: 2.5rem;
  background: #f0fdf4;
  border: 2px solid #bbf7d0;
  border-radius: 24px;
  text-align: center;
}

.total-label {
  font-size: 0.8125rem;
  font-weight: 700;
  color: #15803d;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.75rem;
}

.total-amount {
  font-size: 2.75rem;
  font-weight: 900;
  color: #166534;
  margin-bottom: 0.75rem;
}

.total-notice {
  font-size: 0.875rem;
  color: #065f46;
  opacity: 0.9;
  margin: 0;
  font-weight: 500;
}
</style>

