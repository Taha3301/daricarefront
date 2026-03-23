<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';

const emit = defineEmits(['navigate']);
const { t, currentLang, setLang } = useLanguage();

const isScrolled = ref(false);
const showLangMenu = ref(false);

const handleNavigate = (page: string) => {
  emit('navigate', page);
};

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

const toggleLangMenu = () => {
  showLangMenu.value = !showLangMenu.value;
};

const selectLang = (lang: 'fr' | 'ar') => {
  setLang(lang);
  showLangMenu.value = false;
};

const closeLangMenu = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.lang-switcher')) {
    showLangMenu.value = false;
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
  document.addEventListener('click', closeLangMenu);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('click', closeLangMenu);
});
</script>

<template>
  <nav :class="['navbar', { 'scrolled': isScrolled }]">
    <div class="navbar-container">
      <!-- Logo at Left -->
      <div class="navbar-brand" @click="handleNavigate('landing')">
        <img src="../assets/LOGO H.png" alt="daricare logo" class="brand-logo" />
      </div>

      <!-- Desktop Menu (Hidden on Mobile) -->
      <div class="navbar-menu-desktop">
        <a href="#" class="menu-link" @click.prevent="handleNavigate('landing')">{{ t.nav_patient }}</a>
        <a href="#" class="menu-link" @click.prevent="handleNavigate('login')">{{ t.nav_idel }}</a>
        <a href="#" class="menu-link" @click.prevent="handleNavigate('help')">{{ t.nav_aide }}</a>
        <a href="#" class="menu-link" @click.prevent="handleNavigate('about')">{{ t.nav_about }}</a>
        <a href="#" class="menu-link" @click.prevent="handleNavigate('avis')">{{ t.nav_avis }}</a>
      </div>

      <!-- Right Actions (Desktop Only) -->
      <div class="navbar-actions">
        <button class="btn-cta" @click="handleNavigate('service-selection')">
          {{ t.nav_cta }}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>

      <!-- Language Switcher - Both views -->
      <div class="navbar-controls">
        <div class="lang-switcher" @click.stop>
          <button class="btn-lang" @click="toggleLangMenu" :title="t.nav_lang_label">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span class="lang-badge">{{ currentLang === 'fr' ? 'FR' : 'AR' }}</span>
          </button>

          <Transition name="dropdown">
            <div v-if="showLangMenu" class="lang-dropdown">
              <button
                class="lang-item"
                :class="{ active: currentLang === 'fr' }"
                @click="selectLang('fr')"
              >
                <span>🇫🇷</span>
                <span>Français</span>
                <svg v-if="currentLang === 'fr'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
              <button
                class="lang-item"
                :class="{ active: currentLang === 'ar' }"
                @click="selectLang('ar')"
              >
                <span>🇸🇦</span>
                <span>العربية</span>
                <svg v-if="currentLang === 'ar'" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </nav>

  <!-- Bottom Navigation (Mobile Only) -->
  <nav class="bottom-nav">
    <button class="bottom-nav-item" @click="handleNavigate('help')">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>{{ t.nav_aide }}</span>
    </button>

    <button class="bottom-nav-item" @click="handleNavigate('about')">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <span>{{ t.nav_about.split(' ')[0] }}</span>
    </button>

    <button class="bottom-nav-item main-item" @click="handleNavigate('landing')">
      <div class="home-icon-bg">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
    </button>

    <button class="bottom-nav-item" @click="handleNavigate('avis')">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
      <span>{{ t.nav_avis }}</span>
    </button>

    <button class="bottom-nav-item" @click="handleNavigate('login')">
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
      </svg>
      <span>{{ t.nav_idel.split(' ')[0] }}</span>
    </button>
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  display: flex;
  align-items: center;
  z-index: 1000;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Outfit', sans-serif;
  background: transparent;
}

.navbar.scrolled {
  height: 64px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.navbar-container {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
}

.navbar-brand {
  display: flex;
  align-items: center;
  cursor: pointer;
  z-index: 1001;
}

.brand-logo {
  height: 42px;
  width: auto;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.navbar.scrolled .brand-logo {
  height: 34px;
}

.navbar-menu-desktop {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.menu-link {
  text-decoration: none;
  color: #1e293b;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  position: relative;
  padding: 0.5rem 0;
}

.menu-link::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: var(--primary-color);
  transition: width 0.3s ease;
  border-radius: 2px;
}

.menu-link:hover {
  color: var(--primary-color);
}

.menu-link:hover::after {
  width: 100%;
}

.navbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.btn-cta {
  background: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(43, 105, 173, 0.2);
}

.btn-cta:hover {
  background: #1d4d82;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(29, 77, 130, 0.3);
}

.navbar-controls {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  z-index: 1001;
}

/* ── Language Switcher ── */
.lang-switcher { position: relative; }
.btn-lang {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.1);
  color: #1e293b;
  padding: 0.5rem 0.8rem;
  border-radius: 99px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  backdrop-filter: blur(8px);
}

.lang-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  box-shadow: 0 16px 40px rgba(0,0,0,0.12);
  min-width: 155px;
}

.lang-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  font-family: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
}

.lang-item:hover { background: #f1f5f9; }
.lang-item.active { color: var(--primary-color); background: #eff6ff; }

/* ── Bottom Navigation ── */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 75px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  display: none;
  justify-content: space-around;
  align-items: center;
  padding: 0.5rem 0.5rem 1.75rem; /* extra bottom padding for home indicator */
  z-index: 1000;
  box-shadow: 0 -5px 25px rgba(0, 0, 0, 0.08);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.bottom-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: #64748b;
  background: none;
  border: none;
  cursor: pointer;
  flex: 1;
  transition: all 0.2s ease;
}

.bottom-nav-item span {
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: capitalize;
}

.bottom-nav-item:active { transform: scale(0.9); }

.bottom-nav-item.main-item {
  position: relative;
  top: -15px;
}

.home-icon-bg {
  width: 58px;
  height: 58px;
  background: var(--primary-color);
  color: white;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px rgba(43, 105, 173, 0.4);
  transform: rotate(45deg);
}

.home-icon-bg svg {
  transform: rotate(-45deg);
}

.active-nav {
  color: var(--primary-color);
}

/* Transitions */
.dropdown-enter-active { animation: dropIn 0.2s ease-out; }
.dropdown-leave-active { animation: dropOut 0.15s ease-in; }
@keyframes dropIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
@keyframes dropOut { from { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-5px); } }

/* Responsive */
@media (max-width: 992px) {
  .navbar-menu-desktop, 
  .navbar-actions .btn-cta {
    display: none;
  }
  
  .navbar-actions {
    display: flex !important;
  }

  .navbar {
    background: transparent !important;
    backdrop-filter: none !important;
    -webkit-backdrop-filter: none !important;
    box-shadow: none !important;
    border-bottom: none !important;
    height: 64px !important; /* Fixed height for mobile to prevent layout thrashing */
    transition: background 0.3s ease, box-shadow 0.3s ease;
  }

  .navbar.scrolled {
    background: white !important;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05) !important;
    border-bottom: 1px solid rgba(0,0,0,0.05) !important;
  }

  .brand-logo { height: 32px !important; }

  .bottom-nav {
    display: flex;
  }

  .navbar-container {
    padding: 0 1.5rem;
  }
}

@media (max-width: 480px) {
  .brand-logo { height: 36px; }
  .bottom-nav { height: 70px; padding-bottom: 1.25rem; }
  .home-icon-bg { width: 52px; height: 52px; }
}
</style>
