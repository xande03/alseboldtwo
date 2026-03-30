import { useState } from "react";
import { Wand2, Download, Loader2, Type } from "lucide-react";
import { motion } from "framer-motion";
import { editImage as editImageApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import UploadZone from "./UploadZone";
import ImageTextOverlay from "./ImageTextOverlay";
import GeneratingAnimation from "./GeneratingAnimation";

const presets = [
  "Adicione um chapéu vermelho",
  "Remova o fundo e substitua por um pôr do sol",
  "Transforme em desenho animado",
  "Adicione óculos escuros",
];

interface ImageEditorProps {
  onResult?: (imageUrl: string, resultUrl: string, prompt: string) => void;
}

const ImageEditor = ({ onResult }: ImageEditorProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [showTextOverlay, setShowTextOverlay] = useState(false);
  const { toast } = useToast();

  const handleImageSelect = (file: File, previewUrl: string) => {
    setSelectedFile(file);
    setPreview(previewUrl);
    setResultUrl(null);
    setShowTextOverlay(false);
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
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = dataUrl;
    });
  };

  const handleEdit = async () => {
    if (!preview || !prompt.trim()) return;
    setIsProcessing(true);
    setResultUrl(null);
    try {
      const compressed = await compressImage(preview);
      const resultImage = await editImageApi(compressed, prompt);
      setResultUrl(resultImage);
      onResult?.(preview, resultImage, prompt);
      toast({ title: "Imagem editada!", description: "Sua edição foi aplicada com sucesso." });
    } catch (err: any) {
      console.error("Edit error:", err);
      toast({ title: "Erro na edição", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextOverlayDone = (dataUrl: string) => {
    setResultUrl(dataUrl);
    setShowTextOverlay(false);
    onResult?.(preview!, dataUrl, "Texto inserido na imagem");
    toast({ title: "Texto inserido!", description: "Imagem com texto gerada com sucesso." });
  };

  if (showTextOverlay && preview) {
    return <ImageTextOverlay imageSrc={preview} onDone={handleTextOverlayDone} onCancel={() => setShowTextOverlay(false)} />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div className="glass-panel p-3 sm:p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {resultUrl ? (
          <div className="space-y-3">
            <motion.img src={resultUrl} alt="Imagem editada" className="w-full rounded-lg" loading="lazy" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }} />
            <a href={resultUrl} download target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
              <Download className="w-4 h-4" />Baixar imagem editada
            </a>
            <Button variant="outline" onClick={() => setResultUrl(null)} className="ml-2">Editar novamente</Button>
          </div>
        ) : (
          <UploadZone onImageSelect={handleImageSelect} currentPreview={preview} />
        )}
      </motion.div>

      {isProcessing && <GeneratingAnimation label="Editando imagem..." />}

      {preview && !resultUrl && !isProcessing && (
        <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Button variant="outline" onClick={() => setShowTextOverlay(true)} className="w-full mb-4">
            <Type className="w-4 h-4" />Inserir Texto na Imagem
          </Button>
          <label className="block text-sm font-medium text-foreground mb-2">Descreva o que deseja editar na imagem</label>
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ex: Adicione um chapéu vermelho na pessoa..." className="mb-3 min-h-[100px] bg-secondary/50 border-border/50" disabled={isProcessing} />
          <div className="flex flex-wrap gap-2 mb-4">
            {presets.map((p) => (
              <motion.button key={p} onClick={() => setPrompt(p)} disabled={isProcessing} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                {p}
              </motion.button>
            ))}
          </div>
          <Button onClick={handleEdit} disabled={!prompt.trim() || isProcessing} className="w-full">
            <Wand2 className="w-4 h-4" />Editar Imagem
          </Button>
        </motion.div>
      )}
    </div>
  );
};

export default ImageEditor;
