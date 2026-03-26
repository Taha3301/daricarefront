<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { getApiUrl } from '../config/api';
import Footer from '../components/Footer.vue';
import bgImage from '../assets/bg1.jpg';

const emit = defineEmits(['navigate']);
const { t, isAr } = useLanguage();
const tx = (fr: string, ar: string) => isAr.value ? ar : fr;

const rating = ref(5);
const comment = ref('');
const title = ref('');
const phoneNumber = ref('');
const wouldRecommend = ref(true);
const isSubmitting = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const avisList = ref<any[]>([]);
const isLoadingAvis = ref(false);

const fetchApprovedAvis = async () => {
  isLoadingAvis.value = true;
  try {
    const res = await fetch(getApiUrl('/avis?onlyApproved=true'));
    if (res.ok) {
      avisList.value = await res.json();
    }
  } catch (err) {
    console.error('Error fetching approved avis:', err);
  } finally {
    isLoadingAvis.value = false;
  }
};

onMounted(fetchApprovedAvis);

const setRating = (val: number) => {
  rating.value = val;
};

const submitAvis = async () => {
  isSubmitting.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    // Get patientId from URL if present, otherwise omit it (as per user: "forget about the id 39")
    const urlParams = new URLSearchParams(window.location.search);
    const urlPatientId = urlParams.get('patientId');

    const payload: any = {
      rating: rating.value,
      comment: comment.value,
      title: title.value,
      wouldRecommend: wouldRecommend.value,
      phoneNumber: phoneNumber.value
    };

    if (urlPatientId) {
      payload.patientId = parseInt(urlPatientId);
    }

    const response = await fetch(getApiUrl('/avis'), {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      successMessage.value = t.value.avis_success;
      // Reset form
      rating.value = 5;
      comment.value = '';
      title.value = '';
      phoneNumber.value = '';
      wouldRecommend.value = true;
    } else {
      const errorData = await response.json();
      const backendMsg = errorData.message?.toLowerCase() || '';
      
      // Map common errors to user-friendly messages and hide specific patient names/ids
      if (response.status === 404 || response.status === 400 || backendMsg.includes('not found') || backendMsg.includes('request')) {
        errorMessage.value = t.value.avis_error_no_request;
      } else if (response.status === 409 || backendMsg.includes('déjà') || backendMsg.includes('already')) {
        // Show generic error or generic "already exists" if translated, for now generic error to "not show this err" as requested
        errorMessage.value = t.value.avis_error_generic;
      } else {
        errorMessage.value = errorData.message || t.value.avis_error_generic;
      }
    }
  } catch (error) {
    console.error('Error submitting avis:', error);
    errorMessage.value = t.value.avis_error_generic;
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="avis-page" :dir="isAr ? 'rtl' : 'ltr'" :style="{ backgroundImage: `url(${bgImage})` }">
    <div class="avis-container">
      <header class="avis-header">
        <button class="btn-back" @click="emit('navigate', 'landing')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <h1 class="title">{{ t.avis_title }}</h1>
        <p class="subtitle">{{ t.avis_subtitle }}</p>
      </header>

      <form @submit.prevent="submitAvis" class="avis-form">
        <div v-if="successMessage" class="alert alert-success">
          {{ successMessage }}
        </div>
        <div v-if="errorMessage" class="alert alert-error">
          {{ errorMessage }}
        </div>

        <!-- Rating Section -->
        <div class="form-group center">
          <label class="form-label">{{ t.avis_label_rating }}</label>
          <div class="stars-container">
            <button 
              v-for="i in 5" 
              :key="i"
              type="button"
              class="star-btn"
              :class="{ 'active': i <= rating }"
              @click="setRating(i)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="36" height="36">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Title field -->
        <div class="form-group">
          <label class="form-label">{{ t.avis_label_title }}</label>
          <input 
            v-model="title"
            type="text" 
            class="form-input" 
            :placeholder="t.avis_placeholder_title"
            required
          />
        </div>

        <!-- Phone field -->
        <div class="form-group">
          <label class="form-label">{{ t.avis_label_phone }}</label>
          <input 
            v-model="phoneNumber"
            type="tel" 
            class="form-input" 
            :placeholder="t.avis_placeholder_phone"
            required
          />
        </div>

        <!-- Comment field -->
        <div class="form-group">
          <label class="form-label">{{ t.avis_label_comment }}</label>
          <textarea 
            v-model="comment"
            class="form-textarea" 
            :placeholder="t.avis_placeholder_comment"
            rows="4"
            required
          ></textarea>
        </div>

        <!-- Recommend Checkbox -->
        <div class="form-group inline">
          <label class="form-label">{{ t.avis_label_recommend }}</label>
          <div class="toggle-group">
            <button 
              type="button" 
              class="toggle-btn" 
              :class="{ active: wouldRecommend }"
              @click="wouldRecommend = true"
            >
              {{ t.avis_recommend_yes }}
            </button>
            <button 
              type="button" 
              class="toggle-btn" 
              :class="{ active: !wouldRecommend }"
              @click="wouldRecommend = false"
            >
              {{ t.avis_recommend_no }}
            </button>
          </div>
        </div>

        <button type="submit" class="btn-submit" :disabled="isSubmitting">
          <span v-if="isSubmitting">{{ t.avis_loading }}</span>
          <span v-else>{{ t.avis_btn_submit }}</span>
          <svg v-if="!isSubmitting" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>

      <!-- Reviews Display Section -->
      <section v-if="avisList.length > 0" class="avis-list-section">
        <h2 class="section-title">{{ tx('Ce que disent nos patients', 'ما يقوله مرضانا') }}</h2>
        <div class="avis-grid">
          <div v-for="avis in avisList" :key="avis.id" class="avis-card">
            <div class="avis-card-header">
              <div class="patient-info">
                <div class="patient-avatar">
                  {{ avis.patient?.firstname?.charAt(0).toUpperCase() || 'P' }}
                </div>
                <div class="patient-details">
                  <div class="patient-name">{{ avis.patient?.firstname }} {{ avis.patient?.lastname }}</div>
                  <div class="avis-date">{{ new Date(avis.createdAt).toLocaleDateString(isAr ? 'ar-TN' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) }}</div>
                </div>
              </div>
              <div class="avis-rating">
                <svg v-for="i in 5" :key="i" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" :fill="i <= avis.rating ? '#fbbf24' : '#e2e8f0'" width="16" height="16">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>
            </div>
            <h3 class="avis-card-title">{{ avis.title }}</h3>
            <p class="avis-card-comment">{{ avis.comment }}</p>
            <div v-if="avis.wouldRecommend" class="recommend-badge">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>{{ tx('Recommande DariCare', 'ينصح بـ داري كير') }}</span>
            </div>
          </div>
        </div>
      </section>
    </div>
    <Footer @navigate="(view: string, sId?: number, snId?: number) => emit('navigate', view, sId, snId)" />
  </div>
</template>

<style scoped>
.avis-page {
  padding: 100px 20px 60px;
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;
  position: relative;
  overflow-x: hidden;
}

/* Add an overlay to ensure readability */
.avis-page::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.4);
  pointer-events: none;
  z-index: 0;
}

.avis-container {
  max-width: 600px;
  margin: 0 auto;
}

.avis-header {
  text-align: center;
  margin-bottom: 3rem;
  position: relative;
}

.btn-back {
  position: absolute;
  top: 0;
  left: 0;
  background: white;
  border: 1px solid #e2e8f0;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: #64748b;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
}

.btn-back:hover {
  background: #f8fafc;
  color: var(--primary-color);
  transform: translateX(-4px);
}

[dir="rtl"] .btn-back {
  left: auto;
  right: 0;
}
[dir="rtl"] .btn-back:hover {
  transform: translateX(4px);
}
[dir="rtl"] .btn-back svg {
  transform: rotate(180deg);
}

.title {
  font-size: 2.5rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 0.75rem;
  letter-spacing: -0.025em;
}

.subtitle {
  color: #64748b;
  font-size: 1.1rem;
}

.avis-form {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
  padding: 2.5rem;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.1);
}

.alert {
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  font-weight: 500;
  font-size: 0.95rem;
}

.alert-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.form-group {
  margin-bottom: 2rem;
}

.form-group.center {
  text-align: center;
}

.form-label {
  display: block;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.75rem;
  font-size: 1rem;
}

.stars-container {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.star-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: #e2e8f0;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  padding: 0;
}

.star-btn:hover {
  transform: scale(1.2);
}

.star-btn.active {
  color: #fbbf24;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  font-family: inherit;
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus, .form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  background: white;
  box-shadow: 0 0 0 4px rgba(43, 105, 173, 0.1);
}

.toggle-group {
  display: flex;
  background: #f1f5f9;
  padding: 0.25rem;
  border-radius: 10px;
  margin-top: 0.5rem;
}

.toggle-btn {
  flex: 1;
  padding: 0.6rem 1rem;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: #64748b;
}

.toggle-btn.active {
  background: white;
  color: var(--primary-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.btn-submit {
  width: 100%;
  background: var(--primary-color);
  color: white;
  padding: 1rem;
  border-radius: 14px;
  font-weight: 700;
  font-size: 1.1rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.3s;
  margin-top: 1rem;
}

.btn-submit:hover:not(:disabled) {
  background: #1d4d82;
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(43, 105, 173, 0.4);
}

.btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .title {
    font-size: 2rem;
  }
  .avis-form {
    padding: 1.5rem;
  }
}

/* Reviews List Styles */
.avis-list-section {
  margin-top: 5rem;
  padding-bottom: 4rem;
}

.section-title {
  text-align: center;
  font-size: 2rem;
  font-weight: 800;
  color: #1e293b;
  margin-bottom: 3rem;
  letter-spacing: -0.01em;
}

.avis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.avis-card {
  background: white;
  padding: 1.75rem;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  display: flex;
  flex-direction: column;
}

.avis-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.avis-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
}

.patient-info {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.patient-avatar {
  width: 42px;
  height: 42px;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
}

.patient-name {
  font-weight: 700;
  color: #1e293b;
  font-size: 1rem;
}

.avis-date {
  font-size: 0.8rem;
  color: #94a3b8;
  margin-top: 0.125rem;
}

.avis-rating {
  display: flex;
  gap: 2px;
  margin-top: 4px;
}

.avis-card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.avis-card-comment {
  color: #475569;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.recommend-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #f0fdf4;
  color: #166534;
  padding: 0.375rem 0.75rem;
  border-radius: 99px;
  font-size: 0.8rem;
  font-weight: 600;
  border: 1px solid #dcfce7;
}

@media (max-width: 640px) {
  .avis-grid {
    grid-template-columns: 1fr;
  }
  .section-title {
    font-size: 1.5rem;
  }
}
</style>
