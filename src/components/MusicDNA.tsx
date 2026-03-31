import { useState } from "react";
import { Music, Loader2, Download, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { analyzeMusic as analyzeMusicApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MusicDNAProps {
  onResult?: (resultUrl: string, prompt: string) => void;
}

const getYouTubeVideoId = (url: string): string | null => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
};

const MusicDNA = ({ onResult }: MusicDNAProps) => {
  const [link, setLink] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!link.trim()) return;
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const data = await analyzeMusicApi(link.trim());
      setAnalysis(data.analysis);

      const videoId = getYouTubeVideoId(link);
      if (videoId) setThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`);

      onResult?.("", `Music DNA: ${link}`);
      toast({ title: "Análise concluída!" });
    } catch (err: any) {
      console.error("Music DNA error:", err);
      toast({ title: "Erro na análise", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDownloadClick = () => {
    const videoId = getYouTubeVideoId(link);
    if (!videoId) {
      toast({ title: "Link inválido", description: "Insira um link válido do YouTube.", variant: "destructive" });
      return;
    }
    window.open(`https://yout.com/video/?url=https://www.youtube.com/watch?v=${videoId}`, "_blank", "noopener,noreferrer");
  };

  const hasYouTubeLink = !!getYouTubeVideoId(link);

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <label className="block text-sm font-medium text-foreground mb-2">Cole o link da música ou nome do artista</label>
        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtube.com/watch?v=... ou nome da música/artista" className="mb-3 bg-secondary/50 border-border/50" disabled={isAnalyzing} />
        <Button onClick={handleAnalyze} disabled={!link.trim() || isAnalyzing} className="w-full">
          {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" />Analisando música...</> : <><Music className="w-4 h-4" />Analisar Música</>}
        </Button>
      </motion.div>

      {analysis && (
        <motion.div className="glass-panel p-4 sm:p-5 space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {thumbnail && (
            <div className="flex items-center gap-4 pb-4 border-b border-border/30">
              <img src={thumbnail} alt="Thumbnail" className="w-24 h-24 rounded-lg object-cover flex-shrink-0" />
              <div>
                <p className="text-sm text-muted-foreground">Análise completa da música</p>
                {hasYouTubeLink && (
                  <Button onClick={handleDownloadClick} className="mt-2" size="sm" variant="outline">
                    <Download className="w-4 h-4" /> Baixar MP3 <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground/90">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default MusicDNA;
