import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Loader2, User, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ChatMessage } from '@/lib/types';

const SUGGESTIONS = [
  'How do I prepare for exams?',
  'Tips for managing stress',
  'How to improve my time management?',
  'Career advice for students',
];

export function AIAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-assistant', {
        body: { question: trimmed },
      });

      if (fnError) {
  let message = fnError.message;
  try {
    const body = await (fnError as any).context.json();
    if (body?.error) message = body.error;
  } catch {}
  throw new Error(message);
}
      if (!data || typeof data.answer !== 'string') {
        throw new Error('Unexpected response from AI assistant');
      }

      const aiMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'ai',
        content: data.answer,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get a response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
          <Bot className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#111827]">AI Assistant</h1>
          <p className="text-sm text-gray-500">Ask me anything about your studies</p>
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 space-y-4">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="font-semibold text-[#111827] mb-1">Welcome to UniSphere AI</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm">
              I can help with study tips, exam prep, time management, career guidance, and more.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="px-3 py-1.5 rounded-lg bg-gray-50 text-sm text-gray-600 hover:bg-blue-50 hover:text-[#2563EB] transition border border-gray-100"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
              msg.role === 'user'
                ? 'bg-[#2563EB] text-white'
                : 'bg-emerald-50 text-emerald-600'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#2563EB] text-white'
                : 'bg-gray-50 text-[#111827]'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Bot className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="bg-gray-50 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
            </div>
          </div>
        )}

        {error && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <div className="bg-red-50 rounded-2xl px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your question..."
          disabled={loading}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 outline-none transition text-sm text-[#111827] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-3 rounded-xl bg-[#2563EB] text-white hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
