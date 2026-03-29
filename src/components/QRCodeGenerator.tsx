import { useState, useRef, useEffect } from "react";
import { QrCode, Download, Loader2, FileText, Image, Music, Link, Type, File, Upload } from "lucide-react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import GeneratingAnimation from "./GeneratingAnimation";

type Category = "pdf" | "image" | "music" | "link" | "text" | "file";

const categories: { value: Category; label: string; icon: typeof FileText }[] = [
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "image", label: "Imagem", icon: Image },
  { value: "music", label: "Música", icon: Music },
  { value: "link", label: "Link", icon: Link },
  { value: "text", label: "Texto", icon: Type },
  { value: "file", label: "Arquivo", icon: File },
];

interface QRCodeGeneratorProps {
  onResult?: (resultUrl: string, prompt: string) => void;
}

const QRCodeGenerator = ({ onResult }: QRCodeGeneratorProps) => {
  const [category, setCategory] = useState<Category>("link");
  const [textContent, setTextContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isTextBased = category === "link" || category === "text";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "Máximo de 20MB.", variant: "destructive" });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setQrDataUrl(null);
    try {
      let url = "";

      if (isTextBased) {
        if (!textContent.trim()) throw new Error("Insira o conteúdo.");
        url = category === "link" ? textContent.trim() : textContent.trim();
      } else {
        if (!selectedFile) throw new Error("Selecione um arquivo.");
        const fileName = `qrcodes/${Date.now()}-${selectedFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("upscale-images")
          .upload(fileName, selectedFile, { contentType: selectedFile.type, upsert: true });
        if (uploadError) throw uploadError;
        const { data: publicUrl } = supabase.storage.from("upscale-images").getPublicUrl(fileName);
        url = publicUrl.publicUrl;
      }

      const dataUrl = await QRCode.toDataURL(url, {
        width: 512,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
      });

      setQrDataUrl(dataUrl);

      // Upload QR to cloud for permanent access
      let cloudUrl = dataUrl;
      try {
        const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, "");
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        const fileName = `qrcodes-generated/${Date.now()}.png`;
        const { error: upErr } = await supabase.storage
          .from("upscale-images")
          .upload(fileName, bytes, { contentType: "image/png", upsert: true });
        if (!upErr) {
          const { data: pub } = supabase.storage.from("upscale-images").getPublicUrl(fileName);
          cloudUrl = pub.publicUrl;
        }
      } catch (e) { console.warn("QR cloud upload failed:", e); }

      onResult?.(cloudUrl, `QR Code: ${category} - ${isTextBased ? textContent.trim().slice(0, 50) : selectedFile?.name}`);
      toast({ title: "QR Code gerado!", description: "Escaneie ou baixe o QR Code." });
    } catch (err: any) {
      console.error("QR error:", err);
      toast({ title: "Erro", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = isTextBased ? textContent.trim().length > 0 : !!selectedFile;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Category selector */}
      <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <label className="block text-sm font-medium text-foreground mb-3">Categoria</label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {categories.map((cat) => (
            <motion.button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setSelectedFile(null); setTextContent(""); setQrDataUrl(null); }}
              disabled={isGenerating}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-colors disabled:opacity-50 ${
                category === cat.value
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-secondary/30 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <cat.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{cat.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Content input */}
      <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        {isTextBased ? (
          <>
            <label className="block text-sm font-medium text-foreground mb-2">
              {category === "link" ? "Cole o link" : "Digite o texto"}
            </label>
            <Textarea
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              placeholder={category === "link" ? "https://exemplo.com" : "Digite o texto que deseja codificar..."}
              className="mb-3 min-h-[100px] bg-secondary/50 border-border/50"
              disabled={isGenerating}
            />
          </>
        ) : (
          <>
            <label className="block text-sm font-medium text-foreground mb-2">
              Faça upload do arquivo ({category.toUpperCase()})
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="upload-zone p-8 flex flex-col items-center gap-3 cursor-pointer text-center"
            >
              <Upload className="w-8 h-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {selectedFile ? selectedFile.name : "Clique para selecionar o arquivo"}
              </p>
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

        <Button onClick={handleGenerate} disabled={!canGenerate || isGenerating} className="w-full mt-3">
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando QR Code...
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4" />
              Gerar QR Code
            </>
          )}
        </Button>
      </motion.div>

      {isGenerating && <GeneratingAnimation label="Gerando QR Code..." />}

      {qrDataUrl && (
        <motion.div
          className="glass-panel p-4 sm:p-5 flex flex-col items-center gap-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <img src={qrDataUrl} alt="QR Code gerado" className="w-64 h-64 rounded-lg" />
          <a
            href={qrDataUrl}
            download="qrcode.png"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            Baixar QR Code
          </a>
        </motion.div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
