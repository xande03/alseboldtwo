import { useState, useRef } from "react";
import { QrCode, Download, Loader2, FileText, Link, Type, Upload, Palette, ImagePlus, X, Maximize } from "lucide-react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import GeneratingAnimation from "./GeneratingAnimation";

type Category = "text" | "url";

const categories: { value: Category; label: string; icon: typeof FileText; description: string }[] = [
  { value: "text", label: "Texto", icon: Type, description: "Texto simples ou dados" },
  { value: "url", label: "Link/URL", icon: Link, description: "Links da web ou URLs" },
];

const sizes = [256, 512, 1024, 2048];

interface QRCodeGeneratorProps {
  onResult?: (resultUrl: string, prompt: string) => void;
}

const QRCodeGenerator = ({ onResult }: QRCodeGeneratorProps) => {
  const [category, setCategory] = useState<Category>("url");
  const [textContent, setTextContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrResult, setQrResult] = useState<{ qrCodeUrl: string; content: string } | null>(null);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(512);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(22);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const overlayLogo = (qrDataUrl: string, logoSrc: string, logoPercent: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const qrImg = new window.Image();
      qrImg.crossOrigin = "anonymous";
      qrImg.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = qrImg.width;
        canvas.height = qrImg.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(qrImg, 0, 0);

        const logoImg = new window.Image();
        logoImg.crossOrigin = "anonymous";
        logoImg.onload = () => {
          const maxLogoSize = Math.round(canvas.width * (logoPercent / 100));
          const scale = Math.min(1, maxLogoSize / Math.max(logoImg.width, logoImg.height));
          const lw = Math.round(logoImg.width * scale);
          const lh = Math.round(logoImg.height * scale);
          const x = Math.round((canvas.width - lw) / 2);
          const y = Math.round((canvas.height - lh) / 2);

          // White rounded backing behind logo to protect QR readability
          const padding = Math.round(lw * 0.12);
          ctx.fillStyle = bgColor;
          ctx.beginPath();
          ctx.roundRect(x - padding, y - padding, lw + padding * 2, lh + padding * 2, padding / 2);
          ctx.fill();

          ctx.drawImage(logoImg, x, y, lw, lh);
          resolve(canvas.toDataURL("image/png"));
        };
        logoImg.onerror = reject;
        logoImg.src = logoSrc;
      };
      qrImg.onerror = reject;
      qrImg.src = qrDataUrl;
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Logo muito grande", description: "Máximo de 2MB.", variant: "destructive" });
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast({ title: "Arquivo inválido", description: "Selecione uma imagem.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => setLogoImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoImage(null);
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!textContent.trim()) {
      toast({ title: "Erro", description: "Insira o conteúdo.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setQrResult(null);

    try {
      let qrCodeUrl = await QRCode.toDataURL(textContent.trim(), {
        width: size,
        margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: fgColor, light: bgColor },
      });

      if (logoImage) {
        qrCodeUrl = await overlayLogo(qrCodeUrl, logoImage, logoSize);
      }

      setQrResult({ qrCodeUrl, content: textContent.trim() });
      onResult?.(qrCodeUrl, `QR Code: ${category} - ${textContent.trim().slice(0, 50)}`);
      toast({ title: "QR Code gerado!", description: "QR Code criado com sucesso." });
    } catch (err: any) {
      console.error("QR generation error:", err);
      toast({ title: "Erro na geração", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Category selector */}
      <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <label className="block text-sm font-medium text-foreground mb-3">Tipo de QR Code</label>
        <div className="grid grid-cols-2 gap-3">
          {categories.map((cat) => (
            <motion.button
              key={cat.value}
              onClick={() => { setCategory(cat.value); setTextContent(""); setQrResult(null); }}
              disabled={isGenerating}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-colors disabled:opacity-50 ${
                category === cat.value
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-secondary/30 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
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

      {/* Content input */}
      <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
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
        <Button onClick={handleGenerate} disabled={!textContent.trim() || isGenerating} className="w-full h-12">
          {isGenerating ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" />Gerando QR Code...</>
          ) : (
            <><QrCode className="w-5 h-5 mr-2" />Gerar QR Code</>
          )}
        </Button>
      </motion.div>

      {isGenerating && <GeneratingAnimation label="Gerando QR Code..." />}

      {qrResult && (
        <motion.div className="glass-panel p-4 sm:p-5 space-y-4" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
          <div className="flex flex-col items-center gap-4">
            <img src={qrResult.qrCodeUrl} alt="QR Code gerado" className="w-64 h-64 rounded-xl shadow-lg border-2 border-white" />
            <a href={qrResult.qrCodeUrl} download="qrcode.png" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
              <Download className="w-4 h-4" />
              Baixar QR Code
            </a>
          </div>
          <div className="bg-secondary/30 rounded-lg p-3 text-sm">
            <p className="text-xs text-muted-foreground truncate">Conteúdo: {qrResult.content}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default QRCodeGenerator;
