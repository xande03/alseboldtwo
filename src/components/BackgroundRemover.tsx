import { useState } from "react";
import { Download, Loader2, Paintbrush, Upload } from "lucide-react";
import { removeBackground as removeBackgroundApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import UploadZone from "./UploadZone";
import GeneratingAnimation from "./GeneratingAnimation";

const PRESET_COLORS = [
  { label: "Branco", value: "#FFFFFF" },
  { label: "Preto", value: "#000000" },
  { label: "Vermelho", value: "#EF4444" },
  { label: "Azul", value: "#3B82F6" },
  { label: "Verde", value: "#22C55E" },
  { label: "Amarelo", value: "#EAB308" },
  { label: "Rosa", value: "#EC4899" },
  { label: "Roxo", value: "#A855F7" },
];

interface BackgroundRemoverProps {
  onResult?: (imageUrl: string, resultUrl: string, prompt: string) => void;
}

const BackgroundRemover = ({ onResult }: BackgroundRemoverProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customColor, setCustomColor] = useState("#FFFFFF");
  const { toast } = useToast();

  const handleImageSelect = (file: File, previewUrl: string) => {
    setSelectedFile(file);
    setPreview(previewUrl);
    setResultUrl(null);
  };

  const compressImage = async (dataUrl: string, maxWidth = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/png", 0.9));
      };
      img.src = dataUrl;
    });
  };

  const handleRemoveBackground = async (newBackground?: string) => {
    if (!preview) return;
    setIsProcessing(true);
    try {
      const compressed = await compressImage(preview);
      const { data, error } = await supabase.functions.invoke("remove-background", {
        body: { imageBase64: compressed, newBackground },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResultUrl(data.resultUrl);
      onResult?.(preview, data.resultUrl, newBackground ? `Fundo: ${newBackground}` : "Fundo removido");
      toast({ title: "Fundo removido!", description: "Imagem processada com sucesso." });
    } catch (err: any) {
      console.error("BG removal error:", err);
      toast({ title: "Erro no processamento", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackgroundImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => handleRemoveBackground(reader.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="glass-panel p-3 sm:p-4">
        {resultUrl ? (
          <div className="space-y-3">
            <div
              className="relative rounded-lg overflow-hidden flex items-center justify-center min-h-[200px]"
              style={{
                backgroundImage: "repeating-conic-gradient(hsl(var(--muted)) 0% 25%, transparent 0% 50%)",
                backgroundSize: "20px 20px",
              }}
            >
              <img src={resultUrl} alt="Resultado" className="max-h-[60vh] object-contain" loading="lazy" />
            </div>
            <a
              href={resultUrl}
              download
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" />
              Baixar PNG
            </a>
          </div>
        ) : (
          <UploadZone onImageSelect={handleImageSelect} currentPreview={preview} />
        )}
      </div>

      {isProcessing && <GeneratingAnimation label="Removendo fundo..." />}

      {preview && !isProcessing && (
        <div className="glass-panel p-4 sm:p-5 space-y-4">
          <h3 className="font-display text-sm font-semibold text-foreground flex items-center gap-2">
            <Paintbrush className="w-4 h-4 text-primary" />
            Opções de fundo
          </h3>

          <button
            onClick={() => handleRemoveBackground()}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paintbrush className="w-4 h-4" />}
            {isProcessing ? "Processando..." : "Remover fundo (transparente)"}
          </button>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Trocar fundo por cor:</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => handleRemoveBackground(c.value)}
                  disabled={isProcessing}
                  className="w-8 h-8 rounded-lg border border-border hover:scale-110 transition-transform disabled:opacity-50"
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
              <label className="relative w-8 h-8 rounded-lg border border-border overflow-hidden hover:scale-110 transition-transform cursor-pointer">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  onBlur={() => handleRemoveBackground(customColor)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={isProcessing}
                />
                <div className="w-full h-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500" />
              </label>
            </div>
          </div>

          <button
            onClick={handleBackgroundImage}
            disabled={isProcessing}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            Usar imagem como fundo
          </button>
        </div>
      )}
    </div>
  );
};

export default BackgroundRemover;
