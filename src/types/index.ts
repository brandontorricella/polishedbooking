// Polished App Types

export type Language = 'en' | 'es';

export type UserRole = 'client' | 'business';

export type SubscriptionTier = 'basic' | 'pro' | 'elite';

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid';

export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'awaiting_payment' | 'completed' | 'canceled';

export type ServiceSetting = 'in_studio' | 'mobile' | 'both';

export type BudgetPreference = 'budget' | 'mid' | 'premium' | 'luxury' | 'no_preference';

export interface User {
  id: string;
  email: string;
  displayName?: string;
  profilePhotoUrl?: string;
  preferredLanguage: Language;
  role: UserRole;
  createdAt: Date;
}

export interface ClientUser extends User {
  role: 'client';
  location?: {
    lat: number;
    lng: number;
    city: string;
    state: string;
    zip: string;
  };
  serviceInterests: string[];
  settingPreference: ServiceSetting;
  budgetPreference: BudgetPreference;
  discoveryPreferences: string[];
  savedBusinessIds: string[];
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  description: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  categories: string[];
  services: Service[];
  location: {
    address: string;
    city: string;
    state: string;
    zip: string;
    lat: number;
    lng: number;
  };
  phone?: string;
  email?: string;
  website?: string;
  hours: BusinessHours;
  serviceSetting: ServiceSetting;
  priceRange: 1 | 2 | 3 | 4;
  isBlackOwned: boolean;
  isHispanicOwned?: boolean;
  isLgbtqOwned?: boolean;
  isLgbtqWelcoming?: boolean;
  isVerified: boolean;
  isFeatured: boolean;
  subscriptionTier: SubscriptionTier;
  subscriptionStatus: SubscriptionStatus;
  rating: number;
  reviewCount: number;
  portfolioImages: string[];
  createdAt: Date;
  promotions?: Promotion[];
  distance?: number;
  offersClasses?: boolean;
  offersAppointments?: boolean;
  offersVirtual?: boolean;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  duration: number; // minutes
  price: number;
  category: string;
}

export interface BusinessHours {
  monday: DayHours | null;
  tuesday: DayHours | null;
  wednesday: DayHours | null;
  thursday: DayHours | null;
  friday: DayHours | null;
  saturday: DayHours | null;
  sunday: DayHours | null;
}

export interface DayHours {
  open: string;
  close: string;
}

export interface Booking {
  id: string;
  clientId: string;
  businessId: string;
  serviceId: string;
  date: Date;
  time: string;
  status: BookingStatus;
  totalPrice: number;
  notes?: string;
  createdAt: Date;
}

export interface Review {
  id: string;
  clientId: string;
  businessId: string;
  rating: number;
  text: string;
  createdAt: Date;
  isAnonymized: boolean;
  clientName?: string;
  clientPhotoUrl?: string;
}

export interface Promotion {
  id: string;
  businessId: string;
  title: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  startDate: Date;
  endDate: Date;
  isNewClientOnly: boolean;
  code?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  clientId: string;
  businessId: string;
  lastMessageAt: Date;
  lastMessage?: string;
  unreadCount: number;
}

export interface AnalyticsData {
  totalBookings: number;
  totalRevenue: number;
  newClients: number;
  returningClients: number;
  averageRating: number;
  viewsThisMonth: number;
  bookingsByDay: { date: string; count: number }[];
  revenueByMonth: { month: string; revenue: number }[];
  topServices: { name: string; bookings: number }[];
  clientRetentionRate: number;
}

export interface SearchFilters {
  query?: string;
  categories?: string[];
  location?: string;
  radius?: number;
  priceRange?: number[];
  rating?: number;
  serviceSetting?: ServiceSetting;
  isBlackOwned?: boolean;
  hasPromotions?: boolean;
  availability?: 'today' | 'tomorrow' | 'this_week';
}
