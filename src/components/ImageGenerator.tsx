import { useState, useCallback } from "react";
import { Sparkles, Download, Loader2, Brush, Layers, PenTool, Presentation, Monitor, Sticker, Unlock, BookOpen, UserCircle, Upload, X } from "lucide-react";
import { motion } from "framer-motion";
import { generateImage as generateImageApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import GeneratingAnimation from "./GeneratingAnimation";

type CreationMode = "livre" | "caricatura" | "logomarca" | "designer" | "slide" | "webui" | "adesivo" | "hq" | "anime" | "cartoon" | "avatar" | "lego";

const creationModes: { value: CreationMode; label: string; icon: typeof Sparkles; description: string }[] = [
  { value: "livre", label: "Livre", icon: Unlock, description: "Sem restrição de estilo" },
  { value: "avatar", label: "Avatar", icon: UserCircle, description: "Avatar pelo rosto" },
  { value: "caricatura", label: "Caricatura", icon: Brush, description: "Estilo caricatura exagerada" },
  { value: "cartoon", label: "Cartoon", icon: Brush, description: "Estilo cartoon ocidental" },
  { value: "logomarca", label: "Logomarca", icon: PenTool, description: "Logo profissional" },
  { value: "designer", label: "Designer", icon: Layers, description: "Arte/design gráfico" },
  { value: "slide", label: "Slide", icon: Presentation, description: "Visual para apresentação" },
  { value: "webui", label: "Web UI", icon: Monitor, description: "Interface web/app" },
  { value: "adesivo", label: "Adesivo", icon: Sticker, description: "Sticker com contorno" },
  { value: "hq", label: "HQ", icon: BookOpen, description: "Estilo quadrinhos/graphic novel" },
  { value: "anime", label: "Anime", icon: Sparkles, description: "Estilo anime/manga japonês" },
  { value: "lego", label: "Lego", icon: Layers, description: "Estilo Lego / blocos" },
];

const modeDefaultPrompts: Record<CreationMode, { withImage: string; withoutImage: string }> = {
  livre: { withImage: "", withoutImage: "" },
  avatar: { withImage: "Transforme esta foto em um avatar estilizado focado no rosto, fundo limpo, estilo digital art", withoutImage: "Crie um avatar estilizado de uma pessoa, fundo limpo, estilo digital art" },
  caricatura: { withImage: "Transforme esta imagem em caricatura exagerada com proporções humorísticas", withoutImage: "Crie uma caricatura exagerada com proporções humorísticas" },
  cartoon: { withImage: "Transforme esta imagem em estilo cartoon ocidental com contornos marcantes e cores vibrantes", withoutImage: "Crie uma imagem em estilo cartoon ocidental com contornos marcantes" },
  logomarca: { withImage: "Transforme esta imagem em uma logomarca profissional e minimalista", withoutImage: "Crie uma logomarca profissional e minimalista" },
  designer: { withImage: "Transforme esta imagem em arte/design gráfico moderno e visualmente impactante", withoutImage: "Crie uma composição de design gráfico moderno e visualmente impactante" },
  slide: { withImage: "Transforme esta imagem em um visual para apresentação profissional", withoutImage: "Crie um visual para apresentação profissional e limpo" },
  webui: { withImage: "Transforme esta imagem em um mockup de interface web moderna", withoutImage: "Crie um mockup de interface web moderna e profissional" },
  adesivo: { withImage: "Transforme esta imagem em um adesivo/sticker com contorno branco, estilo cartoon, colorido", withoutImage: "Crie um adesivo/sticker divertido com contorno branco e cores vibrantes" },
  hq: { withImage: "Transforme esta imagem em estilo de quadrinhos/HQ com contornos em tinta e sombreamento dramático", withoutImage: "Crie uma cena em estilo de quadrinhos/HQ com contornos em tinta" },
  anime: { withImage: "Transforme esta imagem em estilo anime/manga japonês com cores vibrantes e olhos expressivos", withoutImage: "Crie uma imagem em estilo anime/manga japonês com cores vibrantes" },
  lego: { withImage: "Transforme esta imagem em estilo LEGO, personagens e objetos feitos de blocos LEGO, textura plástica, cores primárias vibrantes", withoutImage: "Crie uma cena em estilo LEGO com personagens e objetos feitos de blocos LEGO, textura plástica, cores primárias" },
};

const presets = [
  "Paisagem futurista com neon",
  "Retrato realista cinematográfico",
  "Arte digital abstrata vibrante",
  "Natureza em alta definição",
];

interface ImageGeneratorProps {
  onResult?: (resultUrl: string, prompt: string) => void;
}

const ImageGenerator = ({ onResult }: ImageGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [creationMode, setCreationMode] = useState<CreationMode>("livre");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleModeChange = useCallback((mode: CreationMode) => {
    setCreationMode(mode);
    if (mode === "livre") return;
    const defaults = modeDefaultPrompts[mode];
    const autoPrompt = uploadedImage ? defaults.withImage : defaults.withoutImage;
    if (autoPrompt) setPrompt(autoPrompt);
  }, [uploadedImage]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "Máximo de 10MB.", variant: "destructive" });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedImage(result);
      // Auto-fill prompt if a mode is selected
      if (creationMode !== "livre") {
        const defaults = modeDefaultPrompts[creationMode];
        if (defaults.withImage) setPrompt(defaults.withImage);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    if (creationMode !== "livre") {
      const defaults = modeDefaultPrompts[creationMode];
      if (defaults.withoutImage) setPrompt(defaults.withoutImage);
    }
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

  const handleGenerate = async () => {
    if (!prompt.trim() && !uploadedImage) return;
    setIsGenerating(true);
    setGeneratedUrl(null);

    try {
      let imageBase64: string | undefined;
      if (uploadedImage) {
        imageBase64 = await compressImage(uploadedImage);
      }

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt: prompt.trim() || "Generate based on this image", creationMode, imageBase64 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setGeneratedUrl(data.imageUrl);
      onResult?.(data.imageUrl, prompt);
      toast({ title: "Imagem gerada!", description: "Sua imagem foi criada com sucesso." });
    } catch (err: any) {
      console.error("Generate error:", err);
      toast({ title: "Erro na geração", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Upload Zone */}
      <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <label className="block text-sm font-medium text-foreground mb-3">
          Imagem de referência <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        {uploadedImage ? (
          <div className="relative inline-block">
            <img src={uploadedImage} alt="Referência" className="max-h-48 rounded-lg border border-border/40" />
            <button onClick={removeImage} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-border/50 cursor-pointer hover:border-primary/40 transition-colors">
            <Upload className="w-6 h-6 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Clique para fazer upload</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isGenerating} />
          </label>
        )}
      </motion.div>

      {/* Creation Mode */}
      <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
        <label className="block text-sm font-medium text-foreground mb-3">Modo de Criação</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {creationModes.map((mode) => (
            <motion.button
              key={mode.value}
              onClick={() => handleModeChange(mode.value)}
              disabled={isGenerating}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-colors disabled:opacity-50 ${
                creationMode === mode.value
                  ? "bg-primary/15 border-primary/40 text-primary"
                  : "bg-secondary/30 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              <mode.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{mode.label}</span>
              <span className="text-[10px] opacity-70 leading-tight">{mode.description}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Prompt */}
      <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
        <label className="block text-sm font-medium text-foreground mb-2">Descreva a imagem que deseja gerar</label>
        <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ex: Um gato astronauta flutuando no espaço com a Terra ao fundo..." className="mb-3 min-h-[100px] bg-secondary/50 border-border/50" disabled={isGenerating} />
        <div className="flex flex-wrap gap-2 mb-4">
          {presets.map((p) => (
            <motion.button key={p} onClick={() => setPrompt(p)} disabled={isGenerating} className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              {p}
            </motion.button>
          ))}
        </div>
        <Button onClick={handleGenerate} disabled={(!prompt.trim() && !uploadedImage) || isGenerating} className="w-full">
          {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando imagem...</> : <><Sparkles className="w-4 h-4" />Gerar Imagem</>}
        </Button>
      </motion.div>

      {/* Loading animation */}
      {isGenerating && <GeneratingAnimation />}

      {generatedUrl && (
        <motion.div className="glass-panel p-3 sm:p-4 space-y-3" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
          <img src={generatedUrl} alt="Imagem gerada por IA" className="w-full rounded-lg" loading="lazy" />
          <a href={generatedUrl} download target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
            <Download className="w-4 h-4" />Baixar imagem
          </a>
        </motion.div>
      )}
    </div>
  );
};

export default ImageGenerator;
