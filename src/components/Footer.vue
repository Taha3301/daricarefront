<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useLanguage } from '../composables/useLanguage';
import { getApiUrl } from '../config/api';

const { t, isAr } = useLanguage();
const services = ref<any[]>([]);

const fetchServices = async () => {
  try {
    const response = await fetch(getApiUrl('/services/only'));
    if (response.ok) {
      services.value = await response.json();
    }
  } catch (err) {
    console.error('Footer: Failed to fetch services:', err);
  }
};

const emit = defineEmits(['navigate']);

const handleNavigate = (page: string, serviceId?: number) => {
  emit('navigate', page, serviceId);
};

onMounted(fetchServices);
</script>

<template>
  <footer class="footer">
    <div class="container footer-content">
      <div class="footer-brand">
        <img src="../assets/logowhite.png" alt="DariCare Logo" class="footer-logo-img" />
        <p class="footer-desc">
          {{ t.footer_desc }}
        </p>
        <div class="social-links">
          <a href="https://www.instagram.com/proof.agency1/" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
        </div>
      </div>

      <div class="footer-links">
        <div class="link-group">
          <h3>{{ t.footer_nav_title }}</h3>
          <ul>
            <li><a href="#" @click.prevent="handleNavigate('landing')">{{ t.footer_nav_home }}</a></li>
            <li><a href="#" @click.prevent="handleNavigate('service-selection')">{{ t.footer_nav_services }}</a></li>
            <li><a href="#" @click.prevent="handleNavigate('about')">{{ t.footer_nav_about }}</a></li>
            <li><a href="#" @click.prevent="handleNavigate('help')">{{ t.footer_nav_contact }}</a></li>
          </ul>
        </div>
        <div class="link-group">
          <h3>{{ t.footer_services_title }}</h3>
          <ul>
            <li v-for="svc in services.slice(0, 6)" :key="svc.id">
              <a href="#" @click.prevent="handleNavigate('service-soins', svc.id)">
                {{ isAr && svc.name_ar ? svc.name_ar : svc.name }}
              </a>
            </li>
          </ul>
        </div>
        <div class="link-group">
          <h3>{{ t.footer_contact_title }}</h3>
          <ul class="contact-info">
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              <span>+216 21 918 926</span>
            </li>
            <li>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              <span>contact@proofagency.tn</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; {{ new Date().getFullYear() }} DariCare. {{ t.footer_rights }}</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: var(--secondary-color, #69aa62);
  color: #f8fafc;
  padding: 4rem 2rem 1.5rem;
  margin-top: auto;
}

.footer-content {
  display: grid;
  grid-template-columns: 1.5fr 2fr;
  gap: 4rem;
  max-width: 1200px;
  margin: 0 auto;
  margin-bottom: 3rem;
}

.footer-brand {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.footer-logo-img {
  height: 48px;
  width: auto;
  object-fit: contain;
}

.footer-desc {
  color: #f8fafc;
  line-height: 1.6;
  max-width: 400px;
}

.social-links {
  display: flex;
  gap: 1rem;
}

.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
  color: #ffffff;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-3px);
}

.footer-links {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 3rem;
}

.link-group h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #ffffff;
  white-space: nowrap;
}

.link-group ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.link-group a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  transition: color 0.3s ease;
  white-space: nowrap;
}

.link-group a:hover {
  color: #ffffff;
}

.contact-info li {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: rgba(255, 255, 255, 0.9);
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 900px) {
  .footer-content {
    grid-template-columns: 1fr;
    gap: 3rem;
  }
}

@media (max-width: 600px) {
  .footer {
    padding: 3rem 1.5rem 2rem;
  }
  .footer-content {
    display: flex;
    flex-direction: column;
    gap: 2.5rem;
    width: 100%;
    max-width: 100%;
  }
  .footer-brand {
    align-items: flex-start;
    text-align: left;
    width: 100%;
  }
  .footer-desc {
    width: 100%;
    max-width: 100%;
    white-space: normal;
    word-break: break-word;
  }
  .footer-links {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    width: 100%;
  }
  .link-group h3 {
    white-space: normal;
  }
  .link-group a, 
  .contact-info li {
    white-space: normal;
    word-break: break-word;
  }
  .footer-bottom {
    margin-top: 1rem;
    padding-top: 1.5rem;
  }
}
</style>
