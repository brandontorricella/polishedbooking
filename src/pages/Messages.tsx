import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { BottomNav } from '@/components/layout/BottomNav';
import { MessagingPanel } from '@/components/messaging/MessagingPanel';
import { mockConversations, mockMessages } from '@/data/mockData';

const MessagesPage = () => {
  const handleSendMessage = (conversationId: string, content: string) => {
    console.log('Sending message:', { conversationId, content });
    // In a real app, this would send the message to the backend
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-2">
              Connect with businesses and manage your conversations
            </p>
          </div>

          <MessagingPanel 
            conversations={mockConversations}
            messages={mockMessages}
            currentUserId="client_user"
            onSendMessage={handleSendMessage}
          />
        </div>
      </main>

      <Footer />
      <BottomNav />
    </div>
  );
};

export default MessagesPage;
