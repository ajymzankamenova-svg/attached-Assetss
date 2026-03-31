import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Bot, User, Send, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const { user, token } = useAuth();
  const { language, t } = useI18n();

  const greeting = language === "kz"
    ? t("chat.greeting_kz")
    : language === "en"
    ? t("chat.greeting_en")
    : t("chat.greeting_ru");

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: greeting }
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const newGreeting = language === "kz"
      ? t("chat.greeting_kz")
      : language === "en"
      ? t("chat.greeting_en")
      : t("chat.greeting_ru");
    setMessages([{ id: '1', role: 'assistant', content: newGreeting }]);
  }, [language]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || !token) return;

    const userMsg = input;
    setInput("");

    const newUserMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: newUserMsgId, role: 'user', content: userMsg }]);

    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: "" }]);
    setIsStreaming(true);

    try {
      const baseUrl = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
      const res = await fetch(`${baseUrl}/api/openai/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: userMsg, language })
      });

      if (!res.ok) throw new Error(`API returned ${res.status}`);
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      let done = false;
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices?.[0]?.delta?.content) {
                  const contentChunk = data.choices[0].delta.content;
                  setMessages(prev => prev.map(msg =>
                    msg.id === assistantMsgId
                      ? { ...msg, content: msg.content + contentChunk }
                      : msg
                  ));
                }
              } catch {}
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(msg =>
        msg.id === assistantMsgId
          ? { ...msg, content: language === "kz"
              ? "Қазір ЖИ қызметі қолжетімсіз. Кейінірек қайталап көріңіз."
              : language === "en"
              ? "AI service is currently unavailable. Please try again later."
              : "Сервис ИИ временно недоступен. Попробуйте позже." }
          : msg
      ));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto h-[calc(100dvh-8rem)] flex flex-col">
        <div className="mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("chat.title")}</h1>
            <p className="text-sm text-slate-500">{t("chat.subtitle")}</p>
          </div>
        </div>

        <Card className="flex-1 border-slate-200 shadow-md flex flex-col overflow-hidden bg-white">
          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto">
            <div className="flex flex-col gap-6 max-w-3xl mx-auto">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === 'user' ? 'bg-amber-100 text-amber-700' : 'bg-indigo-600 text-white shadow-sm'
                  }`}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  <div className={`px-4 py-3 rounded-2xl max-w-[80%] text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-tr-none'
                      : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
                  }`}>
                    {msg.content || (isStreaming && msg.role === 'assistant' ? (
                      <span className="flex gap-1">
                        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>●</span>
                        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>●</span>
                        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>●</span>
                      </span>
                    ) : '')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t("chat.placeholder")}
                className="h-12 bg-white border-slate-300 pr-12 focus-visible:ring-indigo-500"
                disabled={isStreaming}
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-10 w-10 bg-indigo-600 hover:bg-indigo-700 text-white"
                disabled={!input.trim() || isStreaming}
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <div className="text-center mt-2 text-xs text-slate-400">
              {t("chat.disclaimer")} • {t("chat.language")}: {language.toUpperCase()}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
