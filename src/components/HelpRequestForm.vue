<script setup lang="ts">
import { ref } from 'vue';
import LegalModal from './LegalModal.vue';
import { getApiUrl } from '../config/api';

const props = defineProps<{
  initialService?: string
}>();

const emit = defineEmits(['navigate', 'submit']);

const formData = ref({
  name: '',
  phone: '',
  address: '',
  serviceType: props.initialService || '',
  kineCareType: '',
  urgency: 'medium',
  description: '',
  legalAccepted: false
});

const kineOptions = [
  'Rééducation à la marche / déambulation',
  'Massage et rééducation antidouleur',
  'Rééducation membre',
  'Renforcement musculaire',
  'Mobilisation membre et récupération',
  'Kinésithérapie respiratoire',
  'Drainage lymphatique',
  'Traitement par ondes de choc',
  'Rééducation périnéo-sphécinterienne',
  'Autres soins'
];

const isSubmitting = ref(false);
const showLegalModal = ref(false);

const onLegalAccepted = () => {
  formData.value.legalAccepted = true;
  showLegalModal.value = false;
  submitForm();
};

const handleFinalSubmit = () => {
  if (!formData.value.legalAccepted) {
    showLegalModal.value = true;
  } else {
    submitForm();
  }
};

const submitForm = async () => {
  if (isSubmitting.value) return;

  if (!formData.value.legalAccepted) {
    alert('Veuillez accepter les conditions générales et la politique de confidentialité pour continuer.');
    return;
  }
  
  isSubmitting.value = true;
  console.log('Service request submitted:', formData.value);
  console.log('API URL:', getApiUrl('api/requests'));

  try {
    const response = await fetch(getApiUrl('api/requests'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData.value),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Erreur lors de l\'envoi de la demande.');
    }

    const result = await response.json();
    console.log('Submission successful:', result);
    alert('Votre demande a été envoyée avec succès ! Un professionnel vous contactera bientôt.');
    emit('submit', formData.value);
    emit('navigate', 'landing');
  } catch (error: any) {
    console.error('Error submitting form:', error);
    alert(`Échec de l'envoi de la demande: ${error.message || 'Veuillez réessayer.'}`);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="page-wrapper">
    <div class="form-container">
      <header class="page-header">
        <button class="btn-back" @click="$emit('navigate', 'landing')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          Retour
        </button>
        <h1 class="page-title">Demander de l'aide médicale</h1>
        <p class="page-subtitle">Remplissez le formulaire ci-dessous pour contacter un professionnel dans votre région.</p>
      </header>

      <form @submit.prevent="submitForm" class="booking-form">
        <div class="form-row">
          <div class="input-group">
            <label for="name">Nom complet</label>
            <input v-model="formData.name" type="text" id="name" placeholder="Jean Dupont" class="styled-input" required />
          </div>
          <div class="input-group">
            <label for="phone">Numéro de téléphone</label>
            <input v-model="formData.phone" type="tel" id="phone" placeholder="+33 6 00 00 00 00" class="styled-input" required />
          </div>
        </div>

        <div class="input-group">
          <label for="address">Adresse du service</label>
          <input v-model="formData.address" type="text" id="address" placeholder="123 Rue de Médicale, Paris" class="styled-input" required />
        </div>

        <div class="form-row">
          <div class="input-group">
            <label for="service">Type de service</label>
            <select v-model="formData.serviceType" id="service" class="styled-input" required>
              <option value="" disabled>Sélectionnez un service</option>
              <option value="post-partum">Soins post-partum</option>
              <option value="wound">Pansement</option>
              <option value="medication">Administration de médicaments</option>
              <option value="nursing">Soins infirmiers généraux</option>
              <option value="kine">Séance de Kinésithérapie</option>
            </select>
          </div>
          <div class="input-group">
            <label for="urgency">Niveau d'urgence</label>
            <select v-model="formData.urgency" id="urgency" class="styled-input">
              <option value="low">Faible (Routine)</option>
              <option value="medium">Moyen (Aujourd'hui)</option>
              <option value="high">Élevé (Urgent)</option>
            </select>
          </div>
        </div>

        <div v-if="formData.serviceType === 'kine'" class="input-group fade-in">
          <label for="kineCare">De quel(s) soin(s) avez-vous besoin ?</label>
          <select v-model="formData.kineCareType" id="kineCare" class="styled-input" required>
            <option value="" disabled>Sélectionnez un soin</option>
            <option v-for="option in kineOptions" :key="option" :value="option">
              {{ option }}
            </option>
          </select>
        </div>

        <div class="input-group">
          <label for="description">Détails supplémentaires</label>
          <textarea v-model="formData.description" id="description" rows="4" placeholder="Décrivez vos besoins..." class="styled-input"></textarea>
        </div>

        <!-- Legal Consent Checkbox (Visual hint for the modal) -->
        <div class="legal-consent-container" @click="showLegalModal = true" style="margin-bottom: 2rem; cursor: pointer; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 12px; background: #f8fafc;">
          <div class="checkbox-row" style="display: flex; align-items: flex-start; gap: 1rem;">
            <div class="check-box" :class="{ 'checked': formData.legalAccepted }" style="width: 22px; height: 22px; border: 2px solid #2b69ad; border-radius: 6px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: white; transition: all 0.2s;">
              <svg v-if="formData.legalAccepted" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2b69ad" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <div class="consent-text" style="font-size: 0.95rem; color: #475569; font-weight: 600; line-height: 1.4;">
              J’ai lu et j’accepte les Conditions Générales d’Utilisation et la Politique de Confidentialité.
            </div>
          </div>
          <p v-if="!formData.legalAccepted" class="legal-hint" style="color: #ef4444; font-size: 0.8rem; margin-top: 0.5rem; margin-left: 2.3rem;">
            Cliquer ici pour lire et accepter (requis)
          </p>
        </div>

        <div class="form-action">
          <button type="button" @click="handleFinalSubmit" class="submit-button" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="spinner-mini"></span>
            <span>{{ isSubmitting ? 'Envoi...' : 'Envoyer la demande' }}</span>
          </button>
        </div>

        <!-- Legal Modal -->
        <LegalModal 
          :show="showLegalModal" 
          @accept="onLegalAccepted" 
          @close="showLegalModal = false"
          @navigate="(v: string) => $emit('navigate', v)"
        />
      </form>
    </div>
  </div>
</template>

<style scoped>
.page-wrapper {
  font-family: 'Outfit', sans-serif;
  min-height: 100vh;
  width: 100%;
  background: white;
  padding: 4rem 2rem;
  display: flex;
  justify-content: flex-start;
}

.form-container {
  max-width: 800px;
  width: 100%;
  margin-left: 2rem;
}

.page-header {
  margin-bottom: 4rem;
}

.btn-back {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #94a3b8;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 2rem;
  transition: color 0.2s ease;
  padding: 0;
}

.btn-back:hover {
  color: #2b69ad;
}

.page-title {
  font-size: 3rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 1rem;
  letter-spacing: -1.5px;
  line-height: 1.2;
  word-break: break-word;
}

.page-subtitle {
  font-size: 1.15rem;
  color: #64748b;
  max-width: 600px;
  line-height: 1.6;
}

.booking-form {
  display: flex;
  flex-direction: column;
  gap: 2.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  width: 100%;
}

.input-group label {
  font-size: 1rem;
  font-weight: 700;
  color: #334155;
}

.styled-input {
  padding: 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 1.1rem;
  outline: none;
  transition: all 0.2s ease;
  font-family: inherit;
  background: #f8fafc;
  width: 100%;
}

.styled-input:focus {
  border-color: #2b69ad;
  background: white;
  box-shadow: 0 0 0 5px rgba(43, 105, 173, 0.08);
}

textarea.styled-input {
  resize: vertical;
  min-height: 120px;
}

.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.form-action {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-start;
}

.submit-button {
  background: #2b69ad;
  color: white;
  padding: 1.25rem 4rem;
  border: none;
  border-radius: 12px;
  font-size: 1.25rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 20px rgba(43, 105, 173, 0.15);
}

.submit-button:hover {
  background: #1d4d82;
  transform: translateY(-3px);
  box-shadow: 0 20px 40px rgba(43, 105, 173, 0.2);
}

.submit-button:disabled {
  background: #94a3b8;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.spinner-mini {
  width: 20px;
  height: 20px;
  border: 3px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 10px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .page-wrapper {
    padding: 6rem 1.25rem 3rem; /* Extra top padding if covered by navbar */
    justify-content: center;
  }
  .form-container {
    margin-left: 0;
    max-width: 100%;
  }
  .page-header {
    margin-bottom: 2.5rem;
  }
  .form-row {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  .page-title {
    font-size: 2.15rem;
    letter-spacing: -1px;
    line-height: 1.2;
  }
  .page-subtitle {
    font-size: 1rem;
    line-height: 1.5;
  }
  .booking-form {
    gap: 1.5rem;
  }
  .styled-input {
    padding: 1rem;
    font-size: 1rem;
  }
  .submit-button {
    width: 100%;
    padding: 1.1rem;
    font-size: 1.15rem;
  }
}
</style>
