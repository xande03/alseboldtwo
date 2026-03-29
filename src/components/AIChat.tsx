import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, Trash2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

declare global {
  interface Window {
    puter: {
      ai: {
        chat: (
          message: string | Array<{ role: string; content: string }>,
          options?: { model?: string; stream?: boolean }
        ) => Promise<any>;
      };
    };
  }
}

type Model = "deepseek/deepseek-v3.2" | "claude-3-7-sonnet" | "gemini-3-pro";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const modelLabels: Record<Model, string> = {
  "deepseek/deepseek-v3.2": "DeepSeek v3.2",
  "claude-3-7-sonnet": "Claude 3.7 Sonnet",
  "gemini-3-pro": "Gemini 3 Pro",
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

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [model, setModel] = useState<Model>("deepseek/deepseek-v3.2");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const streamGemini = async (history: { role: string; content: string }[], assistantId: string) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: history }),
    });

    if (!resp.ok) {
      const errData = await resp.json().catch(() => ({ error: "Erro na comunicação" }));
      throw new Error(errData.error || `Erro ${resp.status}`);
    }

    if (!resp.body) throw new Error("Stream não disponível");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") break;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            accumulated += content;
            const current = accumulated;
            setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: current } : m)));
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

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

      if (model === "gemini-3-pro") {
        await streamGemini(history, assistantMsg.id);
      } else {
        const response = await window.puter.ai.chat(history, { model, stream: true });
        let accumulated = "";
        for await (const part of response) {
          const token = part?.text ?? "";
          accumulated += token;
          const current = accumulated;
          setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: current } : m)));
        }
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      const errorMsg = err.message || "Falha na comunicação com a IA.";
      setMessages((prev) => prev.map((m) => (m.id === assistantMsg.id ? { ...m, content: `Erro: ${errorMsg}` } : m)));
      if (err.message?.includes("429") || err.message?.includes("Limite")) {
        toast({ title: "Limite excedido", description: "Aguarde alguns instantes e tente novamente.", variant: "destructive" });
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[800px]">
      <div className="glass-panel p-3 sm:p-4 mb-4 flex items-center justify-between gap-3">
        <Select value={model} onValueChange={(v) => setModel(v as Model)}>
          <SelectTrigger className="w-[200px] sm:w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="deepseek/deepseek-v3.2">🧠 DeepSeek v3.2</SelectItem>
            <SelectItem value="claude-3-7-sonnet">🎯 Claude 3.7 Sonnet</SelectItem>
            <SelectItem value="gemini-3-pro">✨ Gemini 3 Pro</SelectItem>
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
                <p className="text-sm mt-1">Usando <span className="font-semibold">{modelLabels[model]}</span></p>
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
            <Textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Digite sua mensagem..." disabled={isStreaming} className="min-h-[44px] max-h-[120px] resize-none text-sm" rows={1} />
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
