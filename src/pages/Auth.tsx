import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Sparkles, Check, ArrowLeft } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

const AuthPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading, signUp, signIn } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const { t } = useTranslation();

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  const [loginError, setLoginError] = useState('');
  const [signupError, setSignupError] = useState('');

  const passwordRequirements = [
    { regex: /.{8,}/, label: t('auth', 'atLeast8') },
    { regex: /[A-Z]/, label: t('auth', 'oneUppercase') },
    { regex: /[a-z]/, label: t('auth', 'oneLowercase') },
    { regex: /[0-9]/, label: t('auth', 'oneNumber') },
  ];

  const passwordChecks = passwordRequirements.map(req => ({
    ...req,
    valid: req.regex.test(signupPassword),
  }));

  useEffect(() => {
    if (user && !loading && !adminLoading) {
      if (isAdmin) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [user, loading, adminLoading, isAdmin, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      emailSchema.parse(loginEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setLoginError(err.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    if (error) {
      setLoginError(error.message);
    }
    setIsLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    
    try {
      emailSchema.parse(signupEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setSignupError(err.errors[0].message);
        return;
      }
    }

    if (passwordChecks.some(c => !c.valid)) {
      setSignupError(t('auth', 'passwordRequirements'));
      return;
    }

    if (!acceptTerms) {
      setSignupError(t('auth', 'mustAcceptTerms'));
      return;
    }
    
    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, displayName || undefined);
    if (!error) {
      navigate('/');
    } else {
      setSignupError(error.message);
    }
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft className="w-4 h-4" />
            {t('auth', 'backToHome')}
          </Link>

          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-semibold text-gradient">Polished</span>
          </div>

          <Tabs defaultValue={searchParams.get('mode') === 'signup' ? 'signup' : 'login'} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t('nav', 'login')}</TabsTrigger>
              <TabsTrigger value="signup">{t('nav', 'signUp')}</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login" className="space-y-6">
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold">{t('auth', 'welcomeBack')}</h1>
                <p className="text-muted-foreground">{t('auth', 'enterCredentials')}</p>
              </div>

              <GoogleSignInButton />

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t('auth', 'orSignInEmail')}</span>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('auth', 'email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="login-email" 
                      type="email" 
                      placeholder="you@example.com"
                      className="pl-10 h-12"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="login-password">{t('auth', 'password')}</Label>
                    <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                      {t('auth', 'forgotPassword')}
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="login-password" 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-12"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {loginError && (
                  <p className="text-sm text-destructive">{loginError}</p>
                )}

                <Button 
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90 h-12" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles className="w-5 h-5" />
                      </motion.span>
                      {t('auth', 'signingIn')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('auth', 'loginBtn')} <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* Sign Up Tab */}
            <TabsContent value="signup" className="space-y-6">
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-bold">{t('auth', 'createAccount')}</h1>
                <p className="text-muted-foreground">{t('auth', 'createAccountDesc')}</p>
              </div>

              <GoogleSignInButton label={t('auth', 'googleSignup')} />

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">{t('auth', 'orSignUpEmail')}</span>
                </div>
              </div>

              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">{t('auth', 'fullName')}</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="signup-name" 
                      type="text" 
                      placeholder={t('profile', 'yourName')}
                      className="pl-10 h-12"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-email">{t('auth', 'email')}</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="signup-email" 
                      type="email" 
                      placeholder="you@example.com"
                      className="pl-10 h-12"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password">{t('auth', 'password')}</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input 
                      id="signup-password" 
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      className="pl-10 pr-10 h-12"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {passwordChecks.map((check) => (
                      <div 
                        key={check.label}
                        className={cn(
                          "flex items-center gap-1.5 text-xs",
                          check.valid ? "text-emerald-600" : "text-muted-foreground"
                        )}
                      >
                        <Check className={cn("w-3.5 h-3.5", !check.valid && "opacity-50")} />
                        {check.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  />
                  <label htmlFor="terms" className="text-sm text-muted-foreground leading-tight">
                    {t('auth', 'acceptTerms')}{' '}
                    <Link to="/terms" className="text-primary hover:underline">{t('auth', 'termsOfService')}</Link>
                    {' '}{t('auth', 'and')}{' '}
                    <Link to="/privacy" className="text-primary hover:underline">{t('auth', 'privacyPolicy')}</Link>
                  </label>
                </div>

                {signupError && (
                  <p className="text-sm text-destructive">{signupError}</p>
                )}

                <Button 
                  type="submit"
                  className="w-full bg-gradient-primary hover:opacity-90 h-12" 
                  disabled={isLoading || !acceptTerms || passwordChecks.some(c => !c.valid)}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                        <Sparkles className="w-5 h-5" />
                      </motion.span>
                      {t('auth', 'creatingAccount')}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('auth', 'signupBtn')} <ArrowRight className="w-5 h-5" />
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* Right Panel - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20" />
        <img 
          src="https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200"
          alt="Beauty salon"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-12 text-cream">
          <blockquote className="text-2xl font-display italic mb-4">
            {t('testimonial', 'quote')}
          </blockquote>
          <div className="flex items-center gap-3">
            <img 
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100"
              alt="Testimonial"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <p className="font-semibold">Sarah Johnson</p>
              <p className="text-cream/70 text-sm">Glamour Studio, Los Angeles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
