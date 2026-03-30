import { useState, useRef } from "react";
import { FileText, Upload, Sparkles, Copy, Check, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as pdfjsLib from "pdfjs-dist";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { summarizeText as summarizeTextApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

type OutputType = "summary" | "keypoints" | "flashcards";

interface TextSummarizerProps {
  onResult?: (resultText: string, prompt: string) => void;
}

const outputOptions: { value: OutputType; label: string; desc: string }[] = [
  { value: "summary", label: "Resumo", desc: "Texto condensado" },
  { value: "keypoints", label: "Pontos-chave", desc: "Lista de tópicos" },
  { value: "flashcards", label: "Flashcards", desc: "Perguntas e respostas" },
];

const TextSummarizer = ({ onResult }: TextSummarizerProps) => {
  const [inputText, setInputText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [outputType, setOutputType] = useState<OutputType>("summary");
  const [result, setResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(" ");
      fullText += pageText + "\n\n";
    }

    return fullText.trim();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Formato inválido",
        description: "Por favor, selecione um arquivo PDF.",
        variant: "destructive",
      });
      return;
    }

    setPdfFile(file);
    setResult(null);

    try {
      const extractedText = await extractTextFromPdf(file);
      setInputText(extractedText);
      toast({
        title: "PDF carregado",
        description: `${extractedText.split(" ").length} palavras extraídas.`,
      });
    } catch (error) {
      console.error("PDF extraction error:", error);
      toast({
        title: "Erro ao ler PDF",
        description: "Não foi possível extrair o texto do arquivo.",
        variant: "destructive",
      });
    }
  };

  const handleSummarize = async () => {
    if (!inputText.trim()) {
      toast({
        title: "Texto vazio",
        description: "Insira texto ou carregue um PDF para resumir.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const result = await summarizeTextApi(inputText, outputType);

      setResult(result);
      onResult?.(result, `${outputType}: ${inputText.slice(0, 100)}...`);
      toast({ title: "Concluído!", description: "Seu conteúdo foi processado." });
    } catch (err: any) {
      console.error("Summarize error:", err);
      toast({
        title: "Erro no processamento",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Copiado!", description: "Texto copiado para a área de transferência." });
  };

  const clearAll = () => {
    setInputText("");
    setPdfFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <motion.div
        className="glass-panel-premium p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 tool-summarizer" />
            <h3 className="font-display font-semibold">Texto ou PDF</h3>
          </div>
          {(inputText || pdfFile) && (
            <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
              <X className="w-4 h-4 mr-1" /> Limpar
            </Button>
          )}
        </div>

        {/* PDF Upload */}
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            id="pdf-upload"
          />
          <label
            htmlFor="pdf-upload"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 cursor-pointer transition-all"
          >
            <Upload className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {pdfFile ? pdfFile.name : "Carregar PDF (opcional)"}
            </span>
          </label>
        </div>

        {/* Text Input */}
        <Textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Cole seu texto aqui ou carregue um PDF acima..."
          className="min-h-[200px] resize-none bg-background/50 border-border/50 focus:border-primary/50"
        />
        <p className="text-xs text-muted-foreground mt-2">
          {inputText.split(/\s+/).filter(Boolean).length} palavras
        </p>
      </motion.div>

      {/* Output Type Selection */}
      <motion.div
        className="glass-panel-premium p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h3 className="font-display font-semibold mb-4">Tipo de saída</h3>
        <div className="grid grid-cols-3 gap-3">
          {outputOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setOutputType(option.value)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                outputType === option.value
                  ? "border-primary bg-primary/10 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]"
                  : "border-border/50 hover:border-primary/30"
              }`}
            >
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-muted-foreground">{option.desc}</div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Button
          onClick={handleSummarize}
          disabled={!inputText.trim() || isProcessing}
          className="w-full h-12 text-base gap-2 shadow-lg shadow-primary/20"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar {outputOptions.find((o) => o.value === outputType)?.label}
            </>
          )}
        </Button>
      </motion.div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <motion.div
            className="glass-panel-premium p-6"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Resultado</h3>
              <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado!" : "Copiar"}
              </Button>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none bg-background/30 rounded-xl p-4 border border-border/30">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TextSummarizer;
