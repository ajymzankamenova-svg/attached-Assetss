import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth";
import { Bot, User, Send, Sparkles, AlertCircle } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function Chat() {
  const { user, token } = useAuth();
  const { language } = useI18n();
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hello! I'm Sun AI, your civic tech assistant. I can help you find tasks, understand requirements, or answer questions about the platform. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || !token) return;

    const userMsg = input;
    setInput("");
    setError(null);
    
    const newUserMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: newUserMsgId, role: 'user', content: userMsg }]);
    
    const assistantMsgId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', content: "" }]);
    setIsStreaming(true);

    try {
      // NOTE: Using a fake endpoint or fallback logic here if the backend isn't ready
      // The instructions specified using native fetch with ReadableStream for SSE
      const res = await fetch(`/api/openai/chat/stream`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ content: userMsg, language })
      });

      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }

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
              } catch (e) {
                console.error("Error parsing SSE JSON", e);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      // Fallback for demo purposes if endpoint doesn't exist
      setError("AI service unavailable. Running in fallback simulation mode.");
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMsgId 
            ? { ...msg, content: "I am currently running in simulation mode because the streaming endpoint is not responding. However, I can assure you that your request to \"" + userMsg + "\" is important! Please check back later." }
            : msg
        ));
      }, 1000);
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
            <h1 className="text-2xl font-bold text-slate-900">AI Assistant</h1>
            <p className="text-sm text-slate-500">Ask anything about tasks, platform rules, or your impact.</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="flex-1 border-slate-200 shadow-md flex flex-col overflow-hidden bg-white">
          <ScrollArea className="flex-1 p-6" viewportRef={scrollRef}>
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
                    {msg.content || (isStreaming && msg.role === 'assistant' ? <span className="animate-pulse">Thinking...</span> : '')}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <form onSubmit={handleSubmit} className="flex gap-2 max-w-3xl mx-auto relative">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
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
              AI can make mistakes. Verify important platform rules. Language: {language.toUpperCase()}
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
