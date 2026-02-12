<script setup lang="ts">
import { ref } from 'vue';
const emit = defineEmits(['navigate']);

const isMenuOpen = ref(false);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const handleNavigate = (page: string) => {
  emit('navigate', page);
  isMenuOpen.value = false;
};
</script>

<template>
  <nav class="navbar">
    <div class="navbar-container">
      <!-- Logo at Left -->
      <div class="navbar-brand" @click="handleNavigate('landing')" style="cursor: pointer;">
        <img src="../assets/LOGO H.png" alt="daricare logo" class="brand-logo" />
      </div>

      <!-- Hamburger Menu Toggle -->
      <button class="hamburger" @click="toggleMenu" :class="{ 'is-active': isMenuOpen }">
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      </button>

      <!-- Menu in Middle (Desktop) & Overlay (Mobile) -->
      <div class="navbar-menu" :class="{ 'is-open': isMenuOpen }">
        <!-- Close button for mobile -->
        <button class="menu-close" @click="toggleMenu">×</button>
        
        <a href="#" class="menu-link" @click.prevent="handleNavigate('landing')">Patient</a>
        <a href="#" class="menu-link" @click.prevent="handleNavigate('login')">IDEL</a>
        <a href="#" class="menu-link" @click.prevent="handleNavigate('landing')">Aide</a>
        
        <!-- CTA inside mobile menu -->
        <div class="mobile-cta">
          <button class="btn-cta" @click="handleNavigate('service-selection')">Prendre rendez-vous</button>
        </div>
      </div>

      <!-- CTA at Right (Desktop only) -->
      <div class="navbar-actions">
        <button class="btn-cta" @click="handleNavigate('service-selection')">Prendre rendez-vous</button>
      </div>
    </div>
    
    <!-- Dark overlay for mobile menu -->
    <div class="menu-overlay" v-if="isMenuOpen" @click="toggleMenu"></div>
  </nav>
</template>

<style scoped>
.navbar {
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  position: sticky;
  top: 0;
  z-index: 1000;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.navbar-container {
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1.5rem;
  height: 70px;
}

.navbar-brand {
  display: flex;
  align-items: center;
  z-index: 1001;
}

.brand-logo {
  height: 50px;
  width: auto;
  transition: height 0.3s ease;
}

.navbar-menu {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.menu-link {
  text-decoration: none;
  color: #4a5568;
  font-weight: 500;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.menu-link:hover {
  color: var(--primary-color);
}

.navbar-actions {
  display: flex;
  align-items: center;
}

.btn-cta {
  background: var(--primary-color);
  color: white;
  padding: 0.75rem 1.25rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 12px rgba(214, 48, 49, 0.15);
  white-space: nowrap;
}

.btn-cta:hover {
  background: #1d4d82;
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(29, 77, 130, 0.25);
}

.hamburger {
  display: none;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 24px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 1001;
}

.bar {
  width: 30px;
  height: 3px;
  background-color: #333;
  border-radius: 10px;
  transition: all 0.3s linear;
  position: relative;
  transform-origin: 1px;
}

.mobile-cta {
  display: none;
  width: 100%;
  margin-top: 1rem;
}

.menu-close {
  display: none;
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: none;
  border: none;
  font-size: 2.5rem;
  color: #4a5568;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

/* responsive */
@media (max-width: 992px) {
  .hamburger {
    display: flex;
  }

  .navbar-menu {
    position: absolute;
    top: 70px;
    left: 1rem;
    right: 1rem;
    width: auto;
    height: auto;
    background: white;
    flex-direction: column;
    padding: 1.25rem;
    gap: 0.75rem;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s;
    box-shadow: 0 15px 35px rgba(0,0,0,0.12);
    z-index: 1000;
    align-items: flex-start;
    justify-content: flex-start;
    transform: translateY(-120%);
    visibility: hidden;
    border: 1px solid rgba(0, 0, 0, 0.05);
    border-radius: 20px;
    overflow-y: auto;
    max-height: 60vh;
  }

  .menu-close {
    display: none; /* No longer needed as dropdown is less claustrophobic */
  }

  .navbar-menu.is-open {
    transform: translateY(0);
    visibility: visible;
  }

  .navbar-actions {
    display: none;
  }

  .mobile-cta {
    display: block;
  }

  .mobile-cta .btn-cta {
    width: 100%;
  }

  .menu-link {
    font-size: 0.95rem;
    width: 100%;
    padding: 0.25rem 0;
  }

  .hamburger.is-active .bar:nth-child(1) {
    transform: rotate(45deg);
  }

  .hamburger.is-active .bar:nth-child(2) {
    opacity: 0;
  }

  .hamburger.is-active .bar:nth-child(3) {
    transform: rotate(-45deg);
  }

  .menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,0.3);
    backdrop-filter: blur(4px);
    z-index: 999;
  }
}

@media (max-width: 480px) {
  .brand-logo {
    height: 30px;
  }
  
  .navbar-container {
    padding: 0.5rem 1rem;
    height: 60px;
  }

  .navbar-menu {
    top: 65px;
    left: 0.75rem;
    right: 0.75rem;
  }
}
</style>
