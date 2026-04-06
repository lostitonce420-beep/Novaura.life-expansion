import { useState, useEffect, useRef } from 'react';
import { getGeminiClient } from '../lib/gemini';
import { ThinkingLevel, FunctionDeclaration, Type } from '@google/genai';
import Markdown from 'react-markdown';
import { Send, Bot, User, Zap, Brain, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '../components/Layout';
import { useNavigate } from 'react-router-dom';

type Message = {
  role: 'user' | 'model';
  content: string;
};

type ModelType = 'gemini-3.1-flash-lite-preview' | 'gemini-3-flash-preview' | 'gemini-3.1-pro-preview' | 'gemini-3.1-pro-preview-thinking';

const CHAT_HISTORY_KEY = 'novaura_chat_history';

const navigateFunctionDeclaration: FunctionDeclaration = {
  name: 'navigateTo',
  description: 'Navigate the user to a specific page in the application.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      path: {
        type: Type.STRING,
        description: 'The path to navigate to. Valid paths: / (Dashboard), /chat (Gemini Chat), /image (Image Studio), /video (Video Studio), /audio (Audio & Music), /voice (Voice Live), /analysis (Analysis), /grounding (Grounding), /cloud (Cloud Manager)',
      },
    },
    required: ['path'],
  },
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelType>('gemini-3-flash-preview');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem(CHAT_HISTORY_KEY);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }
  }, []);

  // Save history on change
  useEffect(() => {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const clearHistory = () => {
    if (window.confirm('Are you sure you want to clear your chat history?')) {
      setMessages([]);
      localStorage.removeItem(CHAT_HISTORY_KEY);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const ai = getGeminiClient();
      
      let modelToUse = selectedModel === 'gemini-3.1-pro-preview-thinking' ? 'gemini-3.1-pro-preview' : selectedModel;
      
      const chat = ai.chats.create({
        model: modelToUse,
        config: {
          systemInstruction: "You are Novaura's intelligent assistant. You have full semantic execution capabilities. You can navigate the user to different parts of the app using the navigateTo tool. Be helpful, concise, and creative.",
          thinkingConfig: selectedModel === 'gemini-3.1-pro-preview-thinking' ? { thinkingLevel: ThinkingLevel.HIGH } : undefined,
          tools: [{ functionDeclarations: [navigateFunctionDeclaration] }],
        }
      });

      // Replay history for context
      for (const msg of messages) {
        await chat.sendMessage({ message: msg.content });
      }

      const response = await chat.sendMessage({ message: userMessage });
      
      let responseText = response.text || '';

      // Handle function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        for (const call of response.functionCalls) {
          if (call.name === 'navigateTo') {
            const path = call.args?.path as string;
            if (path) {
              navigate(path);
              responseText += `\n\n*Navigating you to ${path}...*`;
            }
          }
        }
      }
      
      setMessages((prev) => [...prev, { role: 'model', content: responseText }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { role: 'model', content: `**Error:** ${error instanceof Error ? error.message : 'Unknown error occurred'}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 bg-zinc-950/50 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Bot className="text-indigo-400" />
          <h2 className="font-semibold">Novaura Assistant</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
            <button
              onClick={() => setSelectedModel('gemini-3.1-flash-lite-preview')}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors", selectedModel === 'gemini-3.1-flash-lite-preview' ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200")}
            >
              <Zap size={14} /> Lite
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3-flash-preview')}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors", selectedModel === 'gemini-3-flash-preview' ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200")}
            >
              <Sparkles size={14} /> Flash
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors", selectedModel === 'gemini-3.1-pro-preview' ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200")}
            >
              <Brain size={14} /> Pro
            </button>
            <button
              onClick={() => setSelectedModel('gemini-3.1-pro-preview-thinking')}
              className={cn("px-3 py-1.5 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors", selectedModel === 'gemini-3.1-pro-preview-thinking' ? "bg-indigo-500/20 text-indigo-300" : "text-zinc-400 hover:text-zinc-200")}
            >
              <Brain size={14} className="text-indigo-400" /> High Thinking
            </button>
          </div>
          <button 
            onClick={clearHistory}
            title="Clear History"
            className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-4">
            <Bot size={48} className="text-zinc-800" />
            <p>Start a conversation with Novaura</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-indigo-500" : "bg-zinc-800")}>
                {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className={cn("max-w-[80%] rounded-2xl px-5 py-3", msg.role === 'user' ? "bg-indigo-500 text-white" : "bg-zinc-800 text-zinc-200")}>
                <div className="prose prose-invert prose-sm max-w-none">
                  <Markdown>{msg.content}</Markdown>
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-zinc-800 text-zinc-200 rounded-2xl px-5 py-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-zinc-800 bg-zinc-950/50">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-100 placeholder-zinc-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white rounded-xl px-4 py-3 flex items-center justify-center transition-colors"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
