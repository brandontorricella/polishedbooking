import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';

type Conversation = Tables<'conversations'>;
type Message = Tables<'messages'>;

interface ConversationWithBusiness extends Conversation {
  businesses?: {
    id: string;
    name: string;
    profile_photo_url: string | null;
  };
}

export const useMessages = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [conversations, setConversations] = useState<ConversationWithBusiness[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownedBusinessId, setOwnedBusinessId] = useState<string | null>(null);

  // Resolve owned business for business users
  useEffect(() => {
    if (!user || profile?.role !== 'business') {
      setOwnedBusinessId(null);
      return;
    }
    const fetchBiz = async () => {
      const { data } = await supabase
        .from('businesses')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)
        .maybeSingle();
      setOwnedBusinessId(data?.id || null);
    };
    fetchBiz();
  }, [user, profile?.role]);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!user) return;

    try {
      // Build OR filter: client conversations + business owner conversations
      const filters = [`client_id.eq.${user.id}`];
      if (ownedBusinessId) {
        filters.push(`business_id.eq.${ownedBusinessId}`);
      }

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          businesses:business_id (
            id,
            name,
            profile_photo_url
          )
        `)
        .or(filters.join(','))
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [user, ownedBusinessId]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (conversationId: string, content: string) => {
    if (!user || !content.trim()) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Update conversation last message
      await supabase
        .from('conversations')
        .update({
          last_message: content.trim(),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId);

      return data;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user, toast]);

  // Get or create conversation
  const getOrCreateConversation = useCallback(async (businessId: string) => {
    if (!user) return null;

    try {
      // Check for existing conversation
      const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', user.id)
        .eq('business_id', businessId)
        .maybeSingle();

      if (existing) return existing;

      // Create new conversation
      const { data, error } = await supabase
        .from('conversations')
        .insert({
          client_id: user.id,
          business_id: businessId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start conversation. Please try again.',
        variant: 'destructive',
      });
      return null;
    }
  }, [user, toast]);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }, [user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !activeConversationId) return;

    const channel = supabase
      .channel(`messages:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeConversationId]);

  // Initial fetch
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Fetch messages when active conversation changes
  useEffect(() => {
    if (activeConversationId) {
      fetchMessages(activeConversationId);
      markAsRead(activeConversationId);
    }
  }, [activeConversationId, fetchMessages, markAsRead]);

  return {
    conversations,
    messages,
    activeConversationId,
    setActiveConversationId,
    sendMessage,
    getOrCreateConversation,
    loading,
    refetch: fetchConversations,
  };
};
