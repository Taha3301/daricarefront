<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useLanguage } from '../composables/useLanguage';

const { t, isAr } = useLanguage();
const isVisible = ref(false);

onMounted(() => {
  setTimeout(() => {
    isVisible.value = true;
  }, 100);
});
</script>

<template>
  <div class="about-page" :class="{ 'is-ar': isAr, 'is-visible': isVisible }">
    <!-- Hero Section -->
    <section class="about-hero">
      <div class="hero-glow"></div>
      <div class="container">
        <div class="hero-content">
          <span class="hero-tag">{{ t.about_hero_tag }}</span>
          <h1 class="hero-title">{{ t.about_hero_title }}</h1>
          <p class="hero-subtitle">{{ t.about_hero_subtitle }}</p>
        </div>
      </div>
    </section>

    <!-- Mission & Vision -->
    <section class="mission-vision">
      <div class="container">
        <div class="mv-grid">
          <div class="mv-card mission">
            <div class="card-icon">🎯</div>
            <h2>{{ t.about_mission_title }}</h2>
            <p>{{ t.about_mission_desc }}</p>
          </div>
          <div class="mv-card vision">
            <div class="card-icon">👁️</div>
            <h2>{{ t.about_vision_title }}</h2>
            <p>{{ t.about_vision_desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How it works section -->
    <section class="how-it-works">
      <div class="container">
        <h2 class="section-title">{{ t.about_how_title }}</h2>
        <div class="steps-grid">
          <div class="step-card">
            <div class="step-number">01</div>
            <h3>{{ t.about_how_step1_title }}</h3>
            <p>{{ t.about_how_step1_desc }}</p>
          </div>
          <div class="step-card">
            <div class="step-number">02</div>
            <h3>{{ t.about_how_step2_title }}</h3>
            <p>{{ t.about_how_step2_desc }}</p>
          </div>
          <div class="step-card">
            <div class="step-number">03</div>
            <h3>{{ t.about_how_step3_title }}</h3>
            <p>{{ t.about_how_step3_desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Values section -->
    <section class="values">
      <div class="container">
        <h2 class="section-title values-title">{{ t.about_values_title }}</h2>
        <div class="values-grid">
          <div class="value-card">
            <div class="value-icon">⭐</div>
            <h3>{{ t.about_val1_title }}</h3>
            <p>{{ t.about_val1_desc }}</p>
          </div>
          <div class="value-card">
            <div class="value-icon">📍</div>
            <h3>{{ t.about_val2_title }}</h3>
            <p>{{ t.about_val2_desc }}</p>
          </div>
          <div class="value-card">
            <div class="value-icon">❤️</div>
            <h3>{{ t.about_val3_title }}</h3>
            <p>{{ t.about_val3_desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Professional background graphic -->
    <div class="bg-decoration">
        <div class="blob blob-1"></div>
        <div class="blob blob-2"></div>
    </div>
  </div>
</template>

<style scoped>
.about-page {
  padding-top: 100px;
  min-height: 100vh;
  background: #f8fafc;
  color: #1e293b;
  overflow-x: hidden;
  position: relative;
  font-family: 'Outfit', sans-serif;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  position: relative;
  z-index: 2;
}

/* Hero Section */
.about-hero {
  padding: 6rem 0;
  text-align: center;
  position: relative;
}

.hero-tag {
  display: inline-block;
  padding: 0.5rem 1.25rem;
  background: rgba(43, 105, 173, 0.1);
  color: #2b69ad;
  border-radius: 99px;
  font-weight: 700;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 1.5rem;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.is-visible .hero-tag {
  opacity: 1;
  transform: translateY(0);
}

.hero-title {
  font-size: clamp(2.5rem, 8vw, 4.5rem);
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  letter-spacing: -0.03em;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.2s;
}

.is-visible .hero-title {
  opacity: 1;
  transform: translateY(0);
}

.hero-subtitle {
  font-size: 1.25rem;
  color: #64748b;
  max-width: 700px;
  margin: 0 auto;
  line-height: 1.6;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.4s;
}

.is-visible .hero-subtitle {
  opacity: 1;
  transform: translateY(0);
}

.hero-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60%;
  height: 60%;
  background: radial-gradient(circle, rgba(43, 105, 173, 0.08) 0%, transparent 70%);
  filter: blur(60px);
  pointer-events: none;
}

/* Mission & Vision */
.mission-vision {
  padding: 4rem 0;
}

.mv-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.mv-card {
  background: white;
  padding: 3rem;
  border-radius: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 0;
  transform: translateY(40px);
}

.is-visible .mv-card.mission { transition-delay: 0.6s; opacity: 1; transform: translateY(0); }
.is-visible .mv-card.vision { transition-delay: 0.8s; opacity: 1; transform: translateY(0); }

.mv-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 60px rgba(43, 105, 173, 0.1);
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
}

.mv-card h2 {
  font-size: 1.75rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.mv-card p {
  color: #64748b;
  line-height: 1.6;
  font-size: 1.1rem;
}

/* How it works */
.how-it-works {
  padding: 6rem 0;
  background: white;
  border-radius: 60px;
  margin: 4rem 2rem;
}

.steps-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem;
  margin-top: 4rem;
}

.step-card {
  position: relative;
  padding: 3rem 2rem 2rem;
  background: rgba(248, 250, 252, 0.5);
  border-radius: 24px;
  border: 1px solid rgba(43, 105, 173, 0.05);
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.is-visible .step-card:nth-child(1) { transition-delay: 1.0s; opacity: 1; transform: translateY(0); }
.is-visible .step-card:nth-child(2) { transition-delay: 1.3s; opacity: 1; transform: translateY(0); }
.is-visible .step-card:nth-child(3) { transition-delay: 1.6s; opacity: 1; transform: translateY(0); }

.step-number {
  font-size: 3.5rem;
  font-weight: 900;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.15;
  position: absolute;
  top: 0.5rem;
  left: 1.5rem;
  line-height: 1;
  transition: all 0.4s ease;
}

.step-card:hover .step-number {
    opacity: 0.4;
    transform: scale(1.1) translateY(-5px);
}

.is-ar .step-number {
  left: auto;
  right: 1.5rem;
}

.step-card h3 {
  font-size: 1.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
}

.step-card p {
  color: #64748b;
  line-height: 1.6;
}

/* Values */
.values {
  padding: 6rem 0;
}

.section-title {
  text-align: center;
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 4rem;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

.is-visible .section-title {
  opacity: 1;
  transform: translateY(0);
}

.is-visible .how-it-works .section-title {
    transition-delay: 0.8s;
}

.is-visible .values-title {
    transition-delay: 1.6s;
}

.values-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.value-card {
  text-align: center;
  padding: 2.5rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.is-visible .value-card:nth-child(1) { transition-delay: 1.8s; opacity: 1; transform: scale(1); }
.is-visible .value-card:nth-child(2) { transition-delay: 2.0s; opacity: 1; transform: scale(1); }
.is-visible .value-card:nth-child(3) { transition-delay: 2.2s; opacity: 1; transform: scale(1); }

.value-card:hover {
  background: white;
  transform: scale(1.05);
}

.value-icon {
  font-size: 2rem;
  margin-bottom: 1.25rem;
}

.value-card h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}

.value-card p {
  color: #64748b;
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Background decoration */
.bg-decoration {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 1;
}

.blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;
}

.blob-1 {
    top: -10%;
    right: -10%;
    width: 600px;
    height: 600px;
    background: radial-gradient(circle, rgba(43, 105, 173, 0.15) 0%, transparent 70%);
}

.blob-2 {
    bottom: -10%;
    left: -10%;
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(105, 170, 98, 0.1) 0%, transparent 70%);
}

/* Arabic RTL support */
.is-ar {
    direction: rtl;
    text-align: right;
}

.is-ar .hero-tag,
.is-ar .hero-subtitle,
.is-ar .section-title {
    text-align: center;
    margin-left: auto;
    margin-right: auto;
}

/* Responsive */
@media (max-width: 992px) {
  .mv-grid {
    grid-template-columns: 1fr;
  }
  .values-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .values-grid {
    grid-template-columns: 1fr;
  }
  .about-hero {
      padding: 4rem 0;
  }
}
</style>
