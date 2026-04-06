import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ArrowLeft, MessageCircle, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useAccountType } from '@/hooks/useAccountType';
import { supabase } from '@/integrations/supabase/client';

// ─── Helpers ────────────────────────────────────────────
function formatRelativeTime(dateStr: string) {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  if (hrs < 24) return `${hrs}h`;
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true });
}

// ─── Types ──────────────────────────────────────────────
interface ConversationDisplay {
  id: string;
  otherName: string;
  otherPhoto: string | null;
  otherProfileLink?: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  isBusinessSide: boolean;
}

const MessagesPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { accountType, businessId: ownerBusinessId } = useAccountType();
  const {
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    loading,
    refetch,
  } = useMessages();

  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationDisplays, setConversationDisplays] = useState<ConversationDisplay[]>([]);
  const [loadingDisplays, setLoadingDisplays] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isBusiness = profile?.role === 'business';

  // Handle deep link ?conversation=xxx
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId) {
      setActiveConversationId(convId);
    }
  }, [searchParams, setActiveConversationId]);

  // Build display data for each conversation (resolve names)
  useEffect(() => {
    if (!user || conversations.length === 0) {
      setConversationDisplays([]);
      setLoadingDisplays(false);
      return;
    }

    const build = async () => {
      setLoadingDisplays(true);
      const displays: ConversationDisplay[] = [];

      for (const conv of conversations) {
        const isBusinessSide = isBusiness && conv.business_id === ownerBusinessId;

        if (isBusinessSide) {
          // Business viewing: show customer info
          const { data: clientProfile } = await supabase
            .from('profiles')
            .select('display_name, profile_photo_url')
            .eq('user_id', conv.client_id)
            .maybeSingle();

          displays.push({
            id: conv.id,
            otherName: clientProfile?.display_name || 'Customer',
            otherPhoto: clientProfile?.profile_photo_url || null,
            lastMessage: conv.last_message,
            lastMessageAt: conv.last_message_at,
            isBusinessSide: true,
          });
        } else {
          // Customer viewing: show business info
          const { data: biz } = await supabase
            .from('businesses')
            .select('id, name, profile_photo_url')
            .eq('id', conv.business_id)
            .maybeSingle();

          displays.push({
            id: conv.id,
            otherName: biz?.name || 'Business',
            otherPhoto: biz?.profile_photo_url || null,
            otherProfileLink: biz ? `/business/${biz.id}` : undefined,
            lastMessage: conv.last_message,
            lastMessageAt: conv.last_message_at,
            isBusinessSide: false,
          });
        }
      }

      setConversationDisplays(displays);
      setLoadingDisplays(false);
    };

    build();
  }, [conversations, user, isBusiness, ownerBusinessId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeConversationId || sending) return;
    setSending(true);
    const content = newMessage;
    setNewMessage('');
    try {
      await sendMessage(activeConversationId, content);
      refetch();
    } catch {
      setNewMessage(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const activeDisplay = conversationDisplays.find(d => d.id === activeConversationId);

  if (loading || loadingDisplays) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24 md:pb-8">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="mb-8">
              <Skeleton className="h-9 w-40" />
              <Skeleton className="h-5 w-64 mt-2" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // ─── Active Chat View ─────────────────────────────────
  if (activeConversationId && activeDisplay) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="pt-20 pb-24 md:pb-8 flex-1 flex flex-col max-w-4xl mx-auto w-full">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => {
                setActiveConversationId(null);
                navigate('/messages', { replace: true });
              }}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Avatar className="w-10 h-10">
              <AvatarImage src={activeDisplay.otherPhoto || undefined} />
              <AvatarFallback className="bg-secondary text-secondary-foreground">
                {activeDisplay.otherName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{activeDisplay.otherName}</p>
              {activeDisplay.otherProfileLink && (
                <button
                  onClick={() => navigate(activeDisplay.otherProfileLink!)}
                  className="text-xs text-primary hover:underline"
                >
                  View Profile
                </button>
              )}
            </div>
          </div>

          {/* Messages Area */}
          <ScrollArea className="flex-1 px-4 py-4">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map(msg => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                      >
                        <div className={cn(
                          "max-w-[75%] px-4 py-3 rounded-2xl",
                          isOwn
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        )}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                          <div className={cn(
                            "flex items-center gap-1 mt-1",
                            isOwn ? "justify-end" : "justify-start"
                          )}>
                            <span className={cn(
                              "text-xs",
                              isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {formatTime(msg.created_at)}
                            </span>
                            {isOwn && msg.is_read && (
                              <span className="text-xs text-primary-foreground/70">✓✓</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="px-4 py-3 border-t border-border bg-card">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 rounded-full"
              />
              <Button
                size="icon"
                className="rounded-full bg-primary hover:bg-primary/90 shrink-0"
                onClick={handleSend}
                disabled={!newMessage.trim() || sending}
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // ─── Conversations List View ──────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-2">
              {isBusiness
                ? 'Manage conversations with your clients'
                : 'Connect with businesses and manage your conversations'}
            </p>
          </div>

          {conversationDisplays.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
              <p className="text-sm">
                {isBusiness
                  ? "When customers message you, they'll appear here."
                  : 'Start a conversation by tapping "Message" on a business profile.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {conversationDisplays.map(conv => (
                <motion.button
                  key={conv.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full flex items-center gap-4 p-4 bg-card border border-border rounded-xl text-left hover:border-primary/50 transition-colors"
                  onClick={() => {
                    setActiveConversationId(conv.id);
                    navigate(`/messages?conversation=${conv.id}`, { replace: true });
                  }}
                >
                  <Avatar className="w-12 h-12 shrink-0">
                    <AvatarImage src={conv.otherPhoto || undefined} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground">
                      {conv.otherName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{conv.otherName}</span>
                      {conv.lastMessageAt && (
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatRelativeTime(conv.lastMessageAt)}
                        </span>
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default MessagesPage;
