<script setup lang="ts">
import { ref } from 'vue';

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
  description: ''
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

const submitForm = () => {
  console.log('Service request submitted:', formData.value);
  emit('submit', formData.value);
  emit('navigate', 'landing');
};
</script>

<template>
  <div class="page-wrapper">
    <div class="form-container">
      <header class="page-header">
        <button class="btn-back" @click="emit('navigate', 'landing')">
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

        <div class="form-action">
          <button type="submit" class="submit-button">Envoyer la demande</button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

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
  letter-spacing: -2px;
  line-height: 1.1;
}

.page-subtitle {
  font-size: 1.25rem;
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

@media (max-width: 768px) {
  .page-wrapper {
    padding: 2rem 1.5rem;
  }
  .form-container {
    margin-left: 0;
  }
  .form-row {
    grid-template-columns: 1fr;
  }
  .page-title {
    font-size: 2.25rem;
  }
  .submit-button {
    width: 100%;
  }
}
</style>
