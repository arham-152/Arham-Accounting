import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, X, MessageSquare, Bot, User, Loader2 } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Transaction } from '../types';
import { cn, formatPKR } from '../lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIChatProps {
  transactions: Transaction[];
  isDarkMode: boolean;
}

export const AIChat: React.FC<AIChatProps> = ({ transactions, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Prepare simplified data context for Gemini
      const dataContext = transactions.map(t => ({
        date: t.date,
        name: t.name,
        amount: t.amount,
        type: t.type,
        category: t.category,
        subCategory: t.subCategory
      })).slice(-100); // Send last 100 transactions for context to keep within limits

      const systemPrompt = `You are "Account 2026 AI Assistant", a professional financial advisor.
        You have access to the user's recent financial transactions.
        Context: ${JSON.stringify(dataContext)}
        
        Guidelines:
        1. Be concise, professional, and helpful.
        2. Provide specific numbers from the data when asked.
        3. Offer insights into spending habits if relevant.
        4. Use PKR as the currency (₨).
        5. If you don't know the answer or the data isn't available, say so politely.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + "\n\nUser Question: " + input }] }
        ],
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I encountered an error connecting to my core. Please check your internet connection or try again later.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent-gold text-black rounded-full shadow-lg flex items-center justify-center group overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-full animate-ping" />
        <Sparkles size={24} className="relative z-10" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="fixed bottom-24 right-6 z-[60] w-[95vw] sm:w-[400px] h-[550px] bg-surface border border-border-hover rounded-3xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-border-main bg-surface-brighter flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent-gold/10 flex items-center justify-center text-accent-gold">
                  <Bot size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">AI Advisor</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] text-text-muted font-mono uppercase tracking-wider">Account 2026 Engine</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-surface-brightest rounded-xl text-text-muted transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 rounded-3xl bg-surface-brighter border border-border-main flex items-center justify-center text-accent-gold mb-4">
                    <Sparkles size={32} />
                  </div>
                  <h4 className="text-sm font-bold text-text-primary mb-2">How can I help you today?</h4>
                  <p className="text-xs text-text-muted leading-relaxed">
                    Ask me about your spending patterns, budget status, or for financial advice based on your ledger.
                  </p>
                  <div className="grid grid-cols-1 gap-2 w-full mt-6">
                    {['Top categories this month?', 'Am I over budget?', 'Spending trends?'].map(q => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="text-[10px] text-left px-3 py-2 border border-border-main rounded-xl hover:border-accent-gold hover:text-accent-gold transition-all text-text-muted font-mono"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m) => (
                <div
                  key={m.id}
                  className={cn(
                    "flex flex-col max-w-[85%]",
                    m.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                  )}
                >
                  <div
                    className={cn(
                      "p-3 rounded-2xl text-xs leading-relaxed",
                      m.role === 'user' 
                        ? "bg-accent-gold text-black rounded-tr-none" 
                        : "bg-surface-brighter border border-border-main text-text-primary rounded-tl-none font-sans"
                    )}
                  >
                    {m.content}
                  </div>
                  <span className="text-[8px] text-text-muted font-mono mt-1 px-1">
                    {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-accent-gold">
                  <Loader2 size={14} className="animate-spin" />
                  <span className="text-[10px] font-mono animate-pulse">Analyzing financials...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border-main bg-surface-brighter">
              <div className="relative flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask your financial assistant..."
                  className="flex-1 bg-surface border border-border-main text-text-primary text-xs px-4 py-3 rounded-2xl outline-none focus:border-accent-gold transition-colors placeholder:text-text-muted/50 font-sans"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-accent-gold text-black p-3 rounded-2xl hover:bg-yellow-500 transition-all disabled:opacity-50 disabled:scale-100 active:scale-95"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
