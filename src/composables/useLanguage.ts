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
        nav_idel: 'Professionnel de santé',
        nav_aide: 'Aide',
        nav_cta: 'Prendre rendez-vous',
        nav_about: 'À propos Daricare',
        nav_lang_label: 'Langue',
        nav_avis: 'Avis',

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
        login_stats_idel: 'Professionnel de santé',
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
        signup_fields_subtitle: 'Rejoignez la plus grande communauté de professionnels de santé au Maroc.',
        signup_name_label: 'Nom complet',
        signup_phone_label: 'Téléphone',
        signup_btn: 'S\'inscrire',
        signup_loading: 'Inscription...',
        signup_has_account: 'Vous avez déjà un compte ?',
        signup_create_account: 'S\'inscrire',

        // Help Page
        help_title: 'Besoin d\'aide ?',
        help_subtitle: 'Nous sommes là pour vous accompagner. Retrouvez ici les réponses à vos questions les plus fréquentes.',
        help_faq_title: 'Questions Fréquentes',
        help_q1: 'Comment prendre rendez-vous ?',
        help_a1: 'Cliquez sur "Prendre rendez-vous" dans la barre de navigation, sélectionnez le professionnel dont vous avez besoin, puis remplissez le formulaire de demande.',
        help_q2: 'Quels sont les délais d\'intervention ?',
        help_a2: 'Nos professionnels interviennent généralement dans l\'heure pour les demandes urgentes, ou selon l\'horaire qui vous convient le mieux.',
        help_q3: 'Comment sont sélectionnés les professionnels ?',
        help_a3: 'Tous nos partenaires sont diplômés d\'État et passent par un processus de vérification rigoureux (diplômes, casier judiciaire, expérience).',
        help_contact_title: 'Contactez-nous',
        help_contact_subtitle: 'Vous ne trouvez pas la réponse à votre question ? Notre équipe est disponible 7j/7.',
        help_contact_phone: 'Téléphone : +216 21 918 926',
        help_contact_email: 'Email : contact@proofagency.com',
        help_contact_chat: 'Chattez avec nous',

        // About Page
        about_hero_tag: 'À propos de nous',
        about_hero_title: 'Redéfinir le soin à domicile',
        about_hero_subtitle: 'Daricare est né d\'une volonté simple : offrir à chaque patient des soins d\'excellence dans le confort de sa maison.',
        about_mission_title: 'Notre Mission',
        about_mission_desc: 'Connecter les meilleurs professionnels de santé avec les patients qui en ont le plus besoin, à travers une plateforme sécurisée, humaine et innovante.',
        about_vision_title: 'Notre Vision',
        about_vision_desc: 'Devenir le leader de la santé connectée au Maroc en plaçant l\'humanité et la technologie au service du bien-être de chacun.',
        about_values_title: 'Nos Valeurs Fondamentales',
        about_val1_title: 'Excellence',
        about_val1_desc: 'La qualité des soins est notre exigence première et quotidienne.',
        about_val2_title: 'Proximité',
        about_val2_desc: 'Nous sommes physiquement et technologiquement proches de vous.',
        about_val3_title: 'Humanité',
        about_val3_desc: 'Derrière chaque soin, il y a un sourire et une écoute attentive.',

        // How it works
        about_how_title: 'Comment ça marche ?',
        about_how_step1_title: 'Sélectionnez un soin',
        about_how_step1_desc: 'Choisissez le type de soin dont vous avez besoin parmi nos nombreux services certifiés.',
        about_how_step2_title: 'Remplissez le formulaire',
        about_how_step2_desc: 'Précisez vos disponibilités, votre adresse et vos préférences pour une prise en charge sur mesure.',
        about_how_step3_title: 'Validation & Intervention',
        about_how_step3_desc: 'Un professionnel qualifié accepte votre demande et intervient chez vous selon l\'horaire convenu.',

        // Avis Page
        avis_title: 'Votre avis compte',
        avis_subtitle: 'Partagez votre expérience avec Daricare pour nous aider à nous améliorer.',
        avis_label_title: 'Titre de l\'avis',
        avis_label_rating: 'Note globale',
        avis_label_comment: 'Votre commentaire',
        avis_label_phone: 'Numéro de téléphone',
        avis_label_recommend: 'Recommanderiez-vous Daricare à vos proches ?',
        avis_placeholder_title: 'Ex: Excellent service !',
        avis_placeholder_comment: 'Dites-nous ce que vous avez particulièrement apprécié...',
        avis_placeholder_phone: 'Ex: 0123456789',
        avis_btn_submit: 'Publier mon avis',
        avis_loading: 'Envoi en cours...',
        avis_success: 'Merci ! Votre avis a été enregistré et sera publié après validation.',
        avis_error_no_request: 'Vous devez avoir déjà effectué une demande de soin pour pouvoir laisser un avis.',
        avis_error_generic: 'Une erreur est survenue lors de l\'envoi de votre avis.',
        avis_recommend_yes: 'Oui, absolument',
        avis_recommend_no: 'Pas encore',
    },
    ar: {
        // Navbar
        nav_patient: 'المريض',
        nav_idel: 'متخصص صحي',
        nav_aide: 'مساعدة',
        nav_cta: 'احجز موعداً',
        nav_about: 'عن داري كير',
        nav_lang_label: 'اللغة',
        nav_avis: 'الآراء',

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
        login_stats_idel: 'متخصص صحي',
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
        signup_fields_subtitle: 'انضم إلى أكبر مجتمع للمتخصصين الصحيين في المغرب.',
        signup_name_label: 'الاسم الكامل',
        signup_phone_label: 'رقم الهاتف',
        signup_btn: 'إنشاء الحساب',
        signup_loading: 'جار التسجيل...',
        signup_has_account: 'لديك حساب بالفعل؟',
        signup_create_account: 'إنشاء حساب',

        // Help Page
        help_title: 'هل تحتاج إلى مساعدة؟',
        help_subtitle: 'نحن هنا لمرافقتك. تجد هنا إجابات على أسئلتك الأكثر شيوعاً.',
        help_faq_title: 'الأسئلة الشائعة',
        help_q1: 'كيف يمكنني حجز موعد؟',
        help_a1: 'انقر فوق "احجز موعداً" في شريط التنقل، واختر المتخصص الذي تحتاجه، ثم املأ نموذج الطلب.',
        help_q2: 'ما هي مواعيد التدخل؟',
        help_a2: 'يتدخل متخصصونا عادةً خلال ساعة للطلبات العاجلة، أو وفقاً للجدول الزمني الذي يناسبك.',
        help_q3: 'كيف يتم اختيار المتخصصين؟',
        help_a3: 'جميع شركائنا حاصلون على شهادات الدولة ويمرون بعملية تحقق صارمة (الشهادات، السجل العدلي، الخبرة).',
        help_contact_title: 'اتصل بنا',
        help_contact_subtitle: 'لم تجد إجابة لسؤالك؟ فريقنا متاح 7 أيام في الأسبوع.',
        help_contact_phone: 'الهاتف: +216 21 918 926',
        help_contact_email: 'البريد الإلكتروني: contact@proofagency.com',
        help_contact_chat: 'تحدث معنا',

        // About Page
        about_hero_tag: 'من نحن',
        about_hero_title: 'إعادة تعريف الرعاية المنزلية',
        about_hero_subtitle: 'ولدت داري كير من رغبة بسيطة: تقديم رعاية صحية متميزة لكل مريض في راحة منزله.',
        about_mission_title: 'مهمتنا',
        about_mission_desc: 'ربط أفضل المتخصصين الصحيين بالمرضى الذين هم في أمس الحاجة إليهم، من خلال منصة آمنة، إنسانية ومبتكرة.',
        about_vision_title: 'رؤيتنا',
        about_vision_desc: 'أن نصبح الرائد في الصحة المتصلة في المغرب من خلال وضع الإنسانية والتكنولوجيا في خدمة رفاهية الجميع.',
        about_values_title: 'قيمنا الأساسية',
        about_val1_title: 'التميز',
        about_val1_desc: 'جودة الرعاية هي مطلبنا الأول واليومي.',
        about_val2_title: 'القرب',
        about_val2_desc: 'نحن قريبون منك جسدياً وتقنياً.',
        about_val3_title: 'الإنسانية',
        about_val3_desc: 'خلف كل رعاية، هناك ابتسامة واستماع باهتمام.',

        // How it works
        about_how_title: 'كيف يعمل داري كير؟',
        about_how_step1_title: 'اختر نوع الرعاية',
        about_how_step1_desc: 'اختر نوع الخدمة التي تحتاجها من بين خدماتنا المعتمدة والمتنوعة.',
        about_how_step2_title: 'املأ النموذج',
        about_how_step2_desc: 'حدد مواعيدك، عنوانك وتفضيلاتك للحصول على رعاية مخصصة لك.',
        about_how_step3_title: 'التأكيد والزيارة',
        about_how_step3_desc: 'يقبل متخصص مؤهل طلبك ويقوم بزيارتك في منزلك في الوقت المتفق عليه.',

        // Avis Page
        avis_title: 'رأيكم يهمنا',
        avis_subtitle: 'شاركنا تجربتك مع داري كير لمساعدتنا على تقديم الأفضل.',
        avis_label_title: 'عنوان التقييم',
        avis_label_rating: 'التقييم العام',
        avis_label_comment: 'تعليقك',
        avis_label_phone: 'رقم الهاتف',
        avis_label_recommend: 'هل تنصح بداري كير لأقاربك؟',
        avis_placeholder_title: 'مثال: خدمة ممتازة !',
        avis_placeholder_comment: 'أخبرنا عما أعجبك بشكل خاص...',
        avis_placeholder_phone: 'مثال: 0123456789',
        avis_btn_submit: 'نشر تقييمي',
        avis_loading: 'جاري الإرسال...',
        avis_success: 'شكراً لك! تم تسجيل تقييمك وسيتم نشره بعد المراجعة.',
        avis_error_no_request: 'يجب أن تكون قد قمت بطلب رعاية من قبل لتتمكن من ترك تقييم.',
        avis_error_generic: 'حدث خطأ أثناء إرسال تقييمك.',
        avis_recommend_yes: 'نعم، بالتأكيد',
        avis_recommend_no: 'ليس بعد',
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
