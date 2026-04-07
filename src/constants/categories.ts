export interface ServiceCategory {
  id: string;
  label: string;
  labelEs: string;
  group: string;
  icon: string;
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  // ─── BEAUTY ──────────────────────────────────────────────
  { id: 'hair', label: '💇 Hair Styling', labelEs: '💇 Estilizado de Cabello', group: 'Beauty', icon: 'Scissors' },
  { id: 'hair_coloring', label: '🎨 Hair Coloring', labelEs: '🎨 Coloración de Cabello', group: 'Beauty', icon: 'Palette' },
  { id: 'nails', label: '💅 Nails', labelEs: '💅 Uñas', group: 'Beauty', icon: 'Hand' },
  { id: 'lashes', label: '👁 Lashes', labelEs: '👁 Pestañas', group: 'Beauty', icon: 'Eye' },
  { id: 'brows', label: '🪮 Brows', labelEs: '🪮 Cejas', group: 'Beauty', icon: 'Brush' },
  { id: 'makeup', label: '💋 Makeup', labelEs: '💋 Maquillaje', group: 'Beauty', icon: 'Sparkles' },
  { id: 'barbering', label: '💈 Barbering', labelEs: '💈 Barbería', group: 'Beauty', icon: 'Scissors' },
  { id: 'waxing', label: '🛁 Waxing', labelEs: '🛁 Depilación', group: 'Beauty', icon: 'Flower2' },
  { id: 'teeth_whitening', label: '🦷 Teeth Whitening', labelEs: '🦷 Blanqueamiento Dental', group: 'Beauty', icon: 'Sun' },
  { id: 'pmu', label: '💉 Permanent Makeup', labelEs: '💉 Maquillaje Permanente', group: 'Beauty', icon: 'PenTool' },
  { id: 'hair_extensions', label: '✨ Hair Extensions', labelEs: '✨ Extensiones de Cabello', group: 'Beauty', icon: 'Sparkles' },
  { id: 'braiding', label: '🧶 Braiding & Locs', labelEs: '🧶 Trenzas y Locs', group: 'Beauty', icon: 'Crown' },

  // ─── SKIN & BODY ─────────────────────────────────────────
  { id: 'skincare', label: '🧴 Skincare & Facials', labelEs: '🧴 Cuidado de Piel y Faciales', group: 'Skin & Body', icon: 'Droplets' },
  { id: 'anti_aging', label: '⏳ Anti-Aging Treatments', labelEs: '⏳ Tratamientos Anti-Edad', group: 'Skin & Body', icon: 'Sparkles' },
  { id: 'body_sculpting', label: '🏋️ Body Sculpting', labelEs: '🏋️ Escultura Corporal', group: 'Skin & Body', icon: 'Heart' },
  { id: 'cosmetic_procedures', label: '💆 Cosmetic Procedures', labelEs: '💆 Procedimientos Cosméticos', group: 'Skin & Body', icon: 'Sparkles' },
  { id: 'spray_tan', label: '🌅 Spray Tan', labelEs: '🌅 Bronceado en Spray', group: 'Skin & Body', icon: 'Sun' },

  // ─── MASSAGE & BODYWORK ──────────────────────────────────
  { id: 'massage', label: '🧘 Massage Therapy', labelEs: '🧘 Masaje Terapéutico', group: 'Massage & Bodywork', icon: 'Heart' },
  { id: 'deep_tissue', label: '💪 Deep Tissue Massage', labelEs: '💪 Masaje de Tejido Profundo', group: 'Massage & Bodywork', icon: 'Heart' },
  { id: 'prenatal_massage', label: '🤰 Prenatal Massage', labelEs: '🤰 Masaje Prenatal', group: 'Massage & Bodywork', icon: 'Heart' },
  { id: 'sports_massage', label: '🏃 Sports Massage', labelEs: '🏃 Masaje Deportivo', group: 'Massage & Bodywork', icon: 'Heart' },
  { id: 'reflexology', label: '🦶 Reflexology', labelEs: '🦶 Reflexología', group: 'Massage & Bodywork', icon: 'Heart' },

  // ─── FITNESS ─────────────────────────────────────────────
  { id: 'yoga', label: '🧘 Yoga', labelEs: '🧘 Yoga', group: 'Fitness', icon: 'Heart' },
  { id: 'pilates', label: '🤸 Pilates', labelEs: '🤸 Pilates', group: 'Fitness', icon: 'Heart' },
  { id: 'personal_training', label: '💪 Personal Training', labelEs: '💪 Entrenamiento Personal', group: 'Fitness', icon: 'Heart' },
  { id: 'dance_fitness', label: '💃 Dance Fitness', labelEs: '💃 Baile Fitness', group: 'Fitness', icon: 'Heart' },
  { id: 'hiit', label: '🔥 HIIT Training', labelEs: '🔥 Entrenamiento HIIT', group: 'Fitness', icon: 'Heart' },
  { id: 'postpartum_fitness', label: '👶 Postpartum Fitness', labelEs: '👶 Fitness Postparto', group: 'Fitness', icon: 'Heart' },
  { id: 'prenatal_fitness', label: '🤰 Prenatal Fitness', labelEs: '🤰 Fitness Prenatal', group: 'Fitness', icon: 'Heart' },
  { id: 'functional_fitness', label: '⚡ Functional Fitness', labelEs: '⚡ Fitness Funcional', group: 'Fitness', icon: 'Heart' },
  { id: 'active_aging', label: '🌟 Active Aging Fitness', labelEs: '🌟 Fitness para Adultos Mayores', group: 'Fitness', icon: 'Heart' },

  // ─── WELLNESS & HOLISTIC ─────────────────────────────────
  { id: 'acupuncture', label: '📍 Acupuncture', labelEs: '📍 Acupuntura', group: 'Wellness & Holistic', icon: 'Heart' },
  { id: 'reiki', label: '✨ Reiki & Energy Healing', labelEs: '✨ Reiki y Sanación Energética', group: 'Wellness & Holistic', icon: 'Sparkles' },
  { id: 'meditation', label: '🧘 Meditation & Mindfulness', labelEs: '🧘 Meditación y Mindfulness', group: 'Wellness & Holistic', icon: 'Heart' },
  { id: 'aromatherapy', label: '🌸 Aromatherapy', labelEs: '🌸 Aromaterapia', group: 'Wellness & Holistic', icon: 'Flower2' },
  { id: 'chiropractic', label: '🦴 Chiropractic Care', labelEs: '🦴 Cuidado Quiropráctico', group: 'Wellness & Holistic', icon: 'Heart' },
  { id: 'ayurveda', label: '🌿 Ayurveda', labelEs: '🌿 Ayurveda', group: 'Wellness & Holistic', icon: 'Heart' },
  { id: 'sound_healing', label: '🔔 Sound Healing', labelEs: '🔔 Sanación con Sonido', group: 'Wellness & Holistic', icon: 'Heart' },
  { id: 'herbalism', label: '🌱 Herbalism & Natural Remedies', labelEs: '🌱 Herbalismo y Remedios Naturales', group: 'Wellness & Holistic', icon: 'Heart' },
  { id: 'sleep_coaching', label: '😴 Sleep Coaching', labelEs: '😴 Coaching de Sueño', group: 'Wellness & Holistic', icon: 'Heart' },

  // ─── COACHING & CONSULTING ───────────────────────────────
  { id: 'health_coaching', label: '🍎 Health Coaching', labelEs: '🍎 Coaching de Salud', group: 'Coaching & Consulting', icon: 'Heart' },
  { id: 'life_coaching', label: '🎯 Life Coaching', labelEs: '🎯 Coaching de Vida', group: 'Coaching & Consulting', icon: 'Heart' },
  { id: 'nutrition', label: '🥗 Nutrition & Meal Planning', labelEs: '🥗 Nutrición y Planificación de Comidas', group: 'Coaching & Consulting', icon: 'Heart' },
  { id: 'stress_management', label: '🧠 Stress Management', labelEs: '🧠 Manejo del Estrés', group: 'Coaching & Consulting', icon: 'Heart' },
  { id: 'postpartum_care', label: '👶 Postpartum Care & Support', labelEs: '👶 Cuidado y Apoyo Postparto', group: 'Coaching & Consulting', icon: 'Heart' },
  { id: 'fertility_consulting', label: '🌸 Fertility Consulting', labelEs: '🌸 Consultoría de Fertilidad', group: 'Coaching & Consulting', icon: 'Flower2' },
  { id: 'menopause_support', label: '🌺 Menopause Support', labelEs: '🌺 Apoyo para la Menopausia', group: 'Coaching & Consulting', icon: 'Flower2' },
];

// Helper — get all unique groups
export const CATEGORY_GROUPS = [...new Set(SERVICE_CATEGORIES.map(c => c.group))];

// Helper — get categories by group
export function getCategoriesByGroup(): Record<string, ServiceCategory[]> {
  return CATEGORY_GROUPS.reduce((acc, group) => {
    acc[group] = SERVICE_CATEGORIES.filter(c => c.group === group);
    return acc;
  }, {} as Record<string, ServiceCategory[]>);
}

// Helper — get label by id
export function getCategoryLabel(id: string): string {
  return SERVICE_CATEGORIES.find(c => c.id === id)?.label || id;
}

// Helper — get emoji from label
export function getCategoryEmoji(id: string): string {
  const cat = SERVICE_CATEGORIES.find(c => c.id === id);
  if (!cat) return '✨';
  return cat.label.split(' ')[0];
}

// Helper — get display name (without emoji)
export function getCategoryName(id: string): string {
  const cat = SERVICE_CATEGORIES.find(c => c.id === id);
  if (!cat) return id;
  return cat.label.split(' ').slice(1).join(' ');
}

// Featured categories for homepage
export const FEATURED_CATEGORY_IDS = [
  'hair', 'nails', 'skincare', 'massage', 'yoga',
  'pilates', 'lashes', 'makeup', 'acupuncture',
  'health_coaching', 'brows', 'body_sculpting',
];

// Group label translations
export const GROUP_LABELS_ES: Record<string, string> = {
  'Beauty': 'Belleza',
  'Skin & Body': 'Piel y Cuerpo',
  'Massage & Bodywork': 'Masaje y Terapia Corporal',
  'Fitness': 'Fitness',
  'Wellness & Holistic': 'Bienestar y Holístico',
  'Coaching & Consulting': 'Coaching y Consultoría',
};

// Backwards compat: map old IDs to new IDs
export const LEGACY_ID_MAP: Record<string, string> = {
  'hair_styling': 'hair',
  'facials': 'skincare',
  'eyebrows': 'brows',
  'permanent_makeup': 'pmu',
  'bridal': 'makeup',
};

export function normalizeCategoryId(id: string): string {
  return LEGACY_ID_MAP[id] || id;
}
