import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Loader2, Sparkles } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessageToGemini } from '../services/geminiService';

export const HerbalChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '0',
      role: 'model',
      text: 'नमस्ते! I am Veda, your herbal expert. How can I help you heal naturally today? 🌿'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Filter messages for history (remove error flags if any)
    const history = messages.map(m => ({ role: m.role, text: m.text }));

    const responseText = await sendMessageToGemini(userMsg.text, history);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText
    };

    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 flex items-center gap-2 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100 bg-earth-800 text-white'
        }`}
      >
        <Sparkles className="h-5 w-5" />
        <span className="font-medium pr-1">Ask Veda</span>
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-6 right-6 z-50 w-full max-w-[350px] bg-white rounded-2xl shadow-2xl transition-all duration-300 origin-bottom-right flex flex-col border border-earth-100 overflow-hidden ${
          isOpen 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-8 pointer-events-none'
        }`}
        style={{ maxHeight: '600px', height: '80vh' }}
      >
        {/* Header */}
        <div className="bg-earth-800 p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <div className="bg-herb-400 p-1.5 rounded-full">
              <Sparkles className="h-4 w-4 text-earth-900" />
            </div>
            <div>
              <h3 className="font-bold">Veda Assistant</h3>
              <p className="text-xs text-earth-200">Ayurvedic Expert</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-earth-200 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-earth-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-earth-700 text-white rounded-tr-none'
                    : 'bg-white text-earth-900 border border-earth-100 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-earth-100 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                <Loader2 className="h-5 w-5 animate-spin text-earth-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-earth-100">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about herbs..."
              className="flex-1 bg-earth-50 border-transparent focus:border-herb-300 focus:bg-white focus:ring-0 rounded-full py-2 px-4 text-sm transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="p-2 bg-herb-600 text-white rounded-full hover:bg-herb-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
