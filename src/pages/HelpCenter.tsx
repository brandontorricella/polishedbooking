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

const faqs = [
  {
    question: 'How do I book an appointment?',
    answer: "Find a business you like, view their profile, and tap 'Book Now' to select a service and time.",
  },
  {
    question: 'How do I cancel a booking?',
    answer: "Go to your Bookings page, find the appointment, and tap 'Cancel Appointment'. Note that cancellation policies may vary by business.",
  },
  {
    question: 'How do I list my business?',
    answer: "Tap 'For Businesses' in the footer, then 'List Your Business' to start your free 14-day trial. No credit card required.",
  },
  {
    question: 'How do payments work?',
    answer: "Payments are handled securely through our platform. You can pay with credit/debit cards. Some businesses may also accept cash at the appointment.",
  },
  {
    question: 'Can I reschedule my appointment?',
    answer: "Yes! Go to your Bookings page, find the appointment, and tap 'Reschedule'. Rescheduling policies vary by business.",
  },
  {
    question: 'How do I leave a review?',
    answer: "After your appointment is completed, you'll receive a prompt to leave a review. You can also go to the business profile and tap 'Write a Review' if you have a completed booking.",
  },
];

const HelpCenterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields');
      return;
    }

    setSending(true);
    setError('');

    try {
      // Save to database
      const { error: dbError } = await supabase
        .from('support_inquiries')
        .insert({
          customer_name: formData.name,
          customer_email: formData.email,
          subject: formData.subject || 'General Inquiry',
          message: formData.message,
        });

      if (dbError) throw dbError;

      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke('send-support-email', {
        body: {
          name: formData.name,
          email: formData.email,
          subject: formData.subject || 'General Inquiry',
          message: formData.message,
        },
      });

      if (emailError) {
        console.error('Email send error:', emailError);
        // Still mark as sent since the inquiry was saved
      }

      setSent(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      
      toast({
        title: 'Message sent!',
        description: "We'll get back to you within 24 hours.",
      });
    } catch (err) {
      console.error('Submit error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-24 pb-24 md:pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Help <span className="text-gradient">Center</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              We're here to help! Send us a message and we'll respond within 24 hours.
            </p>
          </motion.div>

          {/* FAQ Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="font-display text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-border rounded-xl px-6 data-[state=open]:bg-muted/50"
                >
                  <AccordionTrigger className="hover:no-underline">
                    <span className="text-left font-medium">{faq.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.section>

          {/* Contact Form */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="font-display text-2xl font-bold mb-6">Contact Support</h2>
            
            {sent ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-2">Message Sent!</h3>
                <p className="text-muted-foreground mb-6">
                  We'll get back to you within 24 hours.
                </p>
                <Button onClick={() => setSent(false)} variant="outline">
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Email <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => setFormData({ ...formData, subject: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a topic..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="booking">Booking Issue</SelectItem>
                      <SelectItem value="account">Account Help</SelectItem>
                      <SelectItem value="business">Business Listing</SelectItem>
                      <SelectItem value="payment">Payment Question</SelectItem>
                      <SelectItem value="feedback">Feedback</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Message <span className="text-destructive">*</span>
                  </label>
                  <Textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="How can we help?"
                    rows={5}
                    required
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-gradient-primary hover:opacity-90"
                  size="lg"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
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
