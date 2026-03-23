<script setup lang="ts">
import { computed, onMounted, ref, nextTick, onActivated } from 'vue';
import { getApiUrl } from '../config/api';
import LegalModal from './LegalModal.vue';
import { useLanguage } from '../composables/useLanguage';

type ChoiceField = {
  id: number;
  name: string;
  name_ar?: string | null;
  choices: string[];
  choices_ar?: string[] | null;
  soinId: number;
};

type TextField = {
  id: number;
  name: string;
  name_ar?: string | null;
  soinId: number;
};

type Soin = {
  id: number;
  name: string;
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
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
  name_ar?: string | null;
  description?: string | null;
  description_ar?: string | null;
  soins: Soin[];
};

type FieldKey = `checkbox:${number}` | `radio:${number}` | `dropdown:${number}` | `text:${number}` | 'visitType' | 'frequencyCount' | 'frequencyPeriod';

const props = defineProps<{
  serviceId: number;
  initialSoinId?: number;
}>();

const emit = defineEmits<{
  (e: 'navigate', view: string): void;
  (e: 'save', payload: { serviceId: number; soinId: number; answers: Record<FieldKey, string | string[]> }): void;
}>();

const { isAr } = useLanguage();
const tx = (fr: string, ar: string) => isAr.value ? ar : fr;

const isLoading = ref(false);
const isSuccess = ref(false);
const errorMsg = ref<string | null>(null);
const services = ref<Service[]>([]);

const service = computed(() => services.value.find((s) => s.id === props.serviceId) ?? null);
const soins = computed(() => {
  const s = service.value?.soins ?? [];
  return [...s].sort((a, b) => a.id - b.id);
});

// Pagination for Soins

const isModalOpen = ref(false);
const activeSoinId = ref<number | null>(null);
const answers = ref<Record<FieldKey, string | string[]>>({} as any);

const saved = ref<Array<{ soinId: number; answers: Record<FieldKey, string | string[]> }>>([]);
const placeSuggestions = ref<any[]>([]);
const isSearchingPlaces = ref(false);
const activeSearchField = ref<string | null>(null);
let debounceTimeout: any = null;

const fetchPlaces = (query: string, fieldId: number) => {
  if (debounceTimeout) clearTimeout(debounceTimeout);
  
  const q = (query || '').trim();
  if (q.length < 2) {
    placeSuggestions.value = [];
    isSearchingPlaces.value = false;
    return;
  }

  isSearchingPlaces.value = true;
  activeSearchField.value = `text:${fieldId}`;

  debounceTimeout = setTimeout(async () => {
    try {
      // Photon API restricted to Tunisia bbox
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&bbox=7.5,30.2,11.6,37.6&limit=6`);
      const data = await res.json();
      placeSuggestions.value = data.features || [];
    } catch (err) {
      console.error('Failed to fetch places:', err);
    } finally {
      isSearchingPlaces.value = false;
    }
  }, 400); // 400ms debounce
};

const selectPlace = (place: any, fieldId: number) => {
  const props = place.properties;
  const parts = [];
  if (props.name) parts.push(props.name);
  if (props.street) parts.push(props.street);
  if (props.city) parts.push(props.city);
  else if (props.state) parts.push(props.state);
  
  const fullAddress = parts.join(', ');
  answers.value[`text:${fieldId}`] = fullAddress;
  placeSuggestions.value = [];
  activeSearchField.value = null;
};

// Close autocomplete on blur with delay to allow selection click
const closeAutocomplete = () => {
  setTimeout(() => {
    placeSuggestions.value = [];
    activeSearchField.value = null;
  }, 200);
};

const isAmbulanceField = (fieldName: string) => {
  const lower = (fieldName || '').toLowerCase();
  return lower.includes('départ') || lower.includes('depart') ||
         lower.includes('arrivée') || lower.includes('arrivee') ||
         lower.includes('destination') || lower.includes('transport');
};

const currentStep = ref(1);
const steps = computed(() => [
  { id: 1, title: tx('Choisissez vos soin/s !', 'اختر خدماتك!') },
  { id: 2, title: tx('Avez-vous une ordonnance ?', 'هل لديك وصفة طبية؟') },
  { id: 3, title: tx('Planification et Matériel', 'التخطيط والمعدات') },
  { id: 4, title: tx('Qui est le patient ?', 'من هو المريض؟') },
  { id: 5, title: tx('Récapitulatif de votre demande', 'ملخص طلبك') },
]);

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
  legalAccepted: false,
  addressComplement: '',
  latitude: null as number | null,
  longitude: null as number | null,
  gender: 'any' as 'any' | 'male' | 'female',
  medicalEquipment: [] as string[]
});

const resetForm = () => {
  isLoading.value = false;
  isSuccess.value = false;
  errorMsg.value = null;
  currentStep.value = 1;
  saved.value = [];
  isModalOpen.value = false;
  activeSoinId.value = null;
  answers.value = {} as any;
  formData.value = {
    hasOrdonnance: '',
    prescriptionFiles: [],
    address: '',
    isIndifferent: false,
    startDate: '2026-01-23',
    durationMode: '1',
    customDuration: 1,
    availabilitySlots: [],
    patientCivility: 'Mme',
    patientFirstname: '',
    patientLastname: '',
    patientBirthDate: '',
    patientPhone: '',
    patientPhoneConfirm: '',
    patientEmail: '',
    legalAccepted: false,
    addressComplement: '',
    latitude: null,
    longitude: null,
    gender: 'any',
    medicalEquipment: []
  };
};

onActivated(() => {
  resetForm();
});

const equipmentOptions = [
  { name: 'Lit médicalisé', nameAr: 'سرير طبي' },
  { name: 'Matelas anti-escarres', nameAr: 'مرتبة ضد القروح' },
  { name: 'Concentrateur d’oxygène', nameAr: 'مكثف أوكسجين' },
  { name: 'Fauteuil roulant', nameAr: 'كرسي متحرك' },
  { name: 'Déambulateur', nameAr: 'مشاية' },
  { name: 'Nébuliseur', nameAr: 'جهاز تبخير' },
  { name: 'Pompe à perfusion', nameAr: 'مضخة محاليل' }
];
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
  // allow re-selecting the same file(s)
  input.value = '';
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

    const res = await fetch(getApiUrl('/services'), { headers });
    
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

    // Auto-open soin if navigated directly from search
    if (props.initialSoinId) {
      await nextTick();
      const soin = soins.value.find(s => s.id === props.initialSoinId);
      if (soin) {
        openSoinForm(soin.id);
      }
    } else if ((props.serviceId === 3 || props.serviceId === 2) && soins.value.length > 0) {
      // Auto-open first soin for Ambulance (3) and Medical Equipment (2)
      await nextTick();
      const firstSoin = soins.value[0];
      if (firstSoin) {
        openSoinForm(firstSoin.id);
      }
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

  // For Ambulance, jump directly to Patient Info step and sync address
  if (props.serviceId === 3) {
    // Sync "Départ" to formData.address if found
    for (const [key, value] of Object.entries(answers.value)) {
      if (key.startsWith('text:')) {
        const parts = key.split(':');
        const idStr = parts[1];
        if (!idStr) continue;
        const fieldId = parseInt(idStr);
        const field = activeSoin.value.texts.find(f => f.id === fieldId);
        if (field && field.name && (field.name.toLowerCase().includes('départ') || field.name.toLowerCase().includes('depart'))) {
          formData.value.address = value as string;
          break;
        }
      }
    }
    currentStep.value = 4;
  } else if (props.serviceId === 2) {
    // For Medical Equipment, skip Step 2 (Ordonnance) and go to Step 3
    currentStep.value = 3;
  }

  const existingIndex = saved.value.findIndex(s => s.soinId === payload.soinId);
  if (existingIndex >= 0) {
    saved.value[existingIndex] = { soinId: payload.soinId, answers: payload.answers };
  } else {
    saved.value.push({ soinId: payload.soinId, answers: payload.answers });
  }
  emit('save', payload);
  closeModal();
};

const editSoin = (soinId: number) => {
  const savedSoin = saved.value.find(s => s.soinId === soinId);
  if (savedSoin) {
    answers.value = savedSoin.answers;
    openSoinForm(soinId);
  }
};

const getSoinName = (soinId: number) => {
  const s = soins.value.find(s => s.id === soinId);
  if (!s) return 'Soin';
  return isAr.value && s.name_ar ? s.name_ar : s.name;
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
      if (field) {
        const translatedChoices = value.map(v => {
          const idx = field.choices.indexOf(v);
          return (isAr.value && field.choices_ar?.[idx]) ? field.choices_ar[idx] : v;
        });
        parts.push(translatedChoices.join(', '));
      }
    } else if (type === 'radio' && value) {
      const field = soin.radios.find(f => f.id === id);
      if (field) {
        const idx = field.choices.indexOf(value as string);
        const translated = (isAr.value && field.choices_ar?.[idx]) ? field.choices_ar[idx] : value;
        parts.push(translated as string);
      }
    } else if (type === 'dropdown' && value) {
      const field = soin.dropdowns.find(f => f.id === id);
      if (field) {
        const idx = field.choices.indexOf(value as string);
        const translated = (isAr.value && field.choices_ar?.[idx]) ? field.choices_ar[idx] : value;
        parts.push(translated as string);
      }
    } else if (type === 'text' && value) {
      parts.push(value as string);
    }
  }

  // Add frequency info
  return parts.join(' / ') || '';
};

const nextStep = () => {
  if (currentStep.value === 1 && props.serviceId === 2) {
    currentStep.value = 3;
  } else if (currentStep.value < 5) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value === 3 && props.serviceId === 2) {
    currentStep.value = 1;
  } else if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const isSubmitting = ref(false);

const showLegalModal = ref(false);

const onLegalAccepted = () => {
  formData.value.legalAccepted = true;
  showLegalModal.value = false;
  submitRequest();
};

const handleFinalSubmit = () => {
  if (!formData.value.legalAccepted) {
    showLegalModal.value = true;
  } else {
    submitRequest();
  }
};

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
    if (formData.value.gender && formData.value.gender !== 'any') {
      fd.append('gender', formData.value.gender);
    }

    if (formData.value.medicalEquipment && formData.value.medicalEquipment.length > 0) {
      fd.append('materiel', formData.value.medicalEquipment.join(', '));
    }
    
    // Backend expects 'fixed' but we can send our mode, or just map '1','7'... to 'fixed'
    fd.append('durationMode', formData.value.durationMode === 'long' ? 'long' : 'fixed');

    // Calculate Duration Value
    let dVal = 0;
    if (formData.value.durationMode === 'long') dVal = 60;
    else if (formData.value.durationMode === 'custom') dVal = formData.value.customDuration;
    else dVal = parseInt(formData.value.durationMode);
    fd.append('durationValue', dVal.toString());

    // Slots - Always send something as backend requires these
    if (formData.value.availabilitySlots && formData.value.availabilitySlots.length > 0) {
      fd.append('availabilityStart', formData.value.availabilitySlots[0]?.start || '08:00');
      fd.append('availabilityEnd', formData.value.availabilitySlots[0]?.end || '20:00');
    } else {
      // Fallback if Step 3 was skipped
      fd.append('availabilityStart', '08:00');
      fd.append('availabilityEnd', '20:00');
    }

    // Backend log showed 'available'. We map our internal states.
    const pStat = formData.value.hasOrdonnance === 'none' ? 'pending' : 'available';
    fd.append('prescriptionStatus', pStat);

    // Soins Array
    const mappedSoins = saved.value.map(s => {
      const answersCopy = { ...s.answers } as any;
      
      // Remove frequency fields from answers object to keep it "clean"
      delete answersCopy['visitType'];
      delete answersCopy['frequencyCount'];
      delete answersCopy['frequencyPeriod'];

      return {
        soinId: s.soinId,
        answers: answersCopy, // Only custom fields here
        visitType: 'once',
        frequencyCount: 1,
        frequencyPeriod: 'jour'
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

    const res = await fetch(getApiUrl('/bookings'), {
      method: 'POST',
      headers,
      body: fd
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Submission failed with status ${res.status}`);
    }
    // Instead of alert, show success state
    isSuccess.value = true;
    alert('Demande envoyée avec succès !');
    window.scrollTo({ top: 0, behavior: 'smooth' });

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
      total += soinObj.price * duration;
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
          <button class="btn-back" @click="emit('navigate', 'landing')">{{ tx('← Retour', '→ رجوع') }}</button>
          <div class="header-text" :dir="isAr ? 'rtl' : 'ltr'">
            <h1 class="title">{{ (isAr && service?.name_ar ? service.name_ar : service?.name) || 'Service' }}</h1>
            <p class="subtitle">{{ (isAr && service?.description_ar ? service.description_ar : service?.description) || 'Choisissez un soin pour continuer.' }}</p>
          </div>
        </header>

        <div v-if="isLoading" class="state">{{ tx('Chargement…', 'جار التحميل...') }}</div>
        
        <!-- Success State View -->
        <div v-else-if="isSuccess" class="success-view">
          <div class="success-card">
            <div class="success-icon-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="success-svg"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            </div>
            <h2 class="success-title">{{ tx('Demande envoyée !', 'تم إرسال الطلب!') }}</h2>
            <p class="success-message">
              {{ tx('Votre demande de rendez-vous a été enregistrée avec succès.', 'تم تسجيل طلب موعدك بنجاح.') }}
              <br/>
              <strong>{{ tx('Montant total estimé :', 'المبلغ الإجمالي المقدر:') }} {{ totalPrice }} DT</strong>
            </p>
            <div class="success-steps" :dir="isAr ? 'rtl' : 'ltr'">
              <div class="success-step-item">
                <div class="step-dot">1</div>
                <div class="step-text">{{ tx('Un professionnel de santé va examiner votre demande.', 'سيقوم أخصائي صحي بمراجعة طلبك.') }}</div>
              </div>
              <div class="success-step-item">
                <div class="step-dot">2</div>
                <div class="step-text">{{ tx('Vous recevrez une notification dès qu’un professionnel l’acceptera.', 'ستتلقى إشعارًا بمجرد قبول أحد المتخصصين للطلب.') }}</div>
              </div>
            </div>

            <!-- Payment Alert -->
            <div class="payment-alert" :dir="isAr ? 'rtl' : 'ltr'">
              <div class="payment-alert-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <div class="payment-alert-body">
                <div class="payment-alert-title">{{ tx('Paiement requis avant la prestation', 'الدفع مطلوب قبل تنفيذ الخدمة') }}</div>
                <div class="payment-alert-text">{{ tx('Veuillez noter que le paiement doit être effectué avant que le professionnel de santé intervienne. Aucune prestation ne sera réalisée sans règlement préalable. Le professionnel apporte toujours son propre matériel.', 'يرجى العلم أن الدفع يجب أن يتم قبل أن يقوم المختص الصحي بتقديم الخدمة. لن يتم تنفيذ أي خدمة دون دفع مسبق. يقوم المتخصص دائمًا بإحضار معداته الخاصة.') }}</div>
              </div>
            </div>

            <button class="btn-primary success-btn" @click="emit('navigate', 'landing')">{{ tx('Retour à l\'accueil', 'العودة للرئيسية') }}</button>
          </div>
        </div>

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
          <h2 class="step-question" v-if="serviceId !== 2">{{ tx('Choisissez vos soin/s !', 'اختر خدماتك!') }}</h2>
          <h2 class="step-question" v-else>{{ tx('Dites-nous en plus sur votre besoin', 'أخبرنا المزيد عن احتياجاتك') }}</h2>
          
          <div v-if="saved.length > 0" class="saved-soins-list">
            <div v-for="savedItem in saved" :key="savedItem.soinId" class="saved-soin-item">
              <div class="saved-soin-info">
                <div class="saved-soin-name" :dir="isAr ? 'rtl' : 'ltr'">{{ getSoinName(savedItem.soinId) }}</div>
                <div class="saved-soin-details" :dir="isAr ? 'rtl' : 'ltr'">{{ formatSoinAnswers(savedItem.soinId) }}</div>
              </div>
              <button class="btn-modify" @click="editSoin(savedItem.soinId)">{{ tx('Modifier', 'تعديل') }}</button>
            </div>
          </div>
          
          <div class="soins-grid" v-if="serviceId !== 2">
            <button
              v-for="soin in soins"
              :key="soin.id"
              class="soin-card"
              :class="{ saved: isSoinSaved(soin.id) }"
              @click="openSoinForm(soin.id)"
            >
              <div class="soin-header">
                <div class="soin-name" :dir="isAr ? 'rtl' : 'ltr'">{{ isAr && soin.name_ar ? soin.name_ar : soin.name }}</div>
                <div v-if="isSoinSaved(soin.id)" class="soin-checkmark">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
              </div>
              <div class="soin-desc" :dir="isAr ? 'rtl' : 'ltr'">{{ (isAr && soin.description_ar ? soin.description_ar : soin.description) || '—' }}</div>
              <div class="soin-cta">
                <span v-if="isSoinSaved(soin.id)">{{ tx('Déjà ajouté', 'تمت الإضافة') }}</span>
                <span v-else>{{ tx('Remplir le formulaire', 'ملء النموذج') }}</span>
              </div>
            </button>
          </div>

          <!-- Re-fill CTA for Service 2 if modal is closed -->
          <div v-if="serviceId === 2 && saved.length === 0" class="empty-soin-cta" @click="soins[0] && openSoinForm(soins[0].id)">
            <div class="cta-icon">+</div>
            <span>{{ tx('Remplir le formulaire de location', 'ملء استمارة الإيجار') }}</span>
          </div>
          
          <div class="step-actions">
            <button class="btn-primary" @click="nextStep">{{ tx('Continuer', 'متابعة') }}</button>
          </div>
        </div>

        <!-- Step 2: Avez-vous une ordonnance ? -->
        <div v-else-if="currentStep === 2 && serviceId !== 2" class="step-content">
          <div class="mandatory-notice">{{ tx('* champs obligatoires', '* حقول إلزامية') }}</div>
          <h2 class="step-question">{{ tx('Avez-vous une ordonnance ? *', 'هل لديك وصفة طبية؟ *') }}</h2>
          
          <div class="ordonnance-options">
            <label class="option-card" :class="{ active: formData.hasOrdonnance === 'home-mention' }">
              <input type="radio" v-model="formData.hasOrdonnance" value="home-mention" class="hidden-input" />
              <div class="option-content">
                <div class="radio-circle"></div>
                <span>{{ tx('Oui, avec mention “à domicile”', 'نعم، مع إشارة "في المنزل"') }}</span>
              </div>
            </label>

            <label class="option-card" :class="{ active: formData.hasOrdonnance === 'no-mention' }">
              <input type="radio" v-model="formData.hasOrdonnance" value="no-mention" class="hidden-input" />
              <div class="option-content">
                <div class="radio-circle"></div>
                <span>{{ tx('Oui, sans mention', 'نعم، بدون إشارة') }}</span>
              </div>
            </label>

            <label class="option-card" :class="{ active: formData.hasOrdonnance === 'none' }">
              <input type="radio" v-model="formData.hasOrdonnance" value="none" class="hidden-input" />
              <div class="option-content">
                <div class="radio-circle"></div>
                <span>{{ tx('Non', 'لا') }}</span>
              </div>
            </label>
          </div>

          <div class="info-box">
            <div class="info-icon">i</div>
            <p>{{ tx('Si vous avez une ordonnance avec mention “à domicile”, l’intervention et le déplacement seront pris en charge par la sécurité sociale et votre mutuelle.', 'إذا كان لديك وصفة طبية مع إشارة "في المنزل"، سيتم تغطية التدخل والتنقل من قبل التأمين الصحي.') }}</p>
          </div>

          <!-- Upload section (optional) - Only show if not 'none' -->
          <div v-if="formData.hasOrdonnance && formData.hasOrdonnance !== 'none'" class="upload-section">
            <h3 class="upload-title">{{ tx('Ajoutez votre ordonnance si vous l’avez à disposition (facultatif)', 'أضف وصفتك الطبية إن توفرت (اختياري)') }}</h3>
            <div class="upload-area">
              <input type="file" ref="fileInput" class="hidden" multiple accept=".jpg,.jpeg,.png,.pdf" @change="handleFiles" />
              <button class="btn-upload" @click="triggerFileUpload">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                {{ tx('Ajouter un document', 'إضافة وثيقة') }}
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
            <button class="btn-secondary" @click="prevStep">{{ tx('Précédent', 'السابق') }}</button>
            <button class="btn-primary" @click="nextStep" :disabled="!formData.hasOrdonnance">{{ tx('Continuer', 'متابعة') }}</button>
          </div>
        </div>

        <!-- Step 3: Où et quand souhaitez-vous faire vos soins ? -->
        <div v-else-if="currentStep === 3" class="step-content">
          <div v-if="serviceId !== 2" class="mandatory-notice">{{ tx('* champs obligatoires', '* حقول إلزامية') }}</div>
          <h2 class="step-question">{{ tx('Où et quand souhaitez-vous faire vos soins ?', 'أين ومتى تريد تلقي الرعاية؟') }}</h2>
          
          <div class="form-group mb-2">
            <div class="label-with-action">
              <label>{{ tx('Lieu des soins', 'مكان الرعاية') }}</label>
              <button class="btn-text" :class="{ active: formData.isIndifferent }" @click="formData.isIndifferent = !formData.isIndifferent">
                <div class="check-box" :class="{ checked: formData.isIndifferent }">
                  <span v-if="formData.isIndifferent">✓</span>
                </div>
                {{ tx('Indifférent', 'غير مهم') }}
              </button>
            </div>
            <input v-model="formData.address" type="text" class="form-input" :placeholder="tx('Ex: 123 Rue de Médical, Paris', 'مثال: شارع التطبيب, تونس')" :disabled="formData.isIndifferent" />
          </div>

          <div class="form-group">
            <label>{{ tx('Date de début des soins', 'تاريخ البدء') }}</label>
            <input v-model="formData.startDate" type="date" class="form-input" />
          </div>

          <div class="form-group">
            <label>{{ props.serviceId === 2 ? tx('Durée des location(en jours) *', 'مدة الإيجار (بالأيام) *') : tx('Durée des soins (en jours) *', 'مدة الرعاية (بالأيام) *') }}</label>
            <div class="duration-pills">
              <label v-for="d in ['1', '7', '10', '15', '30']" :key="d" class="pill-option" :class="{ active: formData.durationMode === d }">
                <input type="radio" v-model="formData.durationMode" :value="d" class="hidden" />
                <span>{{ d }} {{ tx('jour', 'يوم') }}{{ !isAr && d !== '1' ? 's' : '' }}</span>
              </label>
              <label class="pill-option" :class="{ active: formData.durationMode === 'long' }">
                <input type="radio" v-model="formData.durationMode" value="long" class="hidden" />
                <span>{{ tx('Longue durée (60 jours ou +)', 'مدة طويلة (60 يوم أو أكثر)') }}</span>
              </label>
              <label class="pill-option" :class="{ active: formData.durationMode === 'custom' }">
                <input type="radio" v-model="formData.durationMode" value="custom" class="hidden" />
                <span>{{ tx('Personnaliser la durée', 'تخصيص المدة') }}</span>
              </label>
            </div>
            <div v-if="formData.durationMode === 'custom'" class="custom-duration-input mt-1">
              <input v-model="formData.customDuration" type="number" min="1" class="form-input mini" />
              <span class="unit">{{ tx('jours', 'أيام') }}</span>
            </div>
          </div>

          <div class="form-group availabilities">
            <div class="label-row">
              <label>{{ tx('Disponibilités horaires *', 'التوفر الزمني *') }}</label>
            </div>
            <div class="info-tag mb-1">
              L’heure de passage précise sera à définir avec le professionnel de santé
            </div>

            <div v-if="formData.availabilitySlots.length === 0" class="add-slot-box" @click="addSlot">
              <div class="add-icon">+</div>
              <span>{{ tx('Ajouter un créneau de passage', 'إضافة فترة زمنية') }}</span>
            </div>

            <div v-else class="slot-card">
              <div class="slot-card-header">
                <div class="slot-title">{{ tx('Votre créneau :', 'فترتك الزمنية:') }} <span>{{ formData.availabilitySlots[0]?.start }} — {{ formData.availabilitySlots[0]?.end }}</span></div>
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


            <div v-if="serviceId === 1" class="form-group mt-1">
              <label>{{ tx('Genre du professionnel souhaité', 'جنس المختص الصحي المفضل') }}</label>
              <div class="gender-options">
                <label class="gender-radio">
                  <input type="radio" value="any" v-model="formData.gender" />
                  <span class="radio-label">{{ tx('Indifférent', 'لا يهم') }}</span>
                </label>
                <label class="gender-radio">
                  <input type="radio" value="male" v-model="formData.gender" />
                  <span class="radio-label">{{ tx('Homme', 'رجل') }}</span>
                </label>
                <label class="gender-radio">
                  <input type="radio" value="female" v-model="formData.gender" />
                  <span class="radio-label">{{ tx('Femme', 'امرأة') }}</span>
                </label>
              </div>
            </div>
          </div>

          <div class="step-actions">
            <button class="btn-secondary" @click="prevStep">{{ tx('Précédent', 'السابق') }}</button>
            <button class="btn-primary" @click="nextStep" :disabled="(!formData.address && !formData.isIndifferent) || !formData.startDate || formData.availabilitySlots.length === 0">{{ tx('Continuer', 'متابعة') }}</button>
          </div>
        </div>

        <!-- Step 4: Qui est le patient ? -->
        <div v-else-if="currentStep === 4" class="step-content">
          <div v-if="serviceId !== 2" class="mandatory-notice">* champs obligatoires</div>
          <h2 class="step-question">Qui est le patient ?</h2>
          <p class="step-instruction">
            Saisissez vos coordonnées afin qu’un professionnel de santé qualifié et disponible prenne contact avec vous pour convenir d’un rendez-vous.
          </p>

          <div class="form-group">
            <label>{{ tx('Civilité *', 'اللقب *') }}</label>
            <div class="civility-group">
              <label class="civility-option" :class="{ active: formData.patientCivility === 'Mme' }">
                <input type="radio" v-model="formData.patientCivility" value="Mme" class="hidden" />
                <span>{{ tx('Madame', 'السيدة') }}</span>
              </label>
              <label class="civility-option" :class="{ active: formData.patientCivility === 'M' }">
                <input type="radio" v-model="formData.patientCivility" value="M" class="hidden" />
                <span>{{ tx('Monsieur', 'السيد') }}</span>
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ tx('Prénom *', 'الاسم الأول *') }}</label>
              <input v-model="formData.patientFirstname" type="text" class="form-input" :placeholder="tx('Ex: Jean', 'مثال: محمد')" />
            </div>
            <div class="form-group">
              <label>{{ tx('Nom *', 'اللقب *') }}</label>
              <input v-model="formData.patientLastname" type="text" class="form-input" :placeholder="tx('Ex: Dupont', 'مثال: بن سالم')" />
            </div>
          </div>

          <div class="form-group">
            <label>{{ tx('Date de naissance *', 'تاريخ الميلاد *') }}</label>
            <input v-model="formData.patientBirthDate" type="date" class="form-input" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>{{ tx('Numéro de téléphone *', 'رقم الهاتف *') }}</label>
              <input v-model="formData.patientPhone" type="tel" class="form-input" :placeholder="tx('00 000 000', '00 000 000')" />
              <p class="field-hint">{{ tx('Le professionnel vous contactera sur ce numéro pour convenir d\'un rendez-vous', 'سيتصل بك المتخصص على هذا الرقم لتحديد الموعد') }}</p>
            </div>
            <div class="form-group">
              <label>{{ tx('Confirmez le téléphone *', 'Téléphone *') }}</label>
              <input v-model="formData.patientPhoneConfirm" type="tel" class="form-input" :placeholder="tx('00 000 000', '00 000 000')" />
            </div>
          </div>

          <div class="form-group">
            <label>{{ tx('Email', 'البريد الإلكتروني') }}</label>
            <input v-model="formData.patientEmail" type="email" class="form-input" :placeholder="tx('email@exemple.com', 'example@email.com')" />
          </div>

          <div class="form-group">
            <div class="label-row">
              <label>{{ tx('Adresse *', 'العنوان *') }}</label>
              <button class="btn-link" @click="getLocation">{{ tx('Je ne trouve pas mon adresse', 'لا أجد عنواني') }}</button>
            </div>
            <input v-model="formData.address" type="text" class="form-input" placeholder="Ex: 123 Rue de la Santé, Paris" />
            <p class="field-hint">Lieu où les soins “à domicile” seront réalisés</p>
          </div>

          <div class="form-group">
            <label>{{ tx('Complément d\'adresse (facultatif)', 'معلومات إضافية للعنوان (اختياري)') }}</label>
            <input v-model="formData.addressComplement" type="text" class="form-input" :placeholder="tx('Bâtiment, code, étage...', 'مبنى، رمز، طابق...')" />
            <p class="field-hint">{{ tx('Indiquez les informations pour simplifier l\'accès au lieu de rendez-vous (bâtiment, codes, étage, etc...)', 'أضف تفاصيل لتسهيل الوصول (مبنى، رموز، طابق، إلخ...)') }}</p>
          </div>

          <div class="step-actions">
            <button class="btn-secondary" @click="prevStep">{{ tx('Précédent', 'السابق') }}</button>
            <button class="btn-primary" @click="nextStep" :disabled="!formData.patientFirstname || !formData.patientLastname || !formData.patientBirthDate || !formData.patientPhone || (!formData.address && !formData.isIndifferent)">{{ tx('Continuer', 'متابعة') }}</button>
          </div>
        </div>

        <!-- Step 5: Récapitulatif de votre demande -->
        <div v-else-if="currentStep === 5" class="step-content">
          <h2 class="step-question">{{ tx('Récapitulatif de votre demande', 'ملخص طلبك') }}</h2>
          <div class="summary-section">
            <div class="summary-item">
              <strong>{{ tx('Soins demandés:', 'الرعاية المطلوبة:') }}</strong>
              <div class="summary-value">
                <div v-if="saved.length === 0" class="summary-no-soin">
                  {{ tx('Aucun soin spécifique sélectionné', 'لم يتم اختيار رعاية محددة') }}
                </div>
                <div v-else v-for="savedItem in saved" :key="savedItem.soinId" class="summary-soin">
                  {{ getSoinName(savedItem.soinId) }} - {{ formatSoinAnswers(savedItem.soinId) }}
                </div>
              </div>
            </div>
            <div class="summary-item">
              <strong>{{ tx('Ordonnance:', 'الوصفة الطبية:') }}</strong>
              <div class="summary-value">
                {{ formData.hasOrdonnance === 'home-mention' ? tx('Oui, avec mention “à domicile”', 'نعم، مع إشارة "في المنزل"') : 
                   formData.hasOrdonnance === 'no-mention' ? tx('Oui, sans mention', 'نعم، بدون إشارة') : tx('Non', 'لا') }}
                <div v-if="formData.prescriptionFiles.length > 0" class="summary-files">
                  ({{ formData.prescriptionFiles.length }} {{ tx('document(s) joint(s)', 'وثيقة (وثائق) مرفقة') }})
                </div>
              </div>
            </div>
            <div class="summary-item">
              <strong>{{ tx('Lieu:', 'المكان:') }}</strong>
              <div class="summary-value">{{ formData.isIndifferent ? tx('Indifférent', 'غير مهم') : formData.address }}</div>
            </div>
            <div class="summary-item">
              <strong>{{ tx('Début & Durée:', 'البداية والمدة:') }}</strong>
              <div class="summary-value">
                {{ isAr ? 'بتاريخ' : 'Le' }} {{ formData.startDate }} {{ isAr ? 'لمدة' : 'pour' }} {{ formData.durationMode === 'custom' ? formData.customDuration : (formData.durationMode === 'long' ? '60+' : formData.durationMode) }} {{ tx('jour(s)', 'يوم (أيام)') }}
              </div>
            </div>
            <div class="summary-item">
              <strong>{{ tx('Disponibilité:', 'الفترة الزمنية:') }}</strong>
              <div class="summary-value">
                <div v-if="formData.availabilitySlots.length > 0">
                  {{ formData.availabilitySlots[0]?.start }} {{ tx('à', 'إلى') }} {{ formData.availabilitySlots[0]?.end }}
                </div>
              </div>
            </div>
            <div class="summary-item" v-if="serviceId === 1">
              <strong>{{ tx('Préférence Genre:', 'تفضيل الجنس:') }}</strong>
              <div class="summary-value">
                {{ formData.gender === 'male' ? tx('Homme', 'ذكر') : 
                   formData.gender === 'female' ? tx('Femme', 'أنثى') : tx('Indifférent', 'غير مهم') }}
              </div>
            </div>
            <div class="summary-item" v-if="formData.medicalEquipment.length > 0">
              <strong>{{ tx('Matériel médical:', 'المعدات الطبية:') }}</strong>
              <div class="summary-value">
                {{ formData.medicalEquipment.map(name => {
                  const opt = equipmentOptions.find(o => o.name === name);
                  return opt ? tx(opt.name, opt.nameAr) : name;
                }).join(', ') }}
              </div>
            </div>
            <div class="summary-item">
              <strong>{{ tx('Patient:', 'المريض:') }}</strong>
              <div class="summary-value">
                {{ formData.patientCivility }} {{ formData.patientFirstname }} {{ formData.patientLastname }}<br/>
                {{ tx('Né(e) le', 'تاريخ الميلاد:') }} {{ formData.patientBirthDate }}<br/>
                {{ tx('Tél:', 'هاتف:') }} {{ formData.patientPhone }}<br/>
                {{ tx('Email:', 'بريد:') }} {{ formData.patientEmail }}
              </div>
            </div>
            <div v-if="formData.addressComplement" class="summary-item">
              <strong>{{ tx('Complément d\'adresse:', 'معلومات إضافية:') }}</strong>
              <div class="summary-value">{{ formData.addressComplement }}</div>
            </div>

            <div v-if="totalPrice > 0" class="summary-total-card">
              <div class="total-label">{{ tx('Montant total estimé', 'المبلغ الإجمالي المقدر') }}</div>
              <div class="total-amount">{{ totalPrice }} DT</div>
              <p class="total-notice">{{ tx('Le paiement s\'effectue directement auprès du professionnel de santé.', 'الدفع يتم مباشرة مع المتخصص الصحي.') }}</p>
            </div>
          </div>

          <!-- Legal Consent Checkbox (Visual hint for the modal) -->
          <div class="legal-consent-container" @click="showLegalModal = true" style="margin-bottom: 2rem; cursor: pointer;">
            <div class="checkbox-row" style="display: flex; align-items: flex-start; gap: 1rem;">
              <div class="check-box" :class="{ 'checked': formData.legalAccepted }" style="width: 22px; height: 22px; border: 2px solid #2b69ad; border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: white; transition: all 0.2s;">
                <svg v-if="formData.legalAccepted" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2b69ad" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </div>
              <div class="consent-text" style="font-size: 0.95rem; color: #475569; font-weight: 600; line-height: 1.4;">
                {{ tx('J’accepte les Conditions Générales et la Politique de Confidentialité', 'أوافق على الشروط العامة وسياسة الخصوصية') }}
              </div>
            </div>
            <p v-if="!formData.legalAccepted" class="legal-hint" style="color: #ef4444; font-size: 0.8rem; margin-top: 0.5rem; margin-left: 2.3rem;">
              {{ tx('Cliquer ici pour lire et accepter (requis)', 'انقر هنا للقراءة والموافقة (مطلوب)') }}
            </p>
          </div>

          <div class="step-actions">
            <button class="btn-secondary" @click="prevStep" :disabled="isSubmitting">{{ tx('Précédent', 'السابق') }}</button>
            <button class="btn-primary btn-submit" @click="handleFinalSubmit" :disabled="isSubmitting">
              <span v-if="isSubmitting" class="spinner-mini"></span>
              <span>{{ isSubmitting ? tx('Envoi en cours...', 'جار الإرسال...') : tx('Confirmer la demande', 'تأكيد الطلب') }}</span>
            </button>
          </div>

          <!-- Legal Modal -->
          <LegalModal 
            :show="showLegalModal" 
            @accept="onLegalAccepted" 
            @close="showLegalModal = false"
            @navigate="(v: string) => $emit('navigate', v)"
          />
          <div v-if="errorMsg" class="state error mt-1">{{ errorMsg }}</div>
        </div>
        </template>
        <div v-else class="state">
          <p>{{ tx('Désolé, ce service est introuvable ou n\'existe plus.', 'عذراً، هذه الخدمة غير موجودة أو لم تعد متاحة.') }}</p>
          <button class="btn-primary mt-1" @click="emit('navigate', 'landing')">{{ tx('Retour à l\'accueil', 'العودة للرئيسية') }}</button>
        </div>
      </div>

      <!-- Right Stepper -->
      <aside class="stepper">
        <div class="stepper-title">{{ tx('Étapes', 'الخطوات') }}</div>
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
          <div v-if="currentStep === 1">{{ tx('Ajoutez un ou plusieurs soins, puis continuez.', 'أضف خدمة أو أكثر، ثم تابع.') }}</div>
          <div v-else-if="currentStep === 2">{{ tx('Indiquez si vous avez une ordonnance.', 'أشر إلى ما إذا كان لديك وصفة طبية.') }}</div>
          <div v-else-if="currentStep === 3">{{ tx('Renseignez le lieu et la date des soins.', 'حدد مكان وتاريخ الرعاية.') }}</div>
          <div v-else-if="currentStep === 4">{{ tx('Indiquez les informations du patient.', 'أدخل معلومات المريض.') }}</div>
          <div v-else>{{ tx('Vérifiez votre récapitulatif avant de confirmer.', 'راجع ملخصك قبل التأكيد.') }}</div>
        </div>
      </aside>
    </div>

    <!-- Modal -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <div>
            <div class="modal-title" :dir="isAr ? 'rtl' : 'ltr'">{{ isAr && activeSoin?.name_ar ? activeSoin.name_ar : activeSoin?.name }}</div>
            <div class="modal-subtitle" :dir="isAr ? 'rtl' : 'ltr'">{{ (isAr && activeSoin?.description_ar ? activeSoin.description_ar : activeSoin?.description) || tx('Renseignez les champs ci-dessous.', 'أكمل الحقول أدناه.') }}</div>
          </div>
          <button class="btn-close" @click="closeModal" aria-label="Fermer">✕</button>
        </div>

        <div class="modal-body">
          <!-- Checkboxes FIRST -->
          <template v-if="activeSoin?.checkboxes && activeSoin.checkboxes.length > 0">
            <div v-for="field in activeSoin.checkboxes" :key="`cb-${field.id}`" class="field">
              <div class="field-label" :dir="isAr ? 'rtl' : 'ltr'">{{ isAr && field.name_ar ? field.name_ar : field.name }} <span class="badge">{{ tx('Multiple', 'متعدد') }}</span></div>
              <div class="choices">
                <label v-for="(choice, idx) in field.choices" :key="choice" class="pill" :class="{ active: (answers[`checkbox:${field.id}`] as string[])?.includes(choice) }">
                  <input type="checkbox" class="hidden" :value="choice" v-model="answers[`checkbox:${field.id}`]" />
                  <span>{{ isAr && field.choices_ar?.[idx] ? field.choices_ar[idx] : choice }}</span>
                </label>
              </div>
            </div>
          </template>

          <!-- Radios SECOND (always after checkboxes) -->
          <template v-if="activeSoin?.radios && activeSoin.radios.length > 0">
            <div v-for="field in activeSoin.radios" :key="`rd-${field.id}`" class="field">
              <div class="field-label" :dir="isAr ? 'rtl' : 'ltr'">{{ isAr && field.name_ar ? field.name_ar : field.name }} <span class="badge">{{ tx('Unique', 'واحد') }}</span></div>
              <div class="choices">
                <label v-for="(choice, idx) in field.choices" :key="choice" class="pill" :class="{ active: answers[`radio:${field.id}`] === choice }">
                  <input
                    type="radio"
                    class="hidden"
                    :name="`radio-${field.id}`"
                    :value="choice"
                    v-model="answers[`radio:${field.id}`]"
                  />
                  <span>{{ isAr && field.choices_ar?.[idx] ? field.choices_ar[idx] : choice }}</span>
                </label>
              </div>
            </div>
          </template>

          <!-- Dropdowns THIRD -->
          <template v-if="activeSoin?.dropdowns && activeSoin.dropdowns.length > 0">
            <div v-for="field in activeSoin.dropdowns" :key="`dr-${field.id}`" class="field">
              <div class="field-label" :dir="isAr ? 'rtl' : 'ltr'">{{ isAr && field.name_ar ? field.name_ar : field.name }} <span class="badge">{{ tx('Liste', 'قائمة') }}</span></div>
              <select v-model="answers[`dropdown:${field.id}`]" class="select">
                <option value="" disabled>{{ tx('Choisir…', 'اختر…') }}</option>
                <option v-for="(choice, idx) in field.choices" :key="choice" :value="choice">{{ isAr && field.choices_ar?.[idx] ? field.choices_ar[idx] : choice }}</option>
              </select>
            </div>
          </template>

          <!-- Texts FOURTH -->
          <template v-if="activeSoin?.texts && activeSoin.texts.length > 0">
            <div v-for="field in activeSoin.texts" :key="`tx-${field.id}`" 
                 class="field autocomplete-wrapper" 
                 :class="{ 'searching-active': activeSearchField === `text:${field.id}` }">
              <div class="field-label" :dir="isAr ? 'rtl' : 'ltr'">{{ isAr && field.name_ar ? field.name_ar : field.name }} <span class="badge">{{ tx('Texte', 'نص') }}</span></div>
              
              <!-- Check if it's Ambulance Departure/Arrival -->
              <template v-if="props.serviceId === 3 && isAmbulanceField(field.name)">
                <div class="input-with-loader">
                  <input 
                    v-model="answers[`text:${field.id}`]" 
                    class="input" 
                    type="text" 
                    :placeholder="tx('Chercher un lieu…', 'البحث عن مكان…')"
                    @input="(e: any) => fetchPlaces(e.target.value, field.id)"
                    @focus="(e: any) => fetchPlaces(e.target.value, field.id)"
                    @blur="closeAutocomplete"
                  />
                  <div v-if="isSearchingPlaces && activeSearchField === `text:${field.id}`" class="mini-loader"></div>
                </div>
                <div v-if="placeSuggestions.length > 0 && activeSearchField === `text:${field.id}`" class="autocomplete-results">
                  <div 
                    v-for="place in placeSuggestions" 
                    :key="place.properties.osm_id" 
                    class="result-item"
                    @mousedown.prevent="selectPlace(place, field.id)"
                  >
                    <div class="place-name">{{ place.properties.name }}</div>
                    <div class="place-details">
                      {{ place.properties.street ? place.properties.street + ', ' : '' }}
                      {{ place.properties.city || place.properties.state || '' }}
                    </div>
                  </div>
                </div>
              </template>
              <template v-else>
                <input v-model="answers[`text:${field.id}`]" class="input" type="text" :placeholder="tx('Votre réponse…', 'إجابتك…')" />
              </template>
            </div>
          </template>

        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">{{ tx('Annuler', 'إلغاء') }}</button>
          <button class="btn-primary" @click="saveModal">{{ tx('Enregistrer', 'حفظ') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
@import "../assets/ServiceSoinsPage.css";
</style>
