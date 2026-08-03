import { useState } from "react";
import { Film, Sparkles, Download, Loader2, Video as VideoIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateImage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import GeneratingAnimation from "@/components/GeneratingAnimation";
import { framesToVideo } from "@/lib/videoExport";

interface VideoFrameGeneratorProps {
  onResult?: (resultUrl: string, prompt: string) => void;
}

type AspectRatio = "16:9" | "9:16" | "1:1" | "4:3";
type StyleOption = "livre" | "anime" | "cartoon" | "hq" | "caricatura" | "lego" | "adesivo" | "avatar";

/** Duração total do vídeo (segundos) → nº de imagens-chave usadas internamente. */
const keyframesForDuration = (seconds: number) =>
  Math.min(12, Math.max(3, Math.round(seconds / 2.5)));

const aspectOptions: { value: AspectRatio; label: string }[] = [
  { value: "16:9", label: "16:9 (Paisagem)" },
  { value: "9:16", label: "9:16 (Retrato)" },
  { value: "1:1", label: "1:1 (Quadrado)" },
  { value: "4:3", label: "4:3 (Clássico)" },
];

const durationOptions = [5, 10, 15, 20];



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
  const [duration, setDuration] = useState(10);
  const [style, setStyle] = useState<StyleOption>("livre");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [frames, setFrames] = useState<string[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoExt, setVideoExt] = useState<"mp4" | "webm">("mp4");
  const { toast } = useToast();

  const keyframes = keyframesForDuration(duration);
  const secondsPerFrame = duration / keyframes;


  const buildVideo = async (frameUrls: string[]) => {
    const dimensions = getDimensions(aspectRatio);
    setIsRendering(true);
    setRenderProgress(0);
    try {
      const result = await framesToVideo(frameUrls, {
        width: dimensions.width,
        height: dimensions.height,
        secondsPerFrame,
        onProgress: setRenderProgress,
      });
      setVideoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return result.url;
      });
      setVideoExt(result.extension);
      toast({
        title: "Vídeo pronto!",
        description: `Arquivo .${result.extension} gerado com ${frameUrls.length} cenas.`,
      });
    } catch (err: any) {
      console.error("Video render error:", err);
      toast({
        title: "Erro ao montar o vídeo",
        description: err.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsRendering(false);
    }
  };

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
    setVideoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    const generatedFrames: string[] = [];
    const dimensions = getDimensions(aspectRatio);
    const stylePrompt = getStylePrompt(style);

    try {
      for (let i = 0; i < keyframes; i++) {
        const frameNumber = i + 1;
        const framePrompt = `${prompt}${stylePrompt ? `, ${stylePrompt}` : ""}, continuous cinematic shot, moment ${frameNumber} of ${keyframes} in one uninterrupted take, same characters, same location, same lighting and color grading, seamless progression`;

        const imageUrl = await generateImage(framePrompt);

        if (imageUrl) {
          generatedFrames.push(imageUrl);
          setFrames([...generatedFrames]);
          setProgress(((i + 1) / keyframes) * 100);
        }
      }

      // Add first frame to gallery
      if (generatedFrames[0]) {
        onResult?.(generatedFrames[0], prompt);
      }

      setIsGenerating(false);
      if (generatedFrames.length > 0) {
        await buildVideo(generatedFrames);
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

  const handleDownloadVideo = () => {
    if (!videoUrl) return;
    const link = document.createElement("a");
    link.href = videoUrl;
    link.download = `video-${Date.now()}.${videoExt}`;
    link.click();
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

        {/* Duração do vídeo */}
        <motion.div
          className="glass-panel-premium p-5"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h4 className="text-sm font-medium mb-3">Duração do vídeo</h4>
          <div className="grid grid-cols-4 gap-2">
            {durationOptions.map((secs) => (
              <button
                key={secs}
                onClick={() => setDuration(secs)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  duration === secs
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted/50 hover:bg-muted"
                }`}
              >
                {secs}s
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

      {/* Duration per scene */}
      <motion.div
        className="glass-panel-premium p-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Duração de cada cena</h4>
          <span className="text-xs text-muted-foreground">
            {secondsPerFrame.toFixed(1)}s · vídeo de ~{(secondsPerFrame * frameCount).toFixed(1)}s
          </span>
        </div>
        <input
          type="range"
          min={0.5}
          max={4}
          step={0.5}
          value={secondsPerFrame}
          onChange={(e) => setSecondsPerFrame(Number(e.target.value))}
          className="w-full accent-primary"
        />
      </motion.div>

      {/* Generate Button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating || isRendering}
          className="w-full h-12 text-base gap-2 shadow-lg shadow-primary/20"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Gerando cena {frames.length + 1} de {frameCount}...
            </>
          ) : isRendering ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Montando vídeo... {renderProgress}%
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Gerar Vídeo ({frameCount} cenas)
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

      {/* Video Player */}
      <AnimatePresence>
        {videoUrl && (
          <motion.div
            className="glass-panel-premium p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold flex items-center gap-2">
                <VideoIcon className="w-5 h-5 tool-videoframes" />
                Vídeo gerado (.{videoExt})
              </h3>
              <Button size="sm" onClick={handleDownloadVideo} className="gap-2">
                <Download className="w-4 h-4" /> Baixar vídeo
              </Button>
            </div>
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              playsInline
              className="w-full rounded-xl border border-border/50 bg-black"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default VideoFrameGenerator;
