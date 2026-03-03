import { ref, computed, watch } from 'vue';

export type Lang = 'fr' | 'ar';

const STORAGE_KEY = 'daricare_lang';

// Global reactive state (singleton across components)
const currentLang = ref<Lang>((localStorage.getItem(STORAGE_KEY) as Lang) || 'fr');

watch(currentLang, (lang) => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.setAttribute('lang', lang);
});

// Apply lang immediately on load
document.documentElement.setAttribute('lang', currentLang.value);
document.documentElement.setAttribute('dir', 'ltr'); // Always LTR

const translations = {
    fr: {
        // Navbar
        nav_patient: 'Patient',
        nav_idel: 'IDEL',
        nav_aide: 'Aide',
        nav_cta: 'Prendre rendez-vous',
        nav_lang_label: 'Langue',

        // Language Popup
        popup_title: 'Choisissez votre langue',
        popup_subtitle: 'Vous pourrez la changer à tout moment dans la barre de navigation.',
        popup_fr: 'Français',
        popup_ar: 'العربية',

        // Landing Page - Hero
        hero_title_1: 'Votre santé,',
        hero_title_highlight: 'chez vous',
        hero_title_2: '.',
        hero_subtitle: 'Des soins d\'excellence, simplifiés et accessibles.',
        search_placeholder: 'Rechercher un soin (ex: diabète, plaie, infirmier…)',
        search_no_results_prefix: 'Aucun soin trouvé pour',
        loading_services: 'Chargement des services...',

        // Landing Page - Features
        features_title_1: 'Pourquoi choisir',
        features_title_highlight: 'DariCare',
        features_title_2: '?',
        features_subtitle: 'Nous redéfinissons l\'expérience des soins à domicile pour vous offrir le meilleur.',
        feat1_title: 'Expertise Certifiée',
        feat1_desc: 'Tous nos professionnels de santé sont rigoureusement sélectionnés et certifiés pour garantir des soins de haute qualité.',
        feat2_title: 'Disponibilité Rapide',
        feat2_desc: 'Prenez rendez-vous en quelques clics. Nos équipes interviennent rapidement selon vos disponibilités.',
        feat3_title: 'Soins Personnalisés',
        feat3_desc: 'Une approche humaine et sur-mesure pour chacun de nos patients. Votre bien-être est notre priorité absolue.',

        // Footer
        footer_desc: 'Votre partenaire santé de confiance, à domicile. Des soins professionnels, accessibles et humains.',
        footer_nav_title: 'Navigation',
        footer_nav_home: 'Accueil',
        footer_nav_services: 'Services',
        footer_nav_about: 'À propos',
        footer_nav_contact: 'Contact',
        footer_services_title: 'Services',
        footer_svc1: 'Soins infirmiers',
        footer_svc2: 'Kinésithérapie',
        footer_svc3: 'Consultations',
        footer_svc4: 'Assistance',
        footer_contact_title: 'Contact',
        footer_rights: 'Tous droits réservés.',

        // Service Selection
        sel_tag: 'Soins à domicile',
        sel_title: 'De quel professionnel avez-vous besoin ?',
        sel_subtitle: 'Sélectionnez le type de service pour votre demande de soins à domicile.',
        sel_back: 'Retour à l\'accueil',
        sel_loading: 'Chargement des services...',
        sel_retry: 'Réessayer',
        sel_choose: 'Choisir',
        sel_default_desc: 'Soins professionnels à domicile.',

        // Login
        login_title: 'L\'excellence des soins, à votre service.',
        login_subtitle: 'Rejoignez notre réseau de professionnels de santé et gérez vos rendez-vous en toute simplicité.',
        login_stats_patients: 'Patients',
        login_stats_idel: 'IDEL',
        login_support: 'Besoin d\'aide ?',
        login_contact_support: 'Contactez notre support',
        login_welcome: 'Bon retour',
        login_fields_subtitle: 'Veuillez entrer vos coordonnées pour vous connecter.',
        login_email_label: 'Email',
        login_password_label: 'Mot de passe',
        login_remember_me: 'Se souvenir de moi',
        login_forgot_password: 'Mot de passe oublié ?',
        login_btn: 'Se connecter',
        login_loading: 'Connexion...',
        login_no_account: 'Vous n\'avez pas de compte ?',
        login_create_account: 'En créer un',

        // Signup
        signup_title: 'Soignez, nous gérons le reste.',
        signup_subtitle: 'Inscrivez-vous en 2 minutes et commencez à recevoir des demandes de soins à domicile.',
        signup_welcome: 'Créer un compte',
        signup_fields_subtitle: 'Rejoignez la plus grande communauté d\'IDEL au Maroc.',
        signup_name_label: 'Nom complet',
        signup_phone_label: 'Téléphone',
        signup_btn: 'S\'inscrire',
        signup_loading: 'Inscription...',
        signup_has_account: 'Vous avez déjà un compte ?',
    },
    ar: {
        // Navbar
        nav_patient: 'المريض',
        nav_idel: 'الممرض',
        nav_aide: 'مساعدة',
        nav_cta: 'احجز موعداً',
        nav_lang_label: 'اللغة',

        // Language Popup
        popup_title: 'اختر لغتك',
        popup_subtitle: 'يمكنك تغييرها في أي وقت من شريط التنقل.',
        popup_fr: 'Français',
        popup_ar: 'العربية',

        // Landing Page - Hero
        hero_title_1: 'صحتك،',
        hero_title_highlight: 'في منزلك',
        hero_title_2: '.',
        hero_subtitle: 'رعاية صحية متميزة، مبسّطة وفي متناول الجميع.',
        search_placeholder: 'ابحث عن رعاية (مثال: سكري، جرح، ممرض…)',
        search_no_results_prefix: 'لم يتم العثور على رعاية لـ',
        loading_services: 'جار تحميل الخدمات...',

        // Landing Page - Features
        features_title_1: 'لماذا تختار',
        features_title_highlight: 'DariCare',
        features_title_2: '؟',
        features_subtitle: 'نعيد تعريف تجربة الرعاية الصحية المنزلية لنقدم لك الأفضل.',
        feat1_title: 'خبرة معتمدة',
        feat1_desc: 'جميع متخصصينا الصحيين منتقون بعناية ومعتمدون لضمان رعاية عالية الجودة.',
        feat2_title: 'توفر سريع',
        feat2_desc: 'احجز موعداً في몇 نقرات. فرقنا تتدخل بسرعة وفق جدولك الزمني.',
        feat3_title: 'رعاية شخصية',
        feat3_desc: 'نهج إنساني ومخصص لكل مريض. راحتك هي أولويتنا القصوى.',

        // Footer
        footer_desc: 'شريكك الصحي الموثوق في منزلك. رعاية مهنية، ميسورة وإنسانية.',
        footer_nav_title: 'التنقل',
        footer_nav_home: 'الرئيسية',
        footer_nav_services: 'الخدمات',
        footer_nav_about: 'من نحن',
        footer_nav_contact: 'اتصل بنا',
        footer_services_title: 'الخدمات',
        footer_svc1: 'التمريض',
        footer_svc2: 'العلاج الطبيعي',
        footer_svc3: 'الاستشارات',
        footer_svc4: 'المساعدة',
        footer_contact_title: 'التواصل',
        footer_rights: 'جميع الحقوق محفوظة.',

        // Service Selection
        sel_tag: 'رعاية منزلية',
        sel_title: 'أي متخصص تحتاج؟',
        sel_subtitle: 'اختر نوع الخدمة لطلب رعايتك الصحية في المنزل.',
        sel_back: 'العودة إلى الرئيسية',
        sel_loading: 'جار تحميل الخدمات...',
        sel_retry: 'إعادة المحاولة',
        sel_choose: 'اختر',
        sel_default_desc: 'رعاية صحية مهنية في المنزل.',

        // Login
        login_title: 'تميز الرعاية، في خدمتكم.',
        login_subtitle: 'انضم إلى شبكتنا من المتخصصين الصحيين وقم بإدارة مواعيدك بكل بساطة.',
        login_stats_patients: 'مريض',
        login_stats_idel: 'ممرض',
        login_support: 'تحتاج مساعدة؟',
        login_contact_support: 'اتصل بالدعم الفني',
        login_welcome: 'مرحباً بعودتك',
        login_fields_subtitle: 'يرجى إدخال بياناتك لتسجيل الدخول.',
        login_email_label: 'البريد الإلكتروني',
        login_password_label: 'كلمة المرور',
        login_remember_me: 'تذكرني',
        login_forgot_password: 'نسيت كلمة المرور؟',
        login_btn: 'تسجيل الدخول',
        login_loading: 'جار الاتصال...',
        login_no_account: 'ليس لديك حساب؟',
        login_create_account: 'أنشئ حساباً',

        // Signup
        signup_title: 'اعتنِ بالمرضى، ونحن نتكفل بالباقي.',
        signup_subtitle: 'سجل في دقيقتين وابدأ في استقبال طلبات الرعاية المنزلية.',
        signup_welcome: 'إنشاء حساب',
        signup_fields_subtitle: 'انضم إلى أكبر مجتمع للممرضين في المغرب.',
        signup_name_label: 'الاسم الكامل',
        signup_phone_label: 'رقم الهاتف',
        signup_btn: 'إنشاء الحساب',
        signup_loading: 'جار التسجيل...',
        signup_has_account: 'لديك حساب بالفعل؟',
    },
};

export function useLanguage() {
    const t = computed(() => translations[currentLang.value]);

    const setLang = (lang: Lang) => {
        currentLang.value = lang;
    };

    const toggleLang = () => {
        currentLang.value = currentLang.value === 'fr' ? 'ar' : 'fr';
    };

    const isAr = computed(() => currentLang.value === 'ar');

    return { currentLang, t, setLang, toggleLang, isAr };
}
