<script setup lang="ts">
import { useLanguage } from '../composables/useLanguage';

const { isAr } = useLanguage();
const emit = defineEmits(['navigate']);

const tx = (fr: string, ar: string) => isAr.value ? ar : fr;
</script>

<template>
  <div class="legal-page" :dir="isAr ? 'rtl' : 'ltr'">
    <div class="container">
      <header class="legal-header">
        <button class="btn-back" @click="emit('navigate', 'landing')">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
          </svg>
          {{ tx('Retour', 'العودة') }}
        </button>
        <h1 class="page-title">{{ tx('Conditions Générales d’Utilisation (CGU) & Politique de Confidentialité', 'شروط الاستخدام العامة وسياسة الخصوصية') }}</h1>
      </header>

      <div class="legal-content">
        <section class="legal-section">
          <h2>{{ tx('Conditions Générales d’Utilisation (CGU)', 'شروط الاستخدام العامة (CGU)') }}</h2>
          <p class="intro">{{ tx('En utilisant ce site web, vous acceptez les conditions suivantes :', 'باستخدام هذا الموقع، فإنك توافق على الشروط التالية:') }}</p>

          <div class="article">
            <h3>{{ tx('Utilisation du site', 'استخدام الموقع') }}</h3>
            <p>{{ tx('Vous ne pouvez utiliser ce site que pour des usages légaux. Il est interdit de perturber le fonctionnement du site ou d’interférer avec les autres utilisateurs.', 'لا يجوز لك استخدام هذا الموقع إلا للأغراض القانونية. يُحظر تعطيل عمل الموقع أو التدخل مع مستخدمين آخرين.') }}</p>
          </div>

          <div class="article">
            <h3>{{ tx('Informations fournies par l’utilisateur', 'المعلومات المقدمة من قبل المستخدم') }}</h3>
            <p>{{ tx('Toute information personnelle que vous fournissez (nom, email, numéro de téléphone, etc.) doit être exacte. Vous consentez à la collecte et à l’utilisation de ces informations conformément à notre Politique de Confidentialité.', 'يجب أن تكون أي معلومات شخصية تقدمها (الاسم، البريد الإلكتروني، رقم الهاتف، إلخ) دقيقة. أنت توافق على جمع واستخدام هذه المعلومات وفقًا لسياسة الخصوصية الخاصة بنا.') }}</p>
          </div>

          <div class="article">
            <h3>{{ tx('Propriété intellectuelle', 'الملكية الفكرية') }}</h3>
            <p>{{ tx('Tout le contenu, images, logos et designs de ce site sont la propriété du propriétaire du site. Aucune partie de ce contenu ne peut être copiée ou réutilisée sans autorisation.', 'جميع المحتويات والصور والشعارات والتصاميم الخاصة بهذا الموقع هي ملك لصاحب الموقع. لا يجوز نسخ أو إعادة استخدام أي جزء من هذا المحتوى دون إذن.') }}</p>
          </div>

          <div class="article">
            <h3>{{ tx('Limitation de responsabilité', 'تحديد المسؤولية') }}</h3>
            <p>{{ tx('Nous ne sommes pas responsables des dommages, pertes ou erreurs résultant de l’utilisation de ce site web.', 'نحن لسنا مسؤولين عن أي أضرار أو خسائر أو أخطاء ناتجة عن استخدام هذا الموقع.') }}</p>
          </div>

          <div class="article">
            <h3>{{ tx('Modification des conditions', 'تعديل الشروط') }}</h3>
            <p>{{ tx('Ces conditions peuvent être mises à jour à tout moment. En continuant à utiliser le site, vous acceptez les conditions mises à jour.', 'يمكن تحديث هذه الشروط في أي وقت. من خلال الاستمرار في استخدام الموقع، فإنك توافق على الشروط المحدثة.') }}</p>
          </div>
        </section>

        <section class="legal-section">
          <h2>{{ tx('Politique de Confidentialité', 'سياسة الخصوصية') }}</h2>

          <div class="article">
            <h3>{{ tx('Informations collectées', 'المعلومات التي يتم جمعها') }}</h3>
            <p>{{ tx('Nous pouvons collecter :', 'قد نقوم بجمع:') }}</p>
            <ul>
              <li>{{ tx('Nom, email, numéro de téléphone', 'الاسم، البريد الإلكتروني، رقم الهاتف') }}</li>
              <li>{{ tx('Adresse IP et données de navigation', 'عنوان IP وبيانات التصفح') }}</li>
              <li>{{ tx('Toute information soumise via nos formulaires', 'أي معلومات يتم تقديمها عبر نماذجنا') }}</li>
            </ul>
          </div>

          <div class="article">
            <h3>{{ tx('Utilisation de vos informations', 'استخدام معلوماتك') }}</h3>
            <p>{{ tx('Vos informations peuvent être utilisées pour :', 'يمكن استخدام معلوماتك لـ:') }}</p>
            <ul>
              <li>{{ tx('Fournir les services demandés', 'تقديم الخدمات المطلوبة') }}</li>
              <li>{{ tx('Améliorer le site web', 'تحسين الموقع الإلكتروني') }}</li>
              <li>{{ tx('Envoyer des mises à jour ou des messages promotionnels (uniquement avec votre consentement)', 'إرسال تحديثات أو رسائل ترويجية (فقط بموافقتك)') }}</li>
            </ul>
          </div>

          <div class="article">
            <h3>{{ tx('Protection des données', 'حماية البيانات') }}</h3>
            <p>{{ tx('Nous prenons des mesures raisonnables pour protéger vos données personnelles contre tout accès ou divulgation non autorisé.', 'نحن نتخذ تدابير معقولة لحماية بياناتك الشخصية من الوصول أو الإفصاح غير المصرح به.') }}</p>
          </div>

          <div class="article">
            <h3>{{ tx('Services tiers', 'خدمات الطرف الثالث') }}</h3>
            <p>{{ tx('Certains services (comme l’analytique, les emails ou le paiement en ligne) peuvent collecter des données limitées pour le bon fonctionnement du site.', 'قد تقوم بعض الخدمات (مثل التحليلات أو رسائل البريد الإلكتروني أو الدفع عبر الإنترنت) بجمع بيانات محدودة لضمان حسن سير الموقع.') }}</p>
          </div>

          <div class="article">
            <h3>{{ tx('Cookies', 'ملفات تعريف الارتباط') }}</h3>
            <p>{{ tx('Ce site utilise des cookies pour améliorer l’expérience utilisateur et analyser le trafic. Vous pouvez accepter ou refuser les cookies.', 'يستخدم هذا الموقع ملفات تعريف الارتباط لتحسين تجربة المستخدم وتحليل حركة المرور. يمكنك قبول أو رفض ملفات تعريف الارتباط.') }}</p>
          </div>

          <div class="article">
            <h3>{{ tx('Vos droits', 'حقوقك') }}</h3>
            <p>{{ tx('Vous avez le droit d’accéder à vos données, de les corriger ou de demander leur suppression. Contactez-nous pour exercer ces droits.', 'لديك الحق في الوصول إلى بياناتك أو تصحيحها أو طلب حذفها. اتصل بنا لممارسة هذه الحقوق.') }}</p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
.legal-page {
  padding: 4rem 1rem;
  background: #f8fafc;
  min-height: 100vh;
  color: #1e293b;
  line-height: 1.6;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.legal-header {
  margin-bottom: 3rem;
  border-bottom: 2px solid #e2e8f0;
  padding-bottom: 2rem;
}

.btn-back {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #64748b;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 1.5rem;
  transition: color 0.2s;
}

.btn-back:hover {
  color: #2b69ad;
}

.page-title {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.2;
}

.legal-content {
  background: white;
  padding: 3rem;
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.03);
}

.legal-section {
  margin-bottom: 4rem;
}

.legal-section h2 {
  font-size: 1.75rem;
  font-weight: 800;
  color: #2b69ad;
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
}

.intro {
  font-size: 1.1rem;
  font-weight: 500;
  margin-bottom: 2rem;
  color: #475569;
}

.article {
  margin-bottom: 2rem;
}

.article h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #1e293b;
}

.article ul {
  padding-left: 1.5rem;
  margin-top: 0.5rem;
}

.article li {
  margin-bottom: 0.5rem;
}

[dir="rtl"] .article ul {
  padding-left: 0;
  padding-right: 1.5rem;
}

@media (max-width: 768px) {
  .page-title { font-size: 1.8rem; }
  .legal-content { padding: 1.5rem; }
}
</style>
