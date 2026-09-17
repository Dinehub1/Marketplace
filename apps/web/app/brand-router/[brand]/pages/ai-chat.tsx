"use client";
import { useState, useRef, useEffect } from "react";
import { BrandHeader, BrandFooter } from "../brand-header";
import type { Brand } from "@/lib/brands";

export function AIChatPage({ brand }: { brand: Brand }) {

  const [messages, setMessages] = useState([
    { role: "ai", text: `Hi! I'm the ${brand.name} AI assistant. I can help you with product info, pricing, bookings, and more. What can I help you with?` }
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typing]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const responses = [
        `Great question about "${userMsg}"! Based on what you're looking for, I'd recommend checking out our services page or contacting our team for personalized assistance.`,
        `Thanks for asking! "${userMsg}" is something we handle regularly. Let me connect you with our team for a detailed response.`,
        `I'd be happy to help with "${userMsg}"! Our team typically responds within a few minutes. In the meantime, you might find answers in our FAQ section.`,
      ];
      setMessages((prev) => [...prev, { role: "ai", text: responses[Math.floor(Math.random() * responses.length)] }]);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <BrandHeader brand={brand} />

      <main className="flex-1 flex flex-col mx-auto max-w-2xl w-full px-6 py-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium mb-3" style={{ borderColor: "var(--hairline)", color: "var(--brand-secondary)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--brand-primary)" }} />
            Powered by AI
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--brand-secondary)" }}>AI Assistant</h1>
          <p className="text-sm opacity-60">Ask me anything about {brand.name}</p>
        </div>

        {/* Chat window */}
        <div className="flex-1 rounded-3xl border bg-surface shadow-sm flex flex-col overflow-hidden" style={{ borderColor: "var(--hairline)", minHeight: "400px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-scale-in`}>
                <div className="flex items-end gap-2 max-w-[80%]">
                  {m.role === "ai" && (
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: "var(--brand-gradient)" }}>
                      AI
                    </div>
                  )}
                  <div className="rounded-2xl px-4 py-3 text-sm leading-relaxed" style={m.role === "user" ? { background: "var(--brand-gradient)", color: "white", borderBottomRightRadius: "4px" } : { background: "var(--brand-tint)", borderBottomLeftRadius: "4px" }}>
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex justify-start animate-scale-in">
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: "var(--brand-gradient)" }}>AI</div>
                  <div className="rounded-2xl px-4 py-3 flex gap-1" style={{ background: "var(--brand-tint)" }}>
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--brand-primary)", animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--brand-primary)", animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full animate-bounce" style={{ background: "var(--brand-primary)", animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div className="px-5 pb-2 flex gap-2 overflow-x-auto">
            {["Pricing info", "Book appointment", "Services offered", "Contact details"].map((q) => (
              <button key={q} onClick={() => { setInput(q); }} className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors hover:bg-surface-sunken" style={{ borderColor: "var(--hairline)", color: "var(--brand-secondary)" }}>
                {q}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="border-t p-4 flex gap-3" style={{ borderColor: "var(--hairline)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:border-transparent focus:ring-2"
              style={{ borderColor: "var(--hairline)" }}
            />
            <button onClick={sendMessage} className="rounded-xl px-5 py-3 text-white text-sm font-bold hover:shadow-md transition-all hover:translate-y-[-1px]" style={{ background: "var(--brand-gradient)" }}>
              Send
            </button>
          </div>
        </div>
      </main>

      <BrandFooter brand={brand} />
    </div>
  );
}
