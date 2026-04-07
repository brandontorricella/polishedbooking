// Internationalization support for English and Spanish

export type Language = 'en' | 'es';

export const translations = {
  en: {
    // Navigation
    home: 'Home',
    search: 'Search',
    favorites: 'Favorites',
    bookings: 'Bookings',
    profile: 'Profile',
    settings: 'Settings',
    messages: 'Messages',
    
    // Auth
    login: 'Log In',
    signUp: 'Sign Up',
    logout: 'Log Out',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    createAccount: 'Create Account',
    welcomeBack: 'Welcome Back',
    
    // Hero
    heroTitle: 'Discover Beauty & Wellness Near You',
    heroSubtitle: 'Book appointments with top-rated beauty & wellness professionals in your area',
    getStarted: 'Get Started',
    findServices: 'Find Services',
    forBusinesses: 'For Businesses',
    
    // Categories
    hairStyling: 'Hair Styling & Cuts',
    hairColoring: 'Hair Coloring',
    makeup: 'Makeup & Glam',
    nails: 'Nails & Manicures',
    lashes: 'Eyelash Extensions',
    eyebrows: 'Eyebrow Services',
    facials: 'Facials & Skincare',
    waxing: 'Waxing',
    massage: 'Massage & Bodywork',
    sprayTan: 'Spray Tans',
    permanentMakeup: 'Permanent Makeup',
    lymphaticDrainage: 'Lymphatic Drainage',
    bodySculpting: 'Body Sculpting',
    barbering: 'Barbering',
    bridalBeauty: 'Bridal Beauty',
    
    // Filters
    filters: 'Filters',
    blackOwned: 'Black-Owned',
    topRated: 'Top Rated',
    nearMe: 'Near Me',
    priceRange: 'Price Range',
    availability: 'Availability',
    mobileServices: 'Mobile Services',
    inStudio: 'In Studio',
    
    // Business
    bookNow: 'Book Now',
    viewProfile: 'View Profile',
    reviews: 'Reviews',
    services: 'Services',
    portfolio: 'Portfolio',
    about: 'About',
    hours: 'Hours',
    location: 'Location',
    verified: 'Verified',
    featured: 'Featured',
    recommended: 'Recommended',
    
    // Promotions
    promotions: 'Promotions & Deals',
    discount: 'Discount',
    limitedTime: 'Limited Time',
    newClient: 'New Client Special',
    
    // Analytics
    analytics: 'Analytics',
    totalBookings: 'Total Bookings',
    totalRevenue: 'Total Revenue',
    newClients: 'New Clients',
    returningClients: 'Returning Clients',
    averageRating: 'Average Rating',
    viewsThisMonth: 'Views This Month',
    
    // Messaging
    sendMessage: 'Send Message',
    typeMessage: 'Type a message...',
    conversations: 'Conversations',
    noMessages: 'No messages yet',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    seeAll: 'See All',
    today: 'Today',
    tomorrow: 'Tomorrow',
    thisWeek: 'This Week',
  },
  es: {
    // Navigation
    home: 'Inicio',
    search: 'Buscar',
    favorites: 'Favoritos',
    bookings: 'Reservas',
    profile: 'Perfil',
    settings: 'Configuración',
    messages: 'Mensajes',
    
    // Auth
    login: 'Iniciar Sesión',
    signUp: 'Registrarse',
    logout: 'Cerrar Sesión',
    email: 'Correo Electrónico',
    password: 'Contraseña',
    confirmPassword: 'Confirmar Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    createAccount: 'Crear Cuenta',
    welcomeBack: 'Bienvenido de Nuevo',
    
    // Hero
    heroTitle: 'Descubre Belleza y Bienestar Cerca de Ti',
    heroSubtitle: 'Reserva citas con los mejores profesionales de belleza y bienestar en tu área',
    getStarted: 'Comenzar',
    findServices: 'Encontrar Servicios',
    forBusinesses: 'Para Negocios',
    
    // Categories
    hairStyling: 'Cortes y Estilizado',
    hairColoring: 'Coloración de Cabello',
    makeup: 'Maquillaje y Glam',
    nails: 'Uñas y Manicuras',
    lashes: 'Extensiones de Pestañas',
    eyebrows: 'Servicios de Cejas',
    facials: 'Faciales y Cuidado de Piel',
    waxing: 'Depilación con Cera',
    massage: 'Masajes y Terapia',
    sprayTan: 'Bronceado en Spray',
    permanentMakeup: 'Maquillaje Permanente',
    lymphaticDrainage: 'Drenaje Linfático',
    bodySculpting: 'Escultura Corporal',
    barbering: 'Barbería',
    bridalBeauty: 'Belleza Nupcial',
    
    // Filters
    filters: 'Filtros',
    blackOwned: 'Negocio Afroamericano',
    topRated: 'Mejor Calificados',
    nearMe: 'Cerca de Mí',
    priceRange: 'Rango de Precio',
    availability: 'Disponibilidad',
    mobileServices: 'Servicios Móviles',
    inStudio: 'En Estudio',
    
    // Business
    bookNow: 'Reservar Ahora',
    viewProfile: 'Ver Perfil',
    reviews: 'Reseñas',
    services: 'Servicios',
    portfolio: 'Portafolio',
    about: 'Acerca de',
    hours: 'Horario',
    location: 'Ubicación',
    verified: 'Verificado',
    featured: 'Destacado',
    recommended: 'Recomendado',
    
    // Promotions
    promotions: 'Promociones y Ofertas',
    discount: 'Descuento',
    limitedTime: 'Tiempo Limitado',
    newClient: 'Especial Nuevo Cliente',
    
    // Analytics
    analytics: 'Analíticas',
    totalBookings: 'Total de Reservas',
    totalRevenue: 'Ingresos Totales',
    newClients: 'Nuevos Clientes',
    returningClients: 'Clientes Recurrentes',
    averageRating: 'Calificación Promedio',
    viewsThisMonth: 'Vistas Este Mes',
    
    // Messaging
    sendMessage: 'Enviar Mensaje',
    typeMessage: 'Escribe un mensaje...',
    conversations: 'Conversaciones',
    noMessages: 'Sin mensajes aún',
    
    // Common
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    delete: 'Eliminar',
    edit: 'Editar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    seeAll: 'Ver Todo',
    today: 'Hoy',
    tomorrow: 'Mañana',
    thisWeek: 'Esta Semana',
  },
};

export const useTranslation = (lang: Language = 'en') => {
  return {
    t: (key: keyof typeof translations.en) => translations[lang][key] || key,
    lang,
  };
};
