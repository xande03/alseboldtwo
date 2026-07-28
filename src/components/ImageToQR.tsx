import { useState, useRef } from "react";
import { QrCode, Download, Loader2, Upload, Image, FileText, Zap, Palette, ImagePlus, X, Maximize } from "lucide-react";
import { motion } from "framer-motion";
import QRCode from "qrcode";
import { ocrScan } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import GeneratingAnimation from "./GeneratingAnimation";

const sizes = [256, 512, 1024, 2048];

interface ImageToQRProps {
  onResult?: (resultUrl: string, prompt: string) => void;
}

const ImageToQR = ({ onResult }: ImageToQRProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractText, setExtractText] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrResult, setQrResult] = useState<{
    qrCodeUrl: string;
    method: string;
    size: number;
    extractedText?: string;
    message: string;
  } | null>(null);
  const [fgColor, setFgColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(512);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoSize, setLogoSize] = useState(22);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Imagem muito grande", description: "Máximo de 10MB.", variant: "destructive" });
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast({ title: "Arquivo inválido", description: "Selecione apenas imagens.", variant: "destructive" });
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      setQrResult(null);
    }
  };

  const compressForQR = (dataUrl: string, maxLen = 2000): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 64 / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        let quality = 0.3;
        let result = canvas.toDataURL("image/jpeg", quality);
        // Reduce until it fits in QR
        while (result.length > maxLen && quality > 0.05) {
          quality -= 0.05;
          result = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(result);
      };
      img.src = dataUrl;
    });
  };

  const handleGenerate = async () => {
    if (!selectedImage || !imagePreview) {
      toast({ title: "Erro", description: "Selecione uma imagem primeiro.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setQrResult(null);

    try {
      let qrData: string;
      let method: string;
      let extractedText: string | undefined;

      if (extractText) {
        // Use Groq Vision OCR to extract text from image
        const text = await ocrScan(imagePreview);
        if (!text || text === "Nenhum texto encontrado") {
          toast({
            title: "Sem texto detectado",
            description: "Nenhum texto foi encontrado na imagem. Gerando QR com dados da imagem.",
          });
          const compressed = await compressForQR(imagePreview);
          qrData = compressed;
          method = "Dados da imagem (comprimido)";
        } else {
          // Truncate if too long for QR
          qrData = text.length > 2500 ? text.slice(0, 2500) : text;
          extractedText = text;
          method = "Texto extraído via OCR";
        }
      } else {
        const compressed = await compressForQR(imagePreview);
        qrData = compressed;
        method = "Dados da imagem (comprimido)";
      }

      // Generate QR code client-side
      const qrCodeUrl = await QRCode.toDataURL(qrData, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: "M",
        color: { dark: "#000000", light: "#ffffff" },
      });

      const result = {
        qrCodeUrl,
        method,
        size: 512,
        extractedText,
        message: "QR Code gerado com sucesso!",
      };

      setQrResult(result);
      onResult?.(qrCodeUrl, `QR de imagem: ${selectedImage.name}`);
      toast({ title: "QR Code gerado!", description: result.message });
    } catch (err: any) {
      console.error("Image to QR error:", err);
      toast({ title: "Erro na conversão", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = !!selectedImage && !isGenerating;

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div className="text-center space-y-3" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
            <QrCode className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent">
            Imagem para QR Code
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Converta imagens em QR codes. Extraia texto automaticamente ou use os dados da imagem diretamente.
        </p>
      </motion.div>

      <motion.div className="glass-panel p-4 sm:p-5 space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <label className="block text-sm font-medium text-foreground mb-2">
          <Image className="w-4 h-4 inline mr-2" />
          Selecionar Imagem (máx. 10MB)
        </label>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isGenerating} />

        <div
          onClick={() => fileInputRef.current?.click()}
          className={`upload-zone p-8 flex flex-col items-center gap-3 cursor-pointer text-center border-2 border-dashed rounded-xl transition-colors ${
            selectedImage ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20" : "border-border/50 hover:border-border"
          }`}
        >
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">{selectedImage ? selectedImage.name : "Clique para selecionar uma imagem"}</p>
            {selectedImage && <p className="text-xs text-muted-foreground mt-1">{(selectedImage.size / 1024 / 1024).toFixed(2)} MB</p>}
          </div>
        </div>

        {imagePreview && (
          <motion.div className="flex justify-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
            <img src={imagePreview} alt="Preview" className="max-w-full max-h-48 object-contain rounded-lg shadow-md border-2 border-white" />
          </motion.div>
        )}

        <div className="flex items-center space-x-2 p-3 bg-secondary/30 rounded-lg">
          <Switch id="extract-text" checked={extractText} onCheckedChange={setExtractText} disabled={isGenerating} />
          <Label htmlFor="extract-text" className="text-sm">
            <FileText className="w-4 h-4 inline mr-2" />
            Extrair texto da imagem (recomendado)
          </Label>
        </div>

        <Button onClick={handleGenerate} disabled={!canGenerate} className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Convertendo...
            </>
          ) : (
            <>
              <QrCode className="w-5 h-5 mr-2" />
              Converter para QR Code
              <Zap className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </motion.div>

      {isGenerating && <GeneratingAnimation label="Convertendo imagem para QR Code..." />}

      {qrResult && (
        <motion.div className="glass-panel p-4 sm:p-5 space-y-4" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
          <div className="flex flex-col items-center gap-4">
            <img src={qrResult.qrCodeUrl} alt="QR Code gerado" className="w-64 h-64 rounded-xl shadow-lg border-2 border-white" />
            <a href={qrResult.qrCodeUrl} download="qr-code-from-image.png" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium">
              <Download className="w-4 h-4" />
              Baixar QR Code
            </a>
          </div>

          <div className="bg-secondary/30 rounded-lg p-3 text-sm space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Detalhes da Conversão:</span>
            </div>
            <div className="space-y-1 text-xs">
              <p>• Método: {qrResult.method}</p>
              <p>• Tamanho: {qrResult.size}x{qrResult.size}px</p>
              {qrResult.extractedText && (
                <div>
                  <p>• Texto extraído:</p>
                  <div className="bg-background/50 p-2 rounded mt-1 max-h-20 overflow-y-auto">
                    <code className="text-xs">{qrResult.extractedText}</code>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default ImageToQR;
