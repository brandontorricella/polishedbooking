import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Settings, Bell, Shield, CreditCard,
  LogOut, ChevronRight, Camera, Moon, Sun, Trash2, Globe, Crown, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/contexts/ThemeContext';
import { useAccountType } from '@/hooks/useAccountType';
import { useSuperwall } from '@/hooks/useSuperwall';
import { supabase } from '@/integrations/supabase/client';
import { SubscriptionManager } from '@/components/subscription/SubscriptionManager';
import { DepositCancellationSettings } from '@/components/booking/DepositCancellationSettings';
import { TipSettings } from '@/components/booking/TipSettings';
import { ChangePasswordSection } from '@/components/settings/ChangePasswordSection';
import { BusinessTypeSettings } from '@/components/business/BusinessTypeSettings';
import { useTranslation } from '@/hooks/useTranslation';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile, loading, session } = useAuth();
  const { toast } = useToast();
  const { isDark, toggleTheme } = useTheme();
  const { isSubscribed, showPaywall, subscription } = useSuperwall();
  const { businessId } = useAccountType();
  const { t } = useTranslation();
  
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSubscriptionManager, setShowSubscriptionManager] = useState(false);
  const [showDepositSettings, setShowDepositSettings] = useState(false);
  const [showBusinessTypeSettings, setShowBusinessTypeSettings] = useState(false);
  const [showTipSettings, setShowTipSettings] = useState(false);

  const isBusinessUser = profile?.role === 'business';

  useEffect(() => {
    if (!user && !loading) navigate('/auth');
    if (profile) {
      setDisplayName(profile.display_name || '');
      setPhone(profile.phone || '');
    }
  }, [user, profile, loading, navigate]);

  useEffect(() => {
    if (!loading && isBusinessUser && !isSubscribed && subscription !== null) {
      showPaywall(subscription?.tier || 'basic');
    }
  }, [loading, isBusinessUser, isSubscribed, subscription, showPaywall]);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateProfile({ display_name: displayName, phone });
    if (!error) {
      toast({ title: t('profile', 'profileUpdated'), description: t('profile', 'changesSaved') });
      setIsEditing(false);
    }
    setIsSaving(false);
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (error) throw error;
      if (data.success) {
        toast({
          title: t('businessProfile', 'accountDeleted'),
          description: isBusinessUser ? t('businessProfile', 'accountDeletedBiz') : t('businessProfile', 'accountDeletedClient'),
        });
        await signOut();
        navigate('/');
      } else {
        throw new Error(data.error || t('businessProfile', 'failedDelete'));
      }
    } catch (err) {
      console.error('Delete account error:', err);
      toast({
        title: t('businessProfile', 'error'),
        description: err instanceof Error ? err.message : t('businessProfile', 'failedDelete'),
        variant: 'destructive',
      });
    }
    setIsDeleting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse"><Settings className="w-8 h-8 text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <h1 className="font-display text-3xl font-bold mb-8">{t('profile', 'title')}</h1>

          {/* Profile Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl border border-border p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profile?.profile_photo_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                    {profile?.display_name?.charAt(0) || profile?.email?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('profile', 'yourName')} className="h-10" />
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('profile', 'phoneNumber')} className="h-10" />
                  </div>
                ) : (
                  <>
                    <h2 className="font-display text-xl font-semibold">{profile?.display_name || t('profile', 'setName')}</h2>
                    <p className="text-muted-foreground">{profile?.email}</p>
                    {profile?.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
                  </>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {isEditing ? (
                <>
                  <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-primary hover:opacity-90">
                    {isSaving ? t('profile', 'saving') : t('profile', 'saveChanges')}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>{t('profile', 'cancel')}</Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>{t('profile', 'editProfile')}</Button>
              )}
            </div>
          </motion.div>

          {/* View My Storefront */}
          {isBusinessUser && businessId && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="mb-6">
              <Link to={`/business/${businessId}`}>
                <div className="w-full bg-card rounded-2xl border border-border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Eye className="w-5 h-5 text-primary" /></div>
                    <div>
                      <p className="font-medium text-foreground">{t('profile', 'viewStorefront')}</p>
                      <p className="text-sm text-muted-foreground">{t('profile', 'storefrontDesc')}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Link>
            </motion.div>
          )}

          {/* Subscription */}
          {isBusinessUser && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
              <button onClick={() => setShowSubscriptionManager(!showSubscriptionManager)} className="w-full bg-card rounded-2xl border border-border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Crown className="w-5 h-5 text-primary" /></div>
                  <div className="text-left">
                    <p className="font-medium">{t('profile', 'subscription')}</p>
                    <p className="text-sm text-muted-foreground">
                      {isSubscribed ? `${subscription?.tier?.charAt(0).toUpperCase()}${subscription?.tier?.slice(1)} Plan` : t('profile', 'noSubscription')}
                    </p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showSubscriptionManager ? 'rotate-90' : ''}`} />
              </button>
              {showSubscriptionManager && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-4">
                  <SubscriptionManager />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Deposits & Cancellation */}
          {isBusinessUser && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="mb-6">
              <button onClick={() => setShowDepositSettings(!showDepositSettings)} className="w-full bg-card rounded-2xl border border-border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-primary" /></div>
                  <div className="text-left">
                    <p className="font-medium">{t('profile', 'depositsCancel')}</p>
                    <p className="text-sm text-muted-foreground">{t('profile', 'depositsCancelDesc')}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showDepositSettings ? 'rotate-90' : ''}`} />
              </button>
              {showDepositSettings && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                  <DepositCancellationSettings />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Business Type & Credentials */}
          {isBusinessUser && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.075 }} className="mb-6">
              <button onClick={() => setShowBusinessTypeSettings(!showBusinessTypeSettings)} className="w-full bg-card rounded-2xl border border-border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><span className="text-lg">🏢</span></div>
                  <div className="text-left">
                    <p className="font-medium">Business Type & Credentials</p>
                    <p className="text-sm text-muted-foreground">Service types, certifications, and specialties</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showBusinessTypeSettings ? 'rotate-90' : ''}`} />
              </button>
              {showBusinessTypeSettings && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                  <BusinessTypeSettings />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Tip Settings */}
          {isBusinessUser && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.078 }} className="mb-6">
              <button onClick={() => setShowTipSettings(!showTipSettings)} className="w-full bg-card rounded-2xl border border-border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><span className="text-lg">💝</span></div>
                  <div className="text-left">
                    <p className="font-medium">Tip Settings</p>
                    <p className="text-sm text-muted-foreground">Configure tip options for your clients</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showTipSettings ? 'rotate-90' : ''}`} />
              </button>
              {showTipSettings && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-4">
                  <TipSettings />
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Packages & Memberships Links */}
          {isBusinessUser && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.079 }} className="mb-6 space-y-3">
              <Link to="/business/packages" className="w-full bg-card rounded-2xl border border-border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><span className="text-lg">📦</span></div>
                  <div className="text-left">
                    <p className="font-medium">Service Packages</p>
                    <p className="text-sm text-muted-foreground">Sell prepaid session bundles</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link to="/business/memberships" className="w-full bg-card rounded-2xl border border-border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><span className="text-lg">💎</span></div>
                  <div className="text-left">
                    <p className="font-medium">Memberships</p>
                    <p className="text-sm text-muted-foreground">Recurring membership plans</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
              <Link to="/business/intake-forms" className="w-full bg-card rounded-2xl border border-border p-4 flex items-center justify-between hover:bg-muted/50 transition-colors block">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><span className="text-lg">📋</span></div>
                  <div className="text-left">
                    <p className="font-medium">Intake Forms</p>
                    <p className="text-sm text-muted-foreground">Client questionnaires & health forms</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </Link>
            </motion.div>
          )}

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="mb-6">
            <ChangePasswordSection />
          </motion.div>

          {/* Settings */}
          <div className="space-y-4">
            {/* Notifications */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Bell className="w-5 h-5 text-primary" /></div>
                  <div>
                    <p className="font-medium">{t('profile', 'pushNotifications')}</p>
                    <p className="text-sm text-muted-foreground">{t('profile', 'pushNotificationsDesc')}</p>
                  </div>
                </div>
                <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
              </div>
            </motion.div>

            {/* Appearance */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    {isDark ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <p className="font-medium">{t('profile', 'darkMode')}</p>
                    <p className="text-sm text-muted-foreground">{t('profile', 'darkModeDesc')}</p>
                  </div>
                </div>
                <Switch checked={isDark} onCheckedChange={toggleTheme} />
              </div>
            </motion.div>

            {/* Legal */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl border border-border overflow-hidden">
              <button onClick={() => navigate('/privacy')} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Shield className="w-5 h-5 text-primary" /></div>
                  <span className="font-medium">{t('profile', 'privacyPolicy')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              <Separator />
              <button onClick={() => navigate('/terms')} className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Globe className="w-5 h-5 text-primary" /></div>
                  <span className="font-medium">{t('profile', 'termsOfService')}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
            </motion.div>

            {/* Danger Zone */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-2xl border border-border overflow-hidden">
              <button onClick={handleSignOut} className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><LogOut className="w-5 h-5 text-destructive" /></div>
                <span className="font-medium text-destructive">{t('profile', 'signOut')}</span>
              </button>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left" disabled={isDeleting}>
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center"><Trash2 className="w-5 h-5 text-destructive" /></div>
                    <div>
                      <span className="font-medium text-destructive">{isDeleting ? t('profile', 'deleting') : t('profile', 'deleteAccount')}</span>
                      <p className="text-sm text-muted-foreground">{t('profile', 'deleteAccountDesc')}</p>
                    </div>
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('profile', 'deleteConfirmTitle')}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {t('profile', 'deleteConfirmDesc')}
                      {isBusinessUser && (
                        <span className="block mt-2 text-amber-600">{t('profile', 'deleteTrialNote')}</span>
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common', 'cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      {t('profile', 'deleteAccount')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default Profile;
