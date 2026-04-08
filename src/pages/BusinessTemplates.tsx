import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Mail, MessageSquare, Camera, Printer, Search, Copy, Check, Lightbulb, CalendarDays, Smartphone, MessageCircle } from 'lucide-react';

export default function BusinessTemplates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [business, setBusiness] = useState<{ id: string; name: string } | null>(null);
  const [copiedId, setCopiedId] = useState('');

  useEffect(() => {
    if (!user) return;
    supabase.from('businesses').select('id, name').eq('owner_id', user.id).maybeSingle()
      .then(({ data }) => setBusiness(data));
  }, [user]);

  const bookingUrl = business ? `${window.location.origin}/business/${business.id}` : '[your Polished link]';
  const businessName = business?.name || 'Your Business Name';

  const TEMPLATES = [
    {
      id: 'email_announcement', type: 'Email', icon: Mail, label: 'Client Announcement Email',
      subject: `We've moved our booking to Polished — book your next appointment here`,
      body: `Hi [Client Name],\n\nWe have some exciting news — we've moved our online booking to Polished, a new beauty and wellness platform that makes it easier than ever to book with us.\n\nHere's what you need to know:\n• You can now book appointments at: ${bookingUrl}\n• Create a free account in under 2 minutes\n• Your appointment history and preferences carry over\n\nBook your next appointment here: ${bookingUrl}\n\nAs always, thank you for your continued support. We can't wait to see you!\n\nWarmly,\n${businessName}`,
    },
    {
      id: 'sms_short', type: 'SMS', icon: MessageSquare, label: 'Short SMS Message',
      body: `Hi! ${businessName} has moved to Polished for online booking. Book your next appt here: ${bookingUrl} — it only takes 2 min to set up your account! 😊`,
    },
    {
      id: 'sms_reminder', type: 'SMS', icon: MessageSquare, label: 'SMS Rebooking Reminder',
      body: `Hey [Name]! It's been a while — we miss you! 🌸 We've moved our booking to Polished. Book your next appointment easily at ${bookingUrl}`,
    },
    {
      id: 'instagram_caption', type: 'Social', icon: Camera, label: 'Instagram Caption',
      body: `📣 BIG NEWS! We've officially moved to Polished for all online booking!\n\n✨ Booking is now easier than ever\n📅 Book anytime, anywhere\n💳 Pay securely online\n🎁 Earn loyalty points on every visit\n\nTap the link in our bio to book your next appointment, or visit:\n${bookingUrl}\n\nWe can't wait to see you! 💕\n\n#Polished #BookNow #NewBookingSystem`,
    },
    {
      id: 'instagram_story', type: 'Social', icon: Camera, label: 'Instagram Story Text',
      body: `🚨 WE MOVED! 🚨\n\nNew booking platform = easier booking for YOU!\n\nTap the link in bio to book 👆\n\n${bookingUrl}`,
    },
    {
      id: 'google_bio', type: 'Profile', icon: Search, label: 'Google Business Update',
      body: `${businessName} now accepts online bookings through Polished — a modern beauty and wellness booking platform. Book your appointment 24/7 at ${bookingUrl}. Create your free account in minutes and start earning loyalty points on every visit.`,
    },
    {
      id: 'email_follow_up', type: 'Email', icon: Mail, label: 'Follow-Up Email (for non-bookers)',
      subject: `A quick reminder — book your next appointment with us on Polished`,
      body: `Hi [Client Name],\n\nJust a friendly reminder that we've moved our booking system to Polished!\n\nIf you haven't had a chance to check it out yet, here's the link to book your next appointment:\n👉 ${bookingUrl}\n\nIt's quick and easy — create your account in under 2 minutes, and you'll be able to:\n• Book anytime, even outside our business hours\n• Receive automatic appointment reminders\n• Earn loyalty points on every visit\n• Pay securely online\n\nWe'd love to see you again soon!\n\n${businessName}`,
    },
    {
      id: 'in_store_sign', type: 'Print', icon: Printer, label: 'In-Store Sign / Card Text',
      body: `WE'VE MOVED ONLINE! 📱\n\nBook your next appointment on Polished:\n\n${bookingUrl}\n\n✅ Book 24/7\n✅ Secure online payment\n✅ Automatic reminders\n✅ Earn loyalty points\n\nScan the QR code or visit the link above`,
    },
  ];

  function copyTemplate(template: typeof TEMPLATES[0]) {
    const text = template.subject ? `Subject: ${template.subject}\n\n${template.body}` : template.body;
    navigator.clipboard.writeText(text);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(''), 2000);
    toast({ title: 'Template copied to clipboard!' });
  }

  const groups: Record<string, typeof TEMPLATES> = {};
  TEMPLATES.forEach(t => { (groups[t.type] = groups[t.type] || []).push(t); });

  const groupIcons: Record<string, any> = { Email: Mail, SMS: MessageSquare, Social: Camera, Profile: Search, Print: Printer };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Mail className="w-6 h-6" /> Client Communication Templates</h1>
          <p className="text-muted-foreground text-sm mt-1">Ready-to-use messages to tell your clients about your move to Polished</p>
        </div>

        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl mb-6 text-sm text-muted-foreground">
          These templates are pre-written and personalized with your business name and booking link. Copy any template, customize it with your client's name where indicated, and send.
          {!business && <p className="mt-2 text-xs">⏳ Loading your booking link...</p>}
        </div>

        {Object.entries(groups).map(([type, templates]) => {
          const Icon = groupIcons[type] || Mail;
          return (
            <div key={type} className="mb-8">
              <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><Icon className="w-5 h-5" /> {type}</h2>
              <div className="space-y-4">
                {templates.map(template => {
                  const TIcon = template.icon;
                  return (
                    <Card key={template.id}>
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/50">
                        <span className="font-semibold text-sm">{template.label}</span>
                        <Button size="sm" variant={copiedId === template.id ? "default" : "outline"} onClick={() => copyTemplate(template)}
                          className={cn(copiedId === template.id && "bg-green-500 hover:bg-green-500")}>
                          {copiedId === template.id ? <><Check className="w-3.5 h-3.5 mr-1" /> Copied!</> : <><Copy className="w-3.5 h-3.5 mr-1" /> Copy</>}
                        </Button>
                      </div>
                      {template.subject && (
                        <div className="px-4 py-2.5 bg-blue-500/5 border-b border-border text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">Subject:</span> {template.subject}
                        </div>
                      )}
                      <CardContent className="p-4">
                        <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans max-h-[220px] overflow-y-auto">{template.body}</pre>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}

        <Card className="mt-8">
          <CardContent className="p-6">
            <h3 className="font-bold flex items-center gap-2 mb-5"><Lightbulb className="w-5 h-5" /> Tips for a Smooth Transition</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: CalendarDays, title: 'Give 2 weeks notice', desc: 'Send the announcement email at least 2 weeks before you fully switch so clients have time to create their account.' },
                { icon: Smartphone, title: 'Post on social media', desc: 'Post the Instagram caption and story text on the same day you send the email for maximum visibility.' },
                { icon: Printer, title: 'Print the in-store sign', desc: 'Place a sign at your station and front desk. Clients who see it in person are very likely to scan and book.' },
                { icon: MessageCircle, title: 'Follow up with SMS', desc: 'Send a short SMS reminder 1 week after the email to clients who haven\'t booked yet.' },
              ].map(tip => (
                <div key={tip.title} className="bg-muted/50 rounded-xl p-4">
                  <tip.icon className="w-7 h-7 text-primary mb-2" />
                  <h4 className="font-semibold text-sm mb-1">{tip.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{tip.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
