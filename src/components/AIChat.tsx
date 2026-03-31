import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "@/hooks/use-toast";
import { chatWithAI, getCachedItems, addCachedItem, clearCache } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Model = "gpt-oss-120b" | "llama-3.3-70b";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const modelLabels: Record<Model, string> = {
  "gpt-oss-120b": "GPT-OSS 120B (Groq)",
  "llama-3.3-70b": "Llama 3.3 70B (Groq)",
};

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-background/50" title="Copiar mensagem">
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
};

const CHAT_CACHE_KEY = "chat-history";

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>(() => {
    const cached = getCachedItems<Message>(CHAT_CACHE_KEY);
    return cached.length > 0 ? cached : [];
  });
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState<Model>("gpt-oss-120b");
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Save messages to cache when they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem("alse-cache-" + CHAT_CACHE_KEY, JSON.stringify(messages.slice(-100)));
      } catch {}
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content: trimmed };
    const assistantMsg: Message = { id: crypto.randomUUID(), role: "assistant", content: "" };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    setIsStreaming(true);

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      let accumulated = "";

      await chatWithAI(
        history,
        model,
        (token) => {
          accumulated += token;
          const current = accumulated;
          setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: current } : m)));
        },
        () => {}
      );
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg = err.message || "Falha na comunicação com a IA.";
      setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: `Erro: ${errorMsg}` } : m)));
      if (err.message?.includes("429")) {
        toast({ title: "Limite excedido", description: "Aguarde alguns instantes e tente novamente.", variant: "destructive" });
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => {
    setMessages([]);
    clearCache(CHAT_CACHE_KEY);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      <div className="glass-panel p-3 sm:p-4 mb-4 flex items-center justify-between gap-3">
        <Select value={model} onValueChange={(v) => setModel(v as Model)}>
          <SelectTrigger className="w-[200px] sm:w-[260px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-oss-120b">🚀 GPT-OSS 120B</SelectItem>
            <SelectItem value="llama-3.3-70b">🧠 Llama 3.3 70B</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={clearChat} disabled={messages.length === 0 || isStreaming} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">Limpar</span>
        </Button>
      </div>

      <div className="glass-panel flex-1 flex flex-col overflow-hidden min-h-0">
        <ScrollArea className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-muted-foreground gap-3">
              <Bot className="w-12 h-12 opacity-30" />
              <div>
                <p className="text-base font-medium">Chat com IA</p>
                <p className="text-sm mt-1">Usando <span className="font-semibold">{modelLabels[model]}</span> via Groq</p>
                <p className="text-xs mt-2 max-w-sm opacity-70">Envie uma mensagem para começar. Shift+Enter para nova linha.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`group flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[80%]">
                    <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${msg.role === "user" ? "bg-primary text-primary-foreground whitespace-pre-wrap" : "bg-muted/50 text-foreground"}`}>
                      {msg.content ? (
                        msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-pre:my-2 prose-pre:bg-background/80 prose-pre:border prose-pre:border-border/50 prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-a:text-primary prose-a:underline">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                          </div>
                        ) : msg.content
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Loader2 className="w-3 h-3 animate-spin" />Pensando...
                        </span>
                      )}
                    </div>
                    {msg.content && (
                      <div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <CopyButton text={msg.content} />
                      </div>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-4 h-4 text-secondary-foreground" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        <div className="border-t border-border/40 p-3 sm:p-4">
          <div className="flex gap-2 items-end">
            <Textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Digite sua mensagem..." disabled={isStreaming} className="min-h-[44px] max-h-[120px] resize-none text-sm" rows={1} />
            <Button onClick={handleSend} disabled={!input.trim() || isStreaming} size="icon" className="flex-shrink-0 h-[44px] w-[44px]">
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
