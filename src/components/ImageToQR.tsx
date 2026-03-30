import { useState, useRef } from "react";
import { QrCode, Download, Loader2, Upload, Image, FileText, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import GeneratingAnimation from "./GeneratingAnimation";

interface ImageToQRProps {
  onResult?: (resultUrl: string, prompt: string) => void;
}

const ImageToQR = ({ onResult }: ImageToQRProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractText, setExtractText] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrResult, setQrResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Imagem muito grande", description: "Máximo de 10MB.", variant: "destructive" });
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast({ title: "Arquivo inválido", description: "Selecione apenas imagens.", variant: "destructive" });
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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
    if (!selectedImage) {
      toast({ title: "Erro", description: "Selecione uma imagem primeiro.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setQrResult(null);
    
    try {
      const imageBase64 = await fileToBase64(selectedImage);
      
      console.log('Converting image to QR code:', { 
        fileName: selectedImage.name,
        extractText,
        fileSize: selectedImage.size 
      });

      const response = await fetch('https://zfstmsgevfhdkhesatzm.supabase.co/functions/v1/image-to-qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpmc3Rtc2dldmZoZGtoZXNhdHptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzU4ODcsImV4cCI6MjA4OTU1MTg4N30.nuXxXZABtzcGLMDxXJXWxZ-NieullIP0_dhNYm0_OMw`,
        },
        body: JSON.stringify({
          imageBase64,
          extractText,
          qrSize: 512
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na conversão: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Falha na conversão da imagem');
      }

      setQrResult(result);
      
      const description = extractText ? 
        `QR de imagem: ${selectedImage.name} (texto extraído)` : 
        `QR de imagem: ${selectedImage.name} (dados da imagem)`;
      
      onResult?.(result.qrCodeUrl, description);
      
      toast({ 
        title: "QR Code gerado!", 
        description: result.message || "Conversão realizada com sucesso." 
      });

    } catch (err: any) {
      console.error("Image to QR error:", err);
      toast({ 
        title: "Erro na conversão", 
        description: err.message || "Tente novamente.", 
        variant: "destructive" 
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const canGenerate = !!selectedImage && !isGenerating;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <motion.div 
        className="text-center space-y-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
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

      {/* Upload Area */}
      <motion.div 
        className="glass-panel p-4 sm:p-5 space-y-4" 
        initial={{ opacity: 0, y: 12 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.3 }}
      >
        <label className="block text-sm font-medium text-foreground mb-2">
          <Image className="w-4 h-4 inline mr-2" />
          Selecionar Imagem (máx. 10MB)
        </label>
        
        <input 
          ref={fileInputRef} 
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleImageChange}
          disabled={isGenerating}
        />
        
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`upload-zone p-8 flex flex-col items-center gap-3 cursor-pointer text-center border-2 border-dashed rounded-xl transition-colors ${
            selectedImage 
              ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20" 
              : "border-border/50 hover:border-border"
          }`}
        >
          <Upload className="w-8 h-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              {selectedImage ? selectedImage.name : "Clique para selecionar uma imagem"}
            </p>
            {selectedImage && (
              <p className="text-xs text-muted-foreground mt-1">
                {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>
        </div>

        {/* Image Preview */}
        {imagePreview && (
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-w-full max-h-48 object-contain rounded-lg shadow-md border-2 border-white"
            />
          </motion.div>
        )}

        {/* Options */}
        <div className="flex items-center space-x-2 p-3 bg-secondary/30 rounded-lg">
          <Switch
            id="extract-text"
            checked={extractText}
            onCheckedChange={setExtractText}
            disabled={isGenerating}
          />
          <Label htmlFor="extract-text" className="text-sm">
            <FileText className="w-4 h-4 inline mr-2" />
            Extrair texto da imagem (recomendado)
          </Label>
        </div>

        <Button 
          onClick={handleGenerate} 
          disabled={!canGenerate} 
          className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
        >
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

      {/* Result */}
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
                download="qr-code-from-image.png"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Baixar QR Code
              </a>
            </div>
          </div>
          
          {/* Details */}
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