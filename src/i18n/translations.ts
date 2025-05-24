export const translations = {
  ar: {
    // Header
    title: 'اعرف دينك',
    subtitle: 'معرفة إسلامية شاملة',
    
    // Topics
    aqida: 'العقيدة',
    aqidaDesc: 'أساسيات الإيمان والتوحيد',
    ibadat: 'العبادات',
    ibadatDesc: 'الصلاة والصوم والزكاة والحج',
    seera: 'السيرة',
    seeraDesc: 'سيرة النبي محمد صلى الله عليه وسلم',
    tareekh: 'التاريخ',
    tareekhDesc: 'تاريخ الإسلام والحضارة الإسلامية',
    
    // Description
    welcomeTitle: 'مرحباً بك في موقع المعرفة الإسلامية',
    welcomeText: 'هذا الموقع يهدف إلى تقديم المعرفة الإسلامية الصحيحة والموثقة من الكتاب والسنة. يمكنك تصفح المواضيع المختلفة لتعلم أساسيات الدين الإسلامي، من العقيدة والعبادات إلى السيرة النبوية وتاريخ الإسلام.',
    
    // Features
    feature1: 'محتوى معتمد من الكتاب والسنة',
    feature2: 'شرح مبسط ومفهوم للجميع',
    feature3: 'متاح بعدة لغات',
    
    // Language names
    arabic: 'العربية',
    english: 'English',
    french: 'Français'
  },
  
  en: {
    // Header
    title: 'Know Your Religion',
    subtitle: 'Comprehensive Islamic Knowledge',
    
    // Topics
    aqida: 'Creed',
    aqidaDesc: 'Foundations of faith and monotheism',
    ibadat: 'Worship',
    ibadatDesc: 'Prayer, fasting, charity, and pilgrimage',
    seera: 'Biography',
    seeraDesc: 'Biography of Prophet Muhammad (PBUH)',
    tareekh: 'History',
    tareekhDesc: 'Islamic history and civilization',
    
    // Description
    welcomeTitle: 'Welcome to the Islamic Knowledge Website',
    welcomeText: 'This website aims to provide authentic and documented Islamic knowledge from the Quran and Sunnah. You can browse different topics to learn the basics of Islam, from creed and worship to the Prophet\'s biography and Islamic history.',
    
    // Features
    feature1: 'Content based on Quran and Sunnah',
    feature2: 'Simple explanations for everyone',
    feature3: 'Available in multiple languages',
    
    // Language names
    arabic: 'العربية',
    english: 'English',
    french: 'Français'
  },
  
  fr: {
    // Header
    title: 'Connaissez Votre Religion',
    subtitle: 'Connaissance Islamique Complète',
    
    // Topics
    aqida: 'Croyance',
    aqidaDesc: 'Fondements de la foi et du monothéisme',
    ibadat: 'Adoration',
    ibadatDesc: 'Prière, jeûne, charité et pèlerinage',
    seera: 'Biographie',
    seeraDesc: 'Biographie du Prophète Muhammad (PSL)',
    tareekh: 'Histoire',
    tareekhDesc: 'Histoire et civilisation islamiques',
    
    // Description
    welcomeTitle: 'Bienvenue sur le site de Connaissance Islamique',
    welcomeText: 'Ce site vise à fournir des connaissances islamiques authentiques et documentées du Coran et de la Sunnah. Vous pouvez parcourir différents sujets pour apprendre les bases de l\'Islam, de la croyance et de l\'adoration à la biographie du Prophète et à l\'histoire islamique.',
    
    // Features
    feature1: 'Contenu basé sur le Coran et la Sunnah',
    feature2: 'Explications simples pour tous',
    feature3: 'Disponible en plusieurs langues',
    
    // Language names
    arabic: 'العربية',
    english: 'English',
    french: 'Français'
  }
} as const;

export type Locale = keyof typeof translations; 