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
      <motion.div className="glass-panel p-4 sm:p-5 space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <label className="block text-sm font-medium text-foreground mb-2">
          {category === "url" ? "Cole o link ou URL" : "Digite o texto"}
        </label>
        <Textarea
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          placeholder={category === "url" ? "https://exemplo.com" : "Digite o texto que deseja codificar..."}
          className="min-h-[100px] bg-secondary/50 border-border/50"
          disabled={isGenerating}
        />

        {/* Advanced customization */}
        <div className="border border-border/50 rounded-xl overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between p-3 text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors"
          >
            <span className="flex items-center gap-2"><Palette className="w-4 h-4" /> Personalizar aparência</span>
            <span className="text-xs text-muted-foreground">{showAdvanced ? "Ocultar" : "Expandir"}</span>
          </button>

          {showAdvanced && (
            <div className="p-4 space-y-5 border-t border-border/50">
              {/* Colors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-fg" className="text-xs text-muted-foreground">Cor do QR</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="qr-fg"
                      type="color"
                      value={fgColor}
                      onChange={(e) => setFgColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-border/50 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono uppercase">{fgColor}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="qr-bg" className="text-xs text-muted-foreground">Cor de fundo</Label>
                  <div className="flex items-center gap-2">
                    <input
                      id="qr-bg"
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-border/50 bg-transparent cursor-pointer"
                    />
                    <span className="text-xs font-mono uppercase">{bgColor}</span>
                  </div>
                </div>
              </div>

              {/* Size */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2"><Maximize className="w-3.5 h-3.5" /> Tamanho da imagem</Label>
                  <span className="text-xs font-mono">{size}px</span>
                </div>
                <div className="flex gap-2">
                  {sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      className={`flex-1 py-1.5 text-xs rounded-lg border transition-colors ${
                        size === s ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/30 border-border/50 hover:border-border"
                      }`}
                    >
                      {s}px
                    </button>
                  ))}
                </div>
              </div>

              {/* Logo */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground flex items-center gap-2"><ImagePlus className="w-3.5 h-3.5" /> Logo no centro</Label>
                  {logoImage && (
                    <button type="button" onClick={removeLogo} className="text-xs text-destructive hover:underline flex items-center gap-1">
                      <X className="w-3 h-3" /> Remover
                    </button>
                  )}
                </div>

                <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />

                {!logoImage ? (
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-border/50 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:border-border transition-colors flex flex-col items-center gap-1"
                  >
                    <Upload className="w-4 h-4" />
                    Adicionar logo (máx. 2MB)
                  </button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <img src={logoImage} alt="Logo preview" className="h-16 w-auto object-contain rounded-lg border border-border/50 p-1 bg-secondary/30" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Tamanho do logo</span>
                        <span>{logoSize}%</span>
                      </div>
                      <Slider value={[logoSize]} onValueChange={(v) => setLogoSize(v[0])} min={8} max={40} step={1} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

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
