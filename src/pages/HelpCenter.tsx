import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronDown, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

const HelpCenterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { t } = useTranslation();

  const faqs = [
    { question: t('helpCenter', 'faqBook'), answer: t('helpCenter', 'faqBookAnswer') },
    { question: t('helpCenter', 'faqCancel'), answer: t('helpCenter', 'faqCancelAnswer') },
    { question: t('helpCenter', 'faqList'), answer: t('helpCenter', 'faqListAnswer') },
    { question: t('helpCenter', 'faqPayments'), answer: t('helpCenter', 'faqPaymentsAnswer') },
    { question: t('helpCenter', 'faqReschedule'), answer: t('helpCenter', 'faqRescheduleAnswer') },
    { question: t('helpCenter', 'faqReview'), answer: t('helpCenter', 'faqReviewAnswer') },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError(t('helpCenter', 'fillRequired'));
      return;
    }
    setSending(true);
    setError('');
    try {
      const { error: dbError } = await supabase.from('support_inquiries').insert({
        customer_name: formData.name, customer_email: formData.email,
        subject: formData.subject || 'General Inquiry', message: formData.message,
      });
      if (dbError) throw dbError;
      await supabase.functions.invoke('send-support-email', {
        body: { name: formData.name, email: formData.email, subject: formData.subject || 'General Inquiry', message: formData.message },
      });
      setSent(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      toast({ title: t('helpCenter', 'messageSent'), description: t('helpCenter', 'willRespond') });
    } catch {
      setError(t('helpCenter', 'failedToSend'));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-24 md:pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              {t('helpCenter', 'title').split(' ')[0]} <span className="text-gradient">{t('helpCenter', 'title').split(' ').slice(1).join(' ')}</span>
            </h1>
            <p className="text-xl text-muted-foreground">{t('helpCenter', 'subtitle')}</p>
          </motion.div>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-12">
            <h2 className="font-display text-2xl font-bold mb-6">{t('helpCenter', 'faq')}</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-xl px-6 data-[state=open]:bg-muted/50">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="text-left font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.section>

          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="font-display text-2xl font-bold mb-6">{t('helpCenter', 'contactSupport')}</h2>
            {sent ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-primary" /></div>
                <h3 className="font-display text-xl font-bold mb-2">{t('helpCenter', 'messageSent')}</h3>
                <p className="text-muted-foreground mb-6">{t('helpCenter', 'willRespond')}</p>
                <Button onClick={() => setSent(false)} variant="outline">{t('helpCenter', 'sendAnother')}</Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('helpCenter', 'name')} <span className="text-destructive">*</span></label>
                    <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder={t('profile', 'yourName')} required />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('helpCenter', 'email')} <span className="text-destructive">*</span></label>
                    <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="your@email.com" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('helpCenter', 'subject')}</label>
                  <Select value={formData.subject} onValueChange={(value) => setFormData({ ...formData, subject: value })}>
                    <SelectTrigger><SelectValue placeholder={t('helpCenter', 'selectTopic')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">{t('helpCenter', 'bookingIssue')}</SelectItem>
                      <SelectItem value="account">{t('helpCenter', 'accountHelp')}</SelectItem>
                      <SelectItem value="business">{t('helpCenter', 'businessListing')}</SelectItem>
                      <SelectItem value="payment">{t('helpCenter', 'paymentQuestion')}</SelectItem>
                      <SelectItem value="feedback">{t('helpCenter', 'feedback')}</SelectItem>
                      <SelectItem value="other">{t('helpCenter', 'other')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t('helpCenter', 'message')} <span className="text-destructive">*</span></label>
                  <Textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} placeholder={t('helpCenter', 'howCanWeHelp')} rows={5} required />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit" disabled={sending} className="w-full bg-gradient-primary hover:opacity-90" size="lg">
                  {sending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('helpCenter', 'sending')}</>) : (<><MessageSquare className="w-4 h-4 mr-2" />{t('helpCenter', 'sendMessage')}</>)}
                </Button>
              </form>
            )}
          </motion.section>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default HelpCenterPage;
