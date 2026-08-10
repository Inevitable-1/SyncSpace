import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  { icon: '💡', label: 'Explain Code', prompt: 'Explain the following code' },
  { icon: '⚡', label: 'Generate Code', prompt: 'Generate code for' },
  { icon: '📝', label: 'Summarize Chat', prompt: 'Summarize the recent chat messages' },
  { icon: '✅', label: 'Create Tasks', prompt: 'Create tasks from this discussion' },
  { icon: '📋', label: 'Meeting Notes', prompt: 'Generate meeting notes' },
  { icon: '📖', label: 'Documentation', prompt: 'Generate documentation for' },
];

export default function AISidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        "Hi! I'm your AI assistant. I can help with code, summaries, tasks, and more. What would you like to do?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'a') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const handleSend = (text?: string) => {
    const content = text || input.trim();
    if (!content) return;

    setMessages((prev) => [...prev, { role: 'user', content }]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const responses: Record<string, string> = {
        explain:
          "I'd be happy to explain that code! The function appears to be handling data processing with a middleware pattern. It validates input, transforms the data, and passes it through the pipeline. Would you like me to break down any specific part?",
        generate:
          "Here's a suggested implementation:\n\n```typescript\nconst processData = async (input: DataInput) => {\n  const validated = validateInput(input);\n  const transformed = transformData(validated);\n  return await saveToDatabase(transformed);\n};\n```\n\nWould you like me to add error handling or modify this?",
        summarize:
          'Based on the recent messages, here are the key points:\n\n1. Sprint planning is scheduled for Friday\n2. The new API endpoint needs testing\n3. Dashboard redesign is 80% complete\n4. Code review needed for PR #142\n\nWould you like me to create tasks for any of these?',
        tasks:
          "I've identified these action items from the discussion:\n\n1. **High Priority**: Complete API endpoint testing\n2. **Medium Priority**: Review PR #142\n3. **Low Priority**: Update documentation\n\nWould you like me to create these as formal tasks?",
        meeting:
          'Here are the meeting notes:\n\n**Date**: Today\n**Attendees**: Team SyncSpace\n**Key Decisions**:\n- Approved new feature scope\n- Set deadline for beta release\n- Assigned code review responsibilities\n\n**Next Steps**:\n- Follow up on action items by EOW',
      };

      const lower = content.toLowerCase();
      let response =
        "I'm here to help! I can assist with code explanations, generation, chat summaries, task creation, and meeting notes. Could you provide more details about what you need?";

      for (const [key, val] of Object.entries(responses)) {
        if (lower.includes(key)) {
          response = val;
          break;
        }
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: response }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-[90] w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-110 transition-all flex items-center justify-center"
        title="AI Assistant (Ctrl+Shift+A)"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
          />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[190] bg-black/40"
              onClick={() => setIsOpen(false)}
            />
            <motion.aside
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 z-[191] w-96 border-l border-white/10 bg-surface-850/95 backdrop-blur-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Assistant</h3>
                    <p className="text-[10px] text-gray-500">Powered by GPT</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-xl hover:bg-white/5 transition-colors text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-brand-600 text-white rounded-br-md'
                          : 'bg-white/5 text-gray-300 border border-white/5 rounded-bl-md'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-bl-md">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: '0ms' }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: '150ms' }}
                        />
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: '300ms' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <div className="grid grid-cols-2 gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.label}
                        onClick={() => handleSend(s.prompt)}
                        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-300 hover:bg-white/10 hover:border-brand-500/30 transition-all text-left"
                      >
                        <span>{s.icon}</span>
                        <span>{s.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-4 border-t border-white/5">
                <div className="flex items-end gap-2">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Ask anything..."
                    rows={1}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500/50 resize-none"
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isTyping}
                    className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/25"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 mt-2 text-center">Ctrl+Shift+A to toggle</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
