import { useState, useRef, useEffect } from "react";
import { QrCode, Download, Loader2, FileText, Image, Music, Link, Type, File, Upload, Clock, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GeneratingAnimation from "./GeneratingAnimation";

type Category = "text" | "url" | "file";
type ExpirationOption = "immediate" | "1hour" | "permanent";

const categories: { value: Category; label: string; icon: typeof FileText; description: string; disabled?: boolean }[] = [
  { value: "text", label: "Texto", icon: Type, description: "Texto simples ou dados" },
  { value: "url", label: "Link/URL", icon: Link, description: "Links da web ou URLs" },
  { value: "file", label: "Arquivo", icon: File, description: "Em breve - use URL por enquanto", disabled: true },
];

const expirationOptions: { value: ExpirationOption; label: string; description: string }[] = [
  { value: "immediate", label: "5 minutos", description: "Exclusão rápida após download" },
  { value: "1hour", label: "1 hora", description: "Acesso temporário" },
  { value: "permanent", label: "Permanente", description: "Mantido indefinidamente" },
];

interface QRCodeGeneratorProps {
  onResult?: (resultUrl: string, prompt: string) => void;
}

const QRCodeGenerator = ({ onResult }: QRCodeGeneratorProps) => {
  const [category, setCategory] = useState<Category>("url");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expirationOption, setExpirationOption] = useState<ExpirationOption>("1hour");
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrResult, setQrResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isTextBased = category === "url" || category === "text";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "Máximo de 50MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setQrResult(null);
    
    try {
      let requestPayload: any = {
        type: category,
        expirationOption: expirationOption,
        userSession: 'web-user'
      };

      if (isTextBased) {
        if (!textContent.trim()) throw new Error("Insira o conteúdo.");
        requestPayload.content = textContent.trim();
      } else {
        if (!selectedFile) throw new Error("Selecione um arquivo.");
        const fileBase64 = await fileToBase64(selectedFile);
        requestPayload.content = "";
        requestPayload.fileData = fileBase64;
        requestPayload.fileName = selectedFile.name;
      }

      console.log('Generating QR code with payload:', { 
        type: requestPayload.type, 
        hasFileData: !!requestPayload.fileData,
        expirationOption: requestPayload.expirationOption 
      });

      const response = await fetch('https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/generate-qrcode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro na geração: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Falha na geração do QR code');
      }

      setQrResult(result);
      
      const description = isTextBased ? textContent.trim().slice(0, 50) : selectedFile?.name;
      onResult?.(result.qrCodeUrl, `QR Code: ${category} - ${description}`);
      
      toast({ 
        title: "QR Code gerado!", 
        description: result.message || "QR Code criado com sucesso." 
      });

    } catch (err: any) {
      console.error("QR generation error:", err);
      toast({ 
        title: "Erro na geração", 
        description: err.message || "Tente novamente.", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteFile = async () => {
    if (!qrResult?.expiration?.fileId) return;
    
    try {
      const response = await fetch('https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/delete-temp-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw`,
        },
        body: JSON.stringify({ fileId: qrResult.expiration.fileId }),
      });

      if (response.ok) {
        toast({ title: "Arquivo excluído", description: "O arquivo foi removido com sucesso." });
        setQrResult(null);
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({ title: "Erro", description: "Falha ao excluir arquivo.", variant: "destructive" });
    }
  };

  const canGenerate = isTextBased ? textContent.trim().length > 0 : !!selectedFile;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Category selector */}
      <motion.div 
        className="glass-panel p-4 sm:p-5" 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
      >
        <label className="block text-sm font-medium text-foreground mb-3">Tipo de QR Code</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <motion.button
              key={cat.value}
              onClick={() => { 
                if (!cat.disabled) {
                  setCategory(cat.value); 
                  setSelectedFile(null); 
                  setTextContent(""); 
                  setQrResult(null); 
                }
              }}
              disabled={isGenerating || cat.disabled}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-colors ${
                cat.disabled 
                  ? "opacity-50 cursor-not-allowed bg-secondary/20 border-border/30"
                  : isGenerating
                  ? "opacity-50 cursor-not-allowed"
                  : category === cat.value
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-secondary/30 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
              whileHover={cat.disabled ? {} : { scale: 1.02 }}
              whileTap={cat.disabled ? {} : { scale: 0.98 }}
            >
              <cat.icon className="w-6 h-6" />
              <div>
                <div className="text-sm font-medium">{cat.label}</div>
                <div className="text-xs opacity-70">{cat.description}</div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Expiration options for files */}
      {category === "file" && (
        <motion.div 
          className="glass-panel p-4 sm:p-5" 
          initial={{ opacity: 0, y: 12 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <label className="block text-sm font-medium text-foreground mb-3">
            <Clock className="w-4 h-4 inline mr-2" />
            Tempo de Expiração
          </label>
          <Select value={expirationOption} onValueChange={(value: ExpirationOption) => setExpirationOption(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione o tempo de expiração" />
            </SelectTrigger>
            <SelectContent>
              {expirationOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex flex-col">
                    <span>{option.label}</span>
                    <span className="text-xs text-muted-foreground">{option.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>
      )}

      {/* Content input */}
      <motion.div 
        className="glass-panel p-4 sm:p-5" 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {isTextBased ? (
          <>
            <label className="block text-sm font-medium text-foreground mb-2">
              {category === "url" ? "Cole o link ou URL" : "Digite o texto"}
            </label>
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={category === "url" ? "https://exemplo.com" : "Digite o texto que deseja codificar..."}
              className="mb-3 min-h-[100px] bg-secondary/50 border-border/50"
              disabled={isGenerating}
            />
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-foreground mb-2">
              Faça upload do arquivo (máx. 50MB)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`upload-zone p-8 flex flex-col items-center gap-3 cursor-pointer text-center border-2 border-dashed rounded-xl transition-colors ${
                selectedFile 
                  ? "border-primary/40 bg-primary/5" 
                  : "border-border/50 hover:border-border"
              }`}
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  {selectedFile ? selectedFile.name : "Clique para selecionar o arquivo"}
                </p>
                {selectedFile && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                disabled={isGenerating}
              />
            </div>
          </>
        )}

        <Button 
          onClick={handleGenerate} 
          disabled={!canGenerate || isGenerating} 
          className="w-full mt-4 h-12"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Gerando QR Code...
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5 mr-2" />
              Gerar QR Code
            </>
          )}
        </Button>
      </motion.div>

      {isGenerating && <GeneratingAnimation label="Gerando QR Code..." />}

      {qrResult && (
        <motion.div
          className="glass-panel p-4 sm:p-5 space-y-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex flex-col items-center gap-4">
            <img 
              src={qrResult.qrCodeUrl} 
              alt="QR Code gerado" 
              className="w-64 h-64 rounded-xl shadow-lg border-2 border-white" 
            />
            
            <div className="flex flex-wrap gap-2 justify-center">
              <a
                href={qrResult.qrCodeUrl}
                download="qrcode.png"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Baixar QR Code
              </a>
              
              {qrResult.fileUrl && (
                <a
                  href={qrResult.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors text-sm font-medium"
                >
                  <Link className="w-4 h-4" />
                  Abrir Arquivo
                </a>
              )}
              
              {qrResult.expiration?.fileId && qrResult.expiration?.autoDelete && (
                <Button
                  onClick={handleDeleteFile}
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Agora
                </Button>
              )}
            </div>
          </div>
          
          {qrResult.expiration && (
            <div className="bg-secondary/30 rounded-lg p-3 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-medium">Informações de Expiração:</span>
              </div>
              <div className="mt-2 space-y-1 text-xs">
                <p>• Opção: {qrResult.expiration.option === 'immediate' ? '5 minutos' : 
                           qrResult.expiration.option === '1hour' ? '1 hora' : 'Permanente'}</p>
                {qrResult.expiration.expiresAt && (
                  <p>• Expira em: {new Date(qrResult.expiration.expiresAt).toLocaleString('pt-BR')}</p>
                )}
                <p>• Exclusão automática: {qrResult.expiration.autoDelete ? 'Sim' : 'Não'}</p>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
