<script setup lang="ts">
import { useLanguage } from '../composables/useLanguage';
import Footer from '../components/Footer.vue';

const { t } = useLanguage();
const emit = defineEmits(['navigate']);

const faqs = [
  { q: 'help_q1', a: 'help_a1' },
  { q: 'help_q2', a: 'help_a2' },
  { q: 'help_q3', a: 'help_a3' },
];
</script>

<template>
  <div class="help-page">
    <div class="help-hero">
      <div class="container">
        <h1 class="hero-title">{{ t.help_title }}</h1>
        <p class="hero-subtitle">{{ t.help_subtitle }}</p>
      </div>
    </div>

    <div class="help-content container">
      <section class="faq-section">
        <h2 class="section-title">{{ t.help_faq_title }}</h2>
        <div class="faq-grid">
          <div v-for="(faq, index) in faqs" :key="index" class="faq-card">
            <div class="faq-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <div class="faq-text">
              <h3 class="faq-question">{{ (t as any)[faq.q] }}</h3>
              <p class="faq-answer">{{ (t as any)[faq.a] }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="contact-section">
        <div class="contact-card">
          <div class="contact-info">
            <h2 class="contact-title">{{ t.help_contact_title }}</h2>
            <p class="contact-subtitle">{{ t.help_contact_subtitle }}</p>
            <div class="contact-details">
              <a :href="'tel:+21621918926'" class="contact-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <span>{{ t.help_contact_phone }}</span>
              </a>
              <a :href="'mailto:' + t.help_contact_email.split(': ')[1]" class="contact-item">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <span>{{ t.help_contact_email }}</span>
              </a>
            </div>
          </div>
          <a :href="'mailto:' + t.help_contact_email.split(': ')[1]" class="btn-chat" style="text-decoration: none;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {{ t.help_contact_chat }}
          </a>
        </div>
      </section>
    </div>
    <Footer @navigate="(view: string, sId?: number, snId?: number) => emit('navigate', view, sId, snId)" />
  </div>
</template>

<style scoped>
.help-page {
  padding-top: 70px; /* Navbar height */
  min-height: 100vh;
  background-color: #f8fafc;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.help-hero {
  background: linear-gradient(135deg, #2b69ad 0%, #1d4d82 100%);
  color: white;
  padding: 6rem 0;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.help-hero::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 56c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-2-17c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zm34.414 50.828c.78.781 2.047.781 2.828 0 .782-.781.782-2.047 0-2.828-.78-.781-2.047-.781-2.828 0-.782.781-.782 2.047 0 2.828zm4.243-70.71c.78.781 2.047.781 2.828 0 .782-.781.782-2.047 0-2.828-.78-.781-2.047-.781-2.828 0-.782.781-.782 2.047 0 2.828zm-42.427 42.427c.78.781 2.047.781 2.828 0 .782-.781.782-2.047 0-2.828-.78-.781-2.047-.781-2.828 0-.782.781-.782 2.047 0 2.828zm2.829-42.427c.78.781 2.047.781 2.828 0 .782-.781.782-2.047 0-2.828-.78-.781-2.047-.781-2.828 0-.782.781-.782 2.047 0 2.828z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E");
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.hero-subtitle {
  font-size: 1.25rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.help-content {
  margin-top: -4rem;
  padding-bottom: 6rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2rem;
  text-align: center;
}

.faq-section {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  margin-bottom: 3rem;
}

.faq-grid {
  display: grid;
  gap: 2rem;
}

.faq-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 1.5rem;
  padding: 2rem 1.5rem;
  border-radius: 16px;
  transition: all 0.3s ease;
  border: 1px solid #f1f5f9;
}

.faq-card:hover {
  background: #f8fafc;
  transform: translateY(-2px);
  border-color: #e2e8f0;
}

.faq-icon {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  color: #2b69ad;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.faq-question {
  font-size: 1.15rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.75rem;
}

.faq-answer {
  color: #64748b;
  line-height: 1.6;
  max-width: 800px;
  margin: 0 auto;
}

.contact-section {
  margin-top: 4rem;
}

.contact-card {
  background: white;
  border-radius: 24px;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.contact-info {
  flex: 1;
}

.contact-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.contact-subtitle {
  color: #64748b;
  margin-bottom: 2rem;
}

.contact-details {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.25rem;
}

.contact-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #1e293b;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}

.contact-item:hover {
  opacity: 0.8;
}

.contact-item svg {
  color: #2b69ad;
}

.btn-chat {
  background: #2b69ad;
  color: white;
  padding: 1rem 2.5rem;
  border-radius: 14px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(43, 105, 173, 0.2);
}

.btn-chat:hover {
  background: #1d4d82;
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(43, 105, 173, 0.3);
}

/* RTL Support */
.lang-ar .help-page {
  direction: rtl;
}

.lang-ar .hero-title,
.lang-ar .section-title,
.lang-ar .faq-question,
.lang-ar .contact-title {
  font-family: 'Tajawal', sans-serif;
}

@media (max-width: 992px) {
  .hero-title {
    font-size: 2.25rem;
  }
  
  .faq-card {
    flex-direction: column !important;
    align-items: center !important;
    text-align: center !important;
    padding: 1.5rem 1rem !important;
    gap: 1rem !important;
  }

  .faq-icon {
    margin: 0 auto;
  }

  .faq-text {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
  }

  .faq-question, .faq-answer {
    text-align: center !important;
  }
}
</style>
