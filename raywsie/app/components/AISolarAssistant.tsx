import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Loader2, X, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AISolarAssistantProps {
  userContext?: {
    hasProjects: boolean;
    projectCount: number;
    totalSystemSize?: number;
    location?: string;
  };
}

const AISolarAssistant: React.FC<AISolarAssistantProps> = ({ userContext }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hi! I'm here to help with any questions about solar energy, your analysis results, or installation options. How can I assist you today? ☀️",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/solar-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          userContext
        })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.message,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorMessage: Message = {
          role: 'assistant',
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, I couldn't connect to the server. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-500/50 z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className={`fixed ${isMinimized ? 'bottom-6 right-6 w-80' : 'bottom-6 right-6 w-96'} shadow-2xl z-50 transition-all duration-300 border-orange-500/30`}>
      <CardHeader className="pb-3 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center text-white">
            <MessageCircle className="w-5 h-5 mr-2" />
            AI Solar Assistant
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-background">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white'
                      : 'bg-muted text-foreground border border-border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.role === 'user' ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {new Date(message.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3 border border-border">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    <span className="text-sm text-muted-foreground">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about solar energy..."
                disabled={loading}
                className="flex-1 px-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm disabled:opacity-50"
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={() => setInput("How do I calculate my ROI?")}
                className="text-xs px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full hover:bg-orange-500/20 transition-colors"
              >
                💰 Calculate ROI
              </button>
              <button
                onClick={() => setInput("What panels should I choose?")}
                className="text-xs px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full hover:bg-orange-500/20 transition-colors"
              >
                ☀️ Choose Panels
              </button>
              <button
                onClick={() => setInput("How much can I save?")}
                className="text-xs px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full hover:bg-orange-500/20 transition-colors"
              >
                📊 Savings
              </button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default AISolarAssistant;