import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { sendChatMessage, ChatMessage } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Paperclip, Send } from 'lucide-react'; // Send icon

const ChatbotPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      // Initial greeting from bot
      setMessages([{ role: 'assistant', content: "Hi! I'm your travel assistant. How can I help you today?" }]);
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent<HTMLFormElement>) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: inputMessage };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Pass only relevant history (e.g., last N messages or summarize) if needed for token limits
      const historyForApi = messages.slice(-10); // Example: send last 10 messages as history
      const response = await sendChatMessage(userMessage.content, historyForApi);
      const botMessage: ChatMessage = { role: 'assistant', content: response.response };
      setMessages((prevMessages) => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isAuthenticated) { // Should be handled by useEffect redirect, but as a fallback
    return null;
  }

  return (
    <div className="container mx-auto pt-24 pb-16 min-h-screen flex flex-col h-[calc(100vh-10rem)]"> {/* Adjust height as needed */}
      <h1 className="text-3xl font-semibold mb-6 text-center">Chatbot Assistant</h1>
      
      <ScrollArea className="flex-grow p-4 border rounded-md mb-4 bg-gray-50" ref={scrollAreaRef as any}>
        {messages.map((msg, index) => (
          <div key={index} className={`mb-3 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[70%] ${
              msg.role === 'user' 
                ? 'bg-hotel-600 text-white' 
                : 'bg-white border border-gray-200 text-gray-800'
            }`}>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="mb-3 flex justify-start">
            <div className="p-3 rounded-lg bg-white border border-gray-200 text-gray-800">
              <p className="text-sm italic">Assistant is typing...</p>
            </div>
          </div>
        )}
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-2 border-t">
        {/* File attachment button - non-functional for now */}
        <Button type="button" variant="ghost" size="icon" className="text-gray-500 hover:text-hotel-600">
          <Paperclip size={20} />
        </Button>
        <Input
          type="text"
          placeholder="Type your message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          className="flex-grow"
          disabled={isLoading}
        />
        <Button type="submit" disabled={isLoading || !inputMessage.trim()} className="bg-hotel-600 hover:bg-hotel-700">
          <Send size={18} className="mr-0 md:mr-2"/> <span className="hidden md:inline">Send</span>
        </Button>
      </form>
    </div>
  );
};

export default ChatbotPage;
