import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, Check, CheckCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Message, Conversation } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble = ({ message, isOwn }: MessageBubbleProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    className={cn("flex", isOwn ? "justify-end" : "justify-start")}
  >
    <div className={cn(
      "max-w-[75%] px-4 py-3 rounded-2xl",
      isOwn 
        ? "bg-gradient-primary text-primary-foreground rounded-br-md" 
        : "bg-muted text-foreground rounded-bl-md"
    )}>
      <p className="text-sm">{message.content}</p>
      <div className={cn(
        "flex items-center gap-1 mt-1",
        isOwn ? "justify-end" : "justify-start"
      )}>
        <span className={cn(
          "text-xs",
          isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {new Date(message.createdAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}
        </span>
        {isOwn && (
          message.isRead 
            ? <CheckCheck className="w-4 h-4 text-primary-foreground/70" />
            : <Check className="w-4 h-4 text-primary-foreground/70" />
        )}
      </div>
    </div>
  </motion.div>
);

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  otherUserName: string;
  otherUserPhoto?: string;
}

const ConversationItem = ({ 
  conversation, 
  isActive, 
  onClick,
  otherUserName,
  otherUserPhoto
}: ConversationItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
      isActive ? "bg-primary/10" : "hover:bg-muted"
    )}
  >
    <div className="relative">
      <Avatar className="w-12 h-12">
        <AvatarImage src={otherUserPhoto} alt={otherUserName} />
        <AvatarFallback className="bg-secondary text-secondary-foreground">
          {otherUserName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      {conversation.unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
          {conversation.unreadCount}
        </span>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className={cn("font-medium truncate", isActive && "text-primary")}>
          {otherUserName}
        </span>
        <span className="text-xs text-muted-foreground">
          {new Date(conversation.lastMessageAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <p className="text-sm text-muted-foreground truncate mt-0.5">
        {conversation.lastMessage}
      </p>
    </div>
  </button>
);

interface MessagingPanelProps {
  conversations: Conversation[];
  messages: Message[];
  currentUserId: string;
  onSendMessage?: (conversationId: string, content: string) => void;
}

export const MessagingPanel = ({ 
  conversations, 
  messages, 
  currentUserId,
  onSendMessage 
}: MessagingPanelProps) => {
  const [activeConversationId, setActiveConversationId] = useState(conversations[0]?.id);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const conversationMessages = messages.filter(m => m.conversationId === activeConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages]);

  const handleSend = () => {
    if (!newMessage.trim() || !activeConversationId) return;
    onSendMessage?.(activeConversationId, newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[600px] bg-card rounded-2xl border border-border overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-display text-lg font-semibold">Messages</h2>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {conversations.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === activeConversationId}
                onClick={() => setActiveConversationId(conv.id)}
                otherUserName={`Client ${conv.clientId.slice(-4)}`}
                otherUserPhoto={`https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100`}
              />
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex items-center gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" />
                <AvatarFallback>C</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Client {activeConversation.clientId.slice(-4)}</p>
                <p className="text-xs text-muted-foreground">Active now</p>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <AnimatePresence>
                  {conversationMessages.map((msg) => (
                    <MessageBubble 
                      key={msg.id} 
                      message={msg} 
                      isOwn={msg.senderId === currentUserId}
                    />
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Paperclip className="w-5 h-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 rounded-xl"
                />
                <Button variant="ghost" size="icon" className="text-muted-foreground">
                  <Smile className="w-5 h-5" />
                </Button>
                <Button 
                  size="icon" 
                  className="bg-gradient-primary hover:opacity-90 rounded-xl"
                  onClick={handleSend}
                  disabled={!newMessage.trim()}
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
};
