<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useLanguage } from '../composables/useLanguage';

const emit = defineEmits(['navigate']);
const { t, currentLang, setLang } = useLanguage();

const isMenuOpen = ref(false);
const isScrolled = ref(false);
const showLangMenu = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const handleNavigate = (page: string) => {
  emit('navigate', page);
  isMenuOpen.value = false;
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
  <nav :class="['navbar', { 'scrolled': isScrolled, 'menu-open': isMenuOpen }]">
    <div class="navbar-container">
      <!-- Logo at Left -->
      <div class="navbar-brand" @click="handleNavigate('landing')">
        <img src="../assets/LOGO H.png" alt="daricare logo" class="brand-logo" />
      </div>

      <!-- Menu in Middle (Desktop) -->
      <div class="navbar-menu" :class="{ 'is-open': isMenuOpen }">
        <a href="#" class="menu-link" @click.prevent="handleNavigate('landing')">{{ t.nav_patient }}</a>
        <a href="#" class="menu-link" @click.prevent="handleNavigate('login')">{{ t.nav_idel }}</a>
        <a href="#" class="menu-link" @click.prevent="handleNavigate('help')">{{ t.nav_aide }}</a>
        <a href="#" class="menu-link" @click.prevent="handleNavigate('about')">{{ t.nav_about }}</a>
        
        <!-- Mobile-only CTA -->
        <div class="mobile-cta">
          <button class="btn-cta-mobile" @click="handleNavigate('service-selection')">{{ t.nav_cta }}</button>
        </div>
      </div>

      <!-- Right Actions -->
      <div class="navbar-actions">
        <!-- Language Switcher -->
        <div class="lang-switcher" @click.stop>
          <button class="btn-lang" @click="toggleLangMenu" :title="t.nav_lang_label">
            <!-- Globe Icon -->
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <span class="lang-badge">{{ currentLang === 'fr' ? 'FR' : 'AR' }}</span>
          </button>

          <!-- Dropdown -->
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

        <button class="btn-cta" @click="handleNavigate('service-selection')">
          {{ t.nav_cta }}
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </button>
      </div>

      <!-- Hamburger Menu Toggle -->
      <button class="hamburger" @click="toggleMenu" :class="{ 'is-active': isMenuOpen }" aria-label="Menu">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>
    </div>
    
    <!-- Dark overlay for mobile menu -->
    <Transition name="fade">
      <div class="menu-overlay" v-if="isMenuOpen" @click="toggleMenu"></div>
    </Transition>
  </nav>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

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
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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

.navbar-brand:hover .brand-logo {
  transform: scale(1.05);
  filter: drop-shadow(0 0 8px rgba(43, 105, 173, 0.2));
}

.brand-logo {
  height: 42px;
  width: auto;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.navbar.scrolled .brand-logo {
  height: 34px;
}

.navbar-menu {
  display: flex;
  gap: 2.5rem;
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

/* ── Language Switcher ── */
.lang-switcher {
  position: relative;
}

.btn-lang {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(255, 255, 255, 0.25);
  border: 1.5px solid rgba(255, 255, 255, 0.5);
  color: #1e293b;
  padding: 0.5rem 0.75rem;
  border-radius: 99px;
  cursor: pointer;
  font-family: 'Outfit', sans-serif;
  font-size: 0.8rem;
  font-weight: 700;
  transition: all 0.25s ease;
  backdrop-filter: blur(8px);
}

.btn-lang:hover {
  background: rgba(255, 255, 255, 0.45);
  border-color: rgba(43, 105, 173, 0.4);
  color: var(--primary-color);
}

.navbar.scrolled .btn-lang {
  background: rgba(43, 105, 173, 0.08);
  border-color: rgba(43, 105, 173, 0.2);
}

.lang-badge {
  letter-spacing: 0.05em;
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
  z-index: 200;
}


.lang-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  font-family: 'Outfit', sans-serif;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
}


.lang-item:hover {
  background: #f1f5f9;
}

.lang-item.active {
  color: var(--primary-color);
  background: #eff6ff;
}

.lang-item svg {
  margin-left: auto;
  color: var(--primary-color);
  flex-shrink: 0;
}


/* Dropdown transition */
.dropdown-enter-active { animation: dropIn 0.18s ease-out; }
.dropdown-leave-active { animation: dropOut 0.15s ease-in; }

@keyframes dropIn {
  from { opacity: 0; transform: translateY(-6px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes dropOut {
  from { opacity: 1; transform: translateY(0) scale(1); }
  to   { opacity: 0; transform: translateY(-4px) scale(0.97); }
}

.btn-login {
  background: none;
  border: none;
  color: #1e293b;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: color 0.2s;
  font-family: 'Outfit', sans-serif;
}

.btn-login:hover {
  color: var(--primary-color);
}

.btn-cta {
  background: var(--primary-color);
  color: white;
  padding: 0.8rem 1.75rem;
  border-radius: 14px;
  font-weight: 700;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(43, 105, 173, 0.2);
  font-family: 'Outfit', sans-serif;
}

.btn-cta:hover {
  background: #1d4d82;
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(29, 77, 130, 0.35), 0 0 15px rgba(43, 105, 173, 0.2);
}

.btn-cta svg {
  transition: transform 0.3s ease;
}

.btn-cta:hover svg {
  transform: translateX(4px);
}


.hamburger {
  display: none;
  flex-direction: column;
  justify-content: center;
  gap: 6px;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.mobile-cta {
  display: none;
}

.bar {
  width: 100%;
  height: 2.5px;
  background-color: #1e293b;
  border-radius: 4px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Scroll context colors */
.navbar:not(.scrolled):not(.menu-open) .menu-link,
.navbar:not(.scrolled):not(.menu-open) .btn-login {
  color: #1e293b;
}

/* Responsive */
@media (max-width: 992px) {
  .hamburger {
    display: flex;
  }

  .navbar-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    width: 100%;
    height: auto;
    background: white;
    flex-direction: column;
    padding: 2rem;
    gap: 1.5rem;
    transform: translateY(-20px);
    opacity: 0;
    visibility: hidden;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
    z-index: 1000;
    align-items: center;
    border-top: 1px solid #f1f5f9;
  }

  .navbar-menu.is-open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .navbar-actions {
    display: none;
  }

  .mobile-cta {
    display: block;
    width: 100%;
    margin-top: 1rem;
    padding: 0;
  }

  .btn-cta-mobile {
    width: 100%;
    background: var(--primary-color);
    color: white;
    padding: 1rem;
    border-radius: 12px;
    border: none;
    font-weight: 700;
    font-size: 1rem;
  }

  .hamburger.is-active .bar:nth-child(1) {
    transform: translateY(8.5px) rotate(45deg);
  }

  .hamburger.is-active .bar:nth-child(2) {
    opacity: 0;
  }

  .hamburger.is-active .bar:nth-child(3) {
    transform: translateY(-8.5px) rotate(-45deg);
  }

  .menu-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.2);
    backdrop-filter: blur(4px);
    z-index: 999;
  }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 480px) {
  .navbar-container {
    padding: 0 1.25rem;
  }
  
  .brand-logo {
    height: 38px;
  }
}
</style>
