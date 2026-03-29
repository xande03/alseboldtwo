import { useState } from "react";
import { Film, Sparkles, Download, Loader2, Image as ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import GeneratingAnimation from "@/components/GeneratingAnimation";

interface VideoFrameGeneratorProps {
  onResult?: (resultUrl: string, prompt: string) => void;
}

type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3";
type FrameCount = 4 | 6 | 8 | 12;
type StyleOption = "livre" | "anime" | "cartoon" | "hq" | "caricatura" | "lego" | "adesivo" | "avatar";

const aspectOptions: { value: AspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9 (Paisagem)" },
  { value: "9:16", label: "9:16 (Retrato)" },
  { value: "1:1", label: "1:1 (Quadrado)" },
  { value: "4:3", label: "4:3 (Clássico)" },
];

const frameOptions: FrameCount[] = [4, 6, 8, 12];

const styleOptions: { value: StyleOption; label: string }[] = [
  { value: "livre", label: "Livre" },
  { value: "anime", label: "Anime" },
  { value: "cartoon", label: "Cartoon" },
  { value: "hq", label: "HQ/Comics" },
  { value: "caricatura", label: "Caricatura" },
  { value: "lego", label: "Lego" },
  { value: "adesivo", label: "Adesivo" },
  { value: "avatar", label: "Avatar" },
];

const getDimensions = (ratio: AspectRatio): { width: number; height: number } => {
  switch (ratio) {
    case "16:9": return { width: 1024, height: 576 };
    case "9:16": return { width: 576, height: 1024 };
    case "1:1": return { width: 768, height: 768 };
    case "4:3": return { width: 896, height: 672 };
    default: return { width: 1024, height: 576 };
  }
};

const getStylePrompt = (style: StyleOption): string => {
  switch (style) {
    case "anime": return "anime style, japanese animation, vibrant colors, detailed";
    case "cartoon": return "cartoon style, animated, colorful, fun";
    case "hq": return "comic book style, bold lines, dramatic shading, superhero aesthetic";
    case "caricatura": return "caricature style, exaggerated features, humorous";
    case "lego": return "lego style, brick-built, plastic toy aesthetic";
    case "adesivo": return "sticker style, cute, kawaii, simple shapes, white outline";
    case "avatar": return "digital avatar style, 3D rendered, modern, clean";
    default: return "";
  }
};

const VideoFrameGenerator = ({ onResult }: VideoFrameGeneratorProps) => {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("16:9");
  const [frameCount, setFrameCount] = useState<FrameCount>(4);
  const [style, setStyle] = useState<StyleOption>("livre");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Prompt vazio",
        description: "Descreva a cena que deseja gerar.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setFrames([]);

    const generatedFrames: string[] = [];
    const dimensions = getDimensions(aspectRatio);
    const stylePrompt = getStylePrompt(style);

    try {
      for (let i = 0; i < frameCount; i++) {
        const frameNumber = i + 1;
        const framePrompt = `${prompt}${stylePrompt ? `, ${stylePrompt}` : ""}, frame ${frameNumber} of ${frameCount}, cinematic sequence, consistent style`;

        const { data, error } = await supabase.functions.invoke("generate-image", {
          body: {
            prompt: framePrompt,
            width: dimensions.width,
            height: dimensions.height,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        if (data?.imageUrl) {
          generatedFrames.push(data.imageUrl);
          setFrames([...generatedFrames]);
          setProgress(((i + 1) / frameCount) * 100);
        }
      }

      toast({
        title: "Frames gerados!",
        description: `${frameCount} frames criados com sucesso.`,
      });

      // Add first frame to gallery
      if (generatedFrames[0]) {
        onResult?.(generatedFrames[0], prompt);
      }
    } catch (err: any) {
      console.error("Frame generation error:", err);
      toast({
        title: "Erro na geração",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadFrame = (url: string, index: number) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `frame-${index + 1}.png`;
    link.target = "_blank";
    link.click();
  };

  const handleDownloadAll = async () => {
    frames.forEach((url, i) => {
      setTimeout(() => handleDownloadFrame(url, i), i * 500);
    });
    toast({
      title: "Download iniciado",
      description: "Todos os frames estão sendo baixados.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Prompt Input */}
      <motion.div
        className="glass-panel-premium p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Film className="w-5 h-5 tool-videoframes" />
          <h3 className="font-display font-semibold">Descreva a cena</h3>
        </div>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ex: Um astronauta caminhando na lua, com a Terra ao fundo..."
          className="min-h-[100px] resize-none bg-background/50 border-border/50 focus:border-primary/50"
        />
      </motion.div>

      {/* Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Aspect Ratio */}
        <motion.div
          className="glass-panel-premium p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h4 className="text-sm font-medium mb-3">Proporção</h4>
          <div className="grid grid-cols-2 gap-2">
            {aspectOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAspectRatio(opt.value)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  aspectRatio === opt.value
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Frame Count */}
        <motion.div
          className="glass-panel-premium p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h4 className="text-sm font-medium mb-3">Quantidade de frames</h4>
          <div className="grid grid-cols-4 gap-2">
            {frameOptions.map((count) => (
              <button
                key={count}
                onClick={() => setFrameCount(count)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  frameCount === count
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {count}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Style */}
        <motion.div
          className="glass-panel-premium p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h4 className="text-sm font-medium mb-3">Estilo visual</h4>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as StyleOption)}
            className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            {styleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </motion.div>
      </div>

      {/* Generate Button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full h-12 text-base gap-2 shadow-lg shadow-primary/20"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Gerando frame {frames.length + 1} de {frameCount}...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar {frameCount} Frames
            </>
          )}
        </Button>

        {/* Progress Bar */}
        {isGenerating && (
          <div className="mt-3">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              {Math.round(progress)}% concluído
            </p>
          </div>
        )}
      </motion.div>

      {/* Generating Animation */}
      <AnimatePresence>
        {isGenerating && frames.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <GeneratingAnimation />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Grid */}
      <AnimatePresence>
        {frames.length > 0 && (
          <motion.div
            className="glass-panel-premium p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold">Frames Gerados</h3>
              {frames.length > 1 && (
                <Button variant="outline" size="sm" onClick={handleDownloadAll} className="gap-2">
                  <Download className="w-4 h-4" /> Baixar Todos
                </Button>
              )}
            </div>

            <div className={`grid gap-4 ${
              aspectRatio === "9:16" ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"
            }`}>
              {frames.map((url, i) => (
                <motion.div
                  key={i}
                  className="relative group rounded-xl overflow-hidden border border-border/50"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <img
                    src={url}
                    alt={`Frame ${i + 1}`}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownloadFrame(url, i)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" /> Frame {i + 1}
                    </Button>
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-medium">
                    {i + 1}/{frameCount}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoFrameGenerator;
