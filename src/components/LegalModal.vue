<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useLanguage } from '../composables/useLanguage';

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits(['accept', 'close', 'navigate']);
const { isAr } = useLanguage();

const hasReadToBottom = ref(false);
const sentinel = ref<HTMLElement | null>(null);
let observer: IntersectionObserver | null = null;

const setupObserver = () => {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver((entries) => {
    if (entries && entries[0] && entries[0].isIntersecting) {
      hasReadToBottom.value = true;
      if (observer) observer.disconnect();
    }
  }, { threshold: 0.1 }); // Lower threshold is safer for different screen sizes

  if (sentinel.value) {
    observer.observe(sentinel.value);
  }
};

watch(() => props.show, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden';
    nextTick(() => {
      setupObserver();
    });
  } else {
    document.body.style.overflow = '';
  }
});

onMounted(() => {
  if (props.show) {
    document.body.style.overflow = 'hidden';
    setupObserver();
  }
});

onUnmounted(() => {
  if (observer) observer.disconnect();
  document.body.style.overflow = '';
});

const tx = (fr: string, ar: string) => isAr.value ? ar : fr;

const handleAccept = () => {
  if (hasReadToBottom.value) {
    emit('accept');
  }
};
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="show" class="modal-overlay" @click.self="emit('close')">
      <div class="modal-container" :dir="isAr ? 'rtl' : 'ltr'">
        <header class="modal-header">
          <h2>{{ tx('Conditions & Confidentialité', 'الشروط والخصوصية') }}</h2>
          <button class="close-btn" @click="emit('close')">&times;</button>
        </header>

        <div class="modal-body">
          <div class="legal-scroll-area">
            <div class="legal-content">
              <h3>{{ tx('Conditions Générales d’Utilisation (CGU)', 'شروط الاستخدام العامة (CGU)') }}</h3>
              <p>{{ tx('En utilisant ce site web, vous acceptez les conditions suivantes :', 'باستخدام هذا الموقع، فإنك توافق على الشروط التالية:') }}</p>

              <h4>{{ tx('Utilisation du site', 'استخدام الموقع') }}</h4>
              <p>{{ tx('Vous ne pouvez utiliser ce site que pour des usages légaux. Il est interdit de perturber le fonctionnement du site ou d’interférer avec les autres utilisateurs.', 'لا يجوز لك استخدام هذا الموقع إلا للأغراض القانونية. يُحظر تعطيل عمل الموقع أو التدخل مع مستخدمين آخرين.') }}</p>

              <h4>{{ tx('Informations fournies par l’utilisateur', 'المعلومات المقدمة من قبل المستخدم') }}</h4>
              <p>{{ tx('Toute information personnelle que vous fournissez (nom, email, numéro de téléphone, etc.) doit être exacte. Vous consentez à la collecte et à l’utilisation de ces informations conformément à notre Politique de Confidentialité.', 'يجب أن تكون أي معلومات شخصية تقدمها (الاسم، البريد الإلكتروني، رقم الهاتف، إلخ) دقيقة. أنت توافق على جمع واستخدام هذه المعلومات وفقًا لسياسة الخصوصية الخاصة بنا.') }}</p>

              <h4>{{ tx('Propriété intellectuelle', 'الملكية الفكرية') }}</h4>
              <p>{{ tx('Tout le contenu, images, logos et designs de ce site sont la propriété du propriétaire du site. Aucune partie de ce contenu ne peut être copiée ou réutilisée sans autorisation.', 'جميع المحتويات والصور والشعارات والتصاميم الخاصة بهذا الموقع هي ملك لصاحب الموقع. لا يجوز نسخ أو إعادة استخدام أي جزء من هذا المحتوى دون إذن.') }}</p>

              <h4>{{ tx('Limitation de responsabilité', 'تحديد المسؤولية') }}</h4>
              <p>{{ tx('Nous ne sommes pas responsables des dommages, pertes ou erreurs résultant de l’utilisation de ce site web.', 'نحن لسنا مسؤولين عن أي أضرار أو خسائر أو أخطاء ناتجة عن استخدام هذا الموقع.') }}</p>

              <hr />

              <h3>{{ tx('Politique de Confidentialité', 'سياسة الخصوصية') }}</h3>
              <h4>{{ tx('Informations collectées', 'المعلومات التي يتم جمعها') }}</h4>
              <p>{{ tx('Nous pouvons collecter : Nom, email, numéro de téléphone, Adresse IP et données de navigation.', 'قد نقوم بجمع: الاسم، البريد الإلكتروني، رقم الهاتف، عنوان IP وبيانات التصفح.') }}</p>
              
              <h4>{{ tx('Cookies', 'ملفات تعريف الارتباط') }}</h4>
              <p>{{ tx('Ce site utilise des cookies pour améliorer l’expérience utilisateur et analyser le trafic.', 'يستخدم هذا الموقع ملفات تعريف الارتباط لتحسين تجربة المستخدم وتحليل حركة المرور.') }}</p>

              <h4>{{ tx('Vos droits', 'حقوقك') }}</h4>
              <p>{{ tx('Vous avez le droit d’accéder à vos données, de les corriger ou de demander leur suppression.', 'لديك الحق في الوصول إلى بياناتك أو تصحيحها أو طلب حذفها.') }}</p>

              <div ref="sentinel" class="sentinel"></div>
            </div>
          </div>
        </div>

        <footer class="modal-footer">
          <p v-if="!hasReadToBottom" class="scroll-hint">
            {{ tx('Veuillez faire défiler jusqu\'en bas pour accepter', 'يرجى التمرير إلى الأسفل للموافقة') }}
          </p>
          <button 
            @click="handleAccept" 
            class="accept-btn" 
            :disabled="!hasReadToBottom"
            :class="{ 'active': hasReadToBottom }"
          >
            {{ tx('J\'ai lu et j\'accepte', 'لقد قرأت وأوافق') }}
          </button>
        </footer>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(8px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.modal-container {
  background: white;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  animation: modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95) translateY(20px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h2 {
  font-size: 1.35rem;
  font-weight: 800;
  color: #1e293b;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #94a3b8;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s;
}

.close-btn:hover { color: #ef4444; }

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Ensures child scrolling works in flex */
}

.legal-scroll-area {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  -webkit-overflow-scrolling: touch;
}

.legal-content h3 {
  font-size: 1.1rem;
  font-weight: 800;
  color: #1e293b;
  margin: 1.5rem 0 0.75rem;
}

.legal-content h3:first-child { margin-top: 0; }

.legal-content h4 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #334155;
  margin: 1.25rem 0 0.5rem;
}

.legal-content p {
  color: #475569;
  line-height: 1.6;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.legal-content hr {
  border: 0;
  border-top: 1px solid #f1f5f9;
  margin: 2rem 0;
}

.sentinel { height: 1px; width: 100%; }

.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid #f1f5f9;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  background: #f8fafc;
}

.scroll-hint {
  text-align: center;
  font-size: 0.85rem;
  color: #ef4444;
  font-weight: 600;
  margin: 0;
}

.accept-btn {
  width: 100%;
  padding: 1rem;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1.1rem;
  cursor: not-allowed;
  background: #cbd5e1;
  color: #64748b;
  transition: all 0.3s;
}

.accept-btn.active {
  background: #2b69ad;
  color: white;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(43, 105, 173, 0.3);
}

.accept-btn.active:hover {
  background: #1d4d82;
  transform: translateY(-2px);
}

.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 0.3s; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }

/* Scrollbar styling */
.legal-scroll-area::-webkit-scrollbar { width: 6px; }
.legal-scroll-area::-webkit-scrollbar-track { background: #f1f5f9; }
.legal-scroll-area::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>
