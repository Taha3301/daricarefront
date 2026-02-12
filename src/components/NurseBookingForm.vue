<template>
  <div class="page-wrapper">
    <div class="form-layout">
      <!-- Form Content (Left/Center) -->
      <div class="form-content-area">
        <header class="page-header">
          <button class="btn-back" @click="prevStep">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
            </svg>
            Revenir à l'étape précédente
          </button>
        </header>

        <div class="step-container">
          <!-- Step 1: Soins Selection -->
          <div v-if="currentStep === 1" class="step-pane">
            <h2 class="step-title">{{ step1Title }}</h2>
            
            <div class="question-group">
              <div class="radio-group-modern">
                <label v-for="soin in currentSoins" :key="soin" class="modern-checkbox" :class="{ active: formData.selectedSoins.includes(soin) }">
                  <input type="checkbox" v-model="formData.selectedSoins" :value="soin" class="hidden-input">
                  <span class="label-text">{{ soin }}</span>
                  <span class="plus-icon" v-if="!formData.selectedSoins.includes(soin)">+</span>
                  <span class="check-icon" v-else>✓</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Step 2: Ordonnance -->
          <div v-if="currentStep === 2" class="step-pane">
            <h2 class="step-title">Avez-vous une ordonnance ?</h2>
            <div class="radio-group">
              <label class="radio-item" :class="{ active: formData.hasOrdonnance === 'oui' }">
                <input type="radio" v-model="formData.hasOrdonnance" value="oui" class="hidden-input">
                Oui
              </label>
              <label class="radio-item" :class="{ active: formData.hasOrdonnance === 'non' }">
                <input type="radio" v-model="formData.hasOrdonnance" value="non" class="hidden-input">
                Non
              </label>
            </div>
          </div>

          <!-- Step 3: Location & Time -->
          <div v-if="currentStep === 3" class="step-pane">
            <h2 class="step-title">Où et quand souhaitez-vous faire vos soins ?</h2>
            <div class="form-group">
              <label>Adresse des soins</label>
              <input type="text" v-model="formData.address" placeholder="Ex: 123 Rue de Médical, Paris" class="styled-input">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Date</label>
                <input type="date" v-model="formData.date" class="styled-input">
              </div>
              <div class="form-group">
                <label>Heure préférée</label>
                <input type="time" v-model="formData.time" class="styled-input">
              </div>
            </div>
          </div>

          <!-- Step 4: Patient -->
          <div v-if="currentStep === 4" class="step-pane">
            <h2 class="step-title">Qui est le patient ?</h2>
            <div class="form-group">
              <label>Nom complet</label>
              <input type="text" v-model="formData.patientName" placeholder="Jean Dupont" class="styled-input">
            </div>
            <div class="form-group">
              <label>Numéro de téléphone</label>
              <input type="tel" v-model="formData.patientPhone" placeholder="+33 6 ..." class="styled-input">
            </div>
            <div class="form-group">
              <label>Adresse e-mail (optionnel)</label>
              <input type="email" v-model="formData.patientEmail" placeholder="jean.dupont@example.com" class="styled-input">
            </div>
          </div>

          <!-- Step 5: Summary -->
          <div v-if="currentStep === 5" class="step-pane">
            <h2 class="step-title">Récapitulatif de votre demande</h2>
            <div class="summary-list">
              <div class="summary-card-simple">
                <div class="summary-item">
                  <strong>Soins demandés:</strong>
                  <div class="summary-val">
                    <span v-if="formData.selectedSoins.length === 0" class="no-selection">Aucun soin sélectionné</span>
                    <span v-else>{{ formData.selectedSoins.join(', ') }}</span>
                  </div>
                </div>
                <div class="summary-item">
                  <strong>Ordonnance:</strong> 
                  <div class="summary-val">{{ formData.hasOrdonnance === 'oui' ? 'Oui' : 'Non' }}</div>
                </div>
                <div class="summary-item">
                  <strong>Lieu:</strong>
                  <div class="summary-val">{{ formData.address }}</div>
                </div>
                <div class="summary-item">
                  <strong>Date & Heure:</strong>
                  <div class="summary-val">{{ formData.date }} à {{ formData.time }}</div>
                </div>
                <div class="summary-item">
                  <strong>Patient:</strong>
                  <div class="summary-val">{{ formData.patientName }} ({{ formData.patientPhone }})</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="form-footer">
          <button class="btn-next" @click="nextStep">
            {{ currentStep === totalSteps ? 'Confirmer la demande' : 'Continuer' }}
          </button>
        </div>
      </div>

      <!-- Stepper Side (Right) -->
      <aside class="stepper-sidebar">
        <div class="stepper-track">
          <div v-for="step in steps" :key="step.id" class="step-node" 
               :class="{ 
                 'completed': currentStep > step.id, 
                 'active': currentStep === step.id,
                 'pending': currentStep < step.id 
               }">
            <div class="node-icon">
              <span v-if="currentStep > step.id">✓</span>
              <span v-else>{{ step.id }}</span>
            </div>
            <div class="node-label">{{ step.title }}</div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  service: {
    type: String,
    default: 'infirmiere'
  }
});

const emit = defineEmits(['navigate', 'submit']);

const currentStep = ref(1);
const totalSteps = 5;

const steps = [
  { id: 1, title: 'Choix des soins' },
  { id: 2, title: 'Ordonnance' },
  { id: 3, title: 'Lieu et date' },
  { id: 4, title: 'Patient' },
  { id: 5, title: 'Récapitulatif' }
];

const nurseSoins = [
  "Pansement",
  "Injection",
  "Prise de sang",
  "Ablation points de suture / agrafes",
  "Aide à la toilette / habillage",
  "Distribution et surveillance prise de médicaments",
  "Surveillance des constantes (tension, pouls, température...)",
  "Surveillance glycémie / diabète",
  "Soins de sonde / stomie",
  "Perfusion",
  "Chimiothérapie",
  "Instillation de collyre",
  "Dépistage Covid-19",
  "Vaccination Covid-19",
  "Suivi Patient Covid-19 (Suite diagnostic positif)",
  "Autres soins"
];

const kineSoins = [
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

const sageFemmeSoins = [
  'Surveillance post-accouchement',
  'Surveillance médicale de la grossesse',
  'Rééducation périnéo-sphinctérienne',
  'Préparation à la naissance et à la parentalité',
  'Examen de fin de grossesse',
  'Accouchement',
  'Suivi gynécologique hors grossesse',
  'Autres soins'
];

const currentSoins = computed(() => {
  if (props.service === 'kine') return kineSoins;
  if (props.service === 'sage-femme') return sageFemmeSoins;
  return nurseSoins;
});

const defaultSoin = computed(() => currentSoins.value[0]);

const step1Title = computed(() => 'De quel(s) soin(s) avez-vous besoin ?');

const formData = ref({
  selectedSoins: [],
  hasOrdonnance: 'oui',
  address: '',
  date: '',
  time: '',
  patientName: '',
  patientPhone: '',
  patientEmail: ''
});

const progressWidth = computed(() => `${(currentStep.value / totalSteps) * 100}%`);

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  } else {
    const finalData = {
      ...formData.value,
      serviceType: props.service
    };
    emit('submit', finalData);
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  } else {
    emit('navigate', 'landing');
  }
};
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');

.page-wrapper {
  font-family: 'Outfit', sans-serif;
  min-height: 100vh;
  width: 100%;
  background: white;
  display: flex;
}

.form-layout {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  width: 100%;
}

.form-content-area {
  padding: 4rem 4rem 4rem 6rem;
}

.stepper-sidebar {
  background: #f8fafc;
  border-left: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  padding: 4rem;
}

.stepper-track {
  display: flex;
  flex-direction: column;
  gap: 3rem;
  position: relative;
}

.stepper-track::before {
  content: '';
  position: absolute;
  left: 20px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e2e8f0;
  z-index: 0;
}

.step-node {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  z-index: 1;
}

.node-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  border: 2px solid #e2e8f0;
  color: #94a3b8;
}

.node-label {
  font-weight: 700;
  font-size: 1.1rem;
  color: #94a3b8;
  transition: all 0.3s ease;
}

/* State Styling for Stepper */
.step-node.completed .node-icon {
  background: #69aa62;
  border-color: #69aa62;
  color: white;
}
.step-node.completed .node-label {
  color: #1e293b;
}

.step-node.active .node-icon {
  background: white;
  border-color: #2b69ad;
  color: #2b69ad;
  box-shadow: 0 0 0 4px rgba(43, 105, 173, 0.1);
  transform: scale(1.1);
}
.step-node.active .node-label {
  color: #2b69ad;
  font-weight: 800;
}

.page-header {
  margin-bottom: 3rem;
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
  transition: color 0.2s ease;
  padding: 0;
}

.btn-back:hover {
  color: #2b69ad;
}

.step-title {
  font-size: 2.75rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 3.5rem;
  letter-spacing: -2px;
  line-height: 1.1;
}

.default-soin .soin-pill {
  display: inline-flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem 2.5rem;
  background: #f0f7ff;
  border: 2px solid #2b69ad;
  border-radius: 20px;
  color: #2b69ad;
  font-weight: 800;
  font-size: 1.2rem;
}

.mt-large { margin-top: 4rem; }

.question-label {
  font-size: 1.35rem;
  font-weight: 700;
  color: #334155;
  margin-bottom: 2rem;
}

.radio-group-modern {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.modern-checkbox {
  background: #f8fafc;
  padding: 1.25rem 1.5rem;
  border-radius: 16px;
  border: 2px solid transparent;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modern-checkbox:hover {
  border-color: #2b69ad;
  background: white;
}

.modern-checkbox.active {
  background: #2b69ad;
  color: white;
  border-color: #2b69ad;
}

.label-text { font-weight: 700; }

.radio-group {
  display: flex;
  gap: 2rem;
}

.radio-item {
  flex: 1;
  background: #f8fafc;
  padding: 2rem;
  border-radius: 20px;
  text-align: center;
  font-weight: 800;
  font-size: 1.25rem;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.radio-item.active {
  background: #2b69ad;
  color: white;
  border-color: #2b69ad;
}

.form-group { margin-bottom: 2.5rem; }
.form-group label {
  display: block;
  font-weight: 700;
  color: #475569;
  margin-bottom: 1rem;
}

.styled-input {
  width: 100%;
  padding: 1.25rem;
  border: 2px solid #e2e8f0;
  border-radius: 14px;
  font-size: 1.1rem;
  font-family: inherit;
  background: #f8fafc;
  outline: none;
  transition: all 0.2s ease;
}

.styled-input:focus {
  border-color: #2b69ad;
  background: white;
  box-shadow: 0 0 0 5px rgba(43, 105, 173, 0.08);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.summary-card-simple {
  background: #f8fafc;
  padding: 3rem;
  border-radius: 30px;
  border: 1px solid #e2e8f0;
}

.summary-item { margin-bottom: 2rem; }
.summary-item strong {
  display: block;
  color: #64748b;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 0.5rem;
}
.summary-val {
  font-size: 1.35rem;
  font-weight: 800;
  color: #1e293b;
}
.no-selection {
  color: #94a3b8;
  font-size: 1.1rem;
  font-weight: 500;
  font-style: italic;
}

.form-footer {
  margin-top: 4rem;
  display: flex;
  justify-content: flex-start;
}

.btn-next {
  background: #2b69ad;
  color: white;
  padding: 1.5rem 5rem;
  border-radius: 20px;
  border: none;
  font-size: 1.25rem;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 10px 30px rgba(43, 105, 173, 0.2);
}

.btn-next:hover {
  background: #1d4d82;
  transform: translateY(-3px);
  box-shadow: 0 20px 50px rgba(43, 105, 173, 0.3);
}

.hidden-input { display: none; }

@media (max-width: 1024px) {
  .form-layout { grid-template-columns: 1fr; }
  .stepper-sidebar { display: none; }
  .form-content-area { padding: 2rem; }
}
</style>
