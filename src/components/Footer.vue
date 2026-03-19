<script setup lang="ts">
import { useLanguage } from '../composables/useLanguage';
const { t } = useLanguage();
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
          <a href="#" class="social-link" aria-label="Facebook">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
          </a>
          <a href="#" class="social-link" aria-label="Instagram">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
          <a href="#" class="social-link" aria-label="Twitter">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
          </a>
        </div>
      </div>

      <div class="footer-links">
        <div class="link-group">
          <h3>{{ t.footer_nav_title }}</h3>
          <ul>
            <li><a href="#">{{ t.footer_nav_home }}</a></li>
            <li><a href="#">{{ t.footer_nav_services }}</a></li>
            <li><a href="#">{{ t.footer_nav_about }}</a></li>
            <li><a href="#">{{ t.footer_nav_contact }}</a></li>
          </ul>
        </div>
        <div class="link-group">
          <h3>{{ t.footer_services_title }}</h3>
          <ul>
            <li><a href="#">{{ t.footer_svc1 }}</a></li>
            <li><a href="#">{{ t.footer_svc2 }}</a></li>
            <li><a href="#">{{ t.footer_svc3 }}</a></li>
            <li><a href="#">{{ t.footer_svc4 }}</a></li>
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
  background: #0f172a;
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
  color: #94a3b8;
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
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  transition: all 0.3s ease;
}

.social-link:hover {
  background: #3b82f6;
  transform: translateY(-3px);
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2rem;
}

.link-group h3 {
  font-family: 'Outfit', sans-serif;
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: #fff;
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
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.3s ease;
}

.link-group a:hover {
  color: #3b82f6;
}

.contact-info li {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  color: #94a3b8;
}

.footer-bottom {
  text-align: center;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: #64748b;
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
  .footer-links {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
}
</style>
