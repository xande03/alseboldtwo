import { useState } from "react";
import { Music, Loader2, Download, User, Disc, Gauge, KeyRound, Guitar, FileText, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface MusicResult {
  title: string;
  artist: string;
  band: string;
  genre: string;
  bpm: string;
  key: string;
  lyrics: string;
  thumbnail?: string;
}

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
  const [result, setResult] = useState<MusicResult | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!link.trim()) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-music", {
        body: { link: link.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (!data.thumbnail) {
        const videoId = getYouTubeVideoId(link);
        if (videoId) data.thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
      setResult(data);
      onResult?.("", `Music DNA: ${data.title || data.artist}`);
      toast({ title: "Análise concluída!", description: `${data.artist} identificado com sucesso.` });
    } catch (err: any) {
      console.error("Music DNA error:", err);
      toast({ title: "Erro na análise", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportLyricsPDF = () => {
    if (!result?.lyrics) return;
    const content = `${result.title}\n${result.artist} - ${result.band}\nGênero: ${result.genre} | BPM: ${result.bpm} | Tom: ${result.key}\n\n${result.lyrics}`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.artist}-letra.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadClick = () => {
    const videoId = getYouTubeVideoId(link);
    if (!videoId) {
      toast({ title: "Link inválido", description: "Insira um link válido do YouTube.", variant: "destructive" });
      return;
    }
    const url = `https://yout.com/video/?url=https://www.youtube.com/watch?v=${videoId}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const metaCards = result
    ? [
        { icon: User, label: "Artista", value: result.artist },
        { icon: Disc, label: "Banda", value: result.band },
        { icon: Guitar, label: "Gênero", value: result.genre },
        { icon: Gauge, label: "BPM", value: result.bpm },
        { icon: KeyRound, label: "Tom", value: result.key },
      ]
    : [];

  const hasYouTubeLink = !!getYouTubeVideoId(link);

  return (
    <div className="space-y-4 sm:space-y-6">
      <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <label className="block text-sm font-medium text-foreground mb-2">Cole o link da música (YouTube, Spotify, etc.)</label>
        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://youtube.com/watch?v=... ou https://open.spotify.com/track/..." className="mb-3 bg-secondary/50 border-border/50" disabled={isAnalyzing} />
        <Button onClick={handleAnalyze} disabled={!link.trim() || isAnalyzing} className="w-full">
          {isAnalyzing ? <><Loader2 className="w-4 h-4 animate-spin" />Analisando música...</> : <><Music className="w-4 h-4" />Analisar Música</>}
        </Button>
      </motion.div>

      {result && (
        <>
          {(result.thumbnail || result.title) && (
            <motion.div className="glass-panel p-4 sm:p-5 flex items-center gap-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.05 }}>
              {result.thumbnail && <img src={result.thumbnail} alt={result.title || "Thumbnail"} className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg object-cover flex-shrink-0" />}
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">{result.title}</h2>
                <p className="text-sm text-muted-foreground">{result.artist}{result.band !== result.artist ? ` • ${result.band}` : ""}</p>
                {hasYouTubeLink && (
                  <Button onClick={handleDownloadClick} className="mt-3" size="sm">
                    <Download className="w-4 h-4" />
                    Baixar MP3
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            {metaCards.map((card, i) => (
              <motion.div key={card.label} className="glass-panel-elevated p-4 flex flex-col items-center gap-2 text-center hover:border-primary/30 transition-all" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + i * 0.05 }}>
                <card.icon className="w-5 h-5 text-primary" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.label}</span>
                <span className="text-sm font-medium text-foreground leading-tight">{card.value || "—"}</span>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2"><FileText className="w-4 h-4" />Letra da Música</h3>
              <Button variant="outline" size="sm" onClick={exportLyricsPDF}><Download className="w-3.5 h-3.5 mr-1.5" />Exportar</Button>
            </div>
            <div className="max-h-[400px] overflow-y-auto rounded-lg bg-secondary/30 p-4 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {result.lyrics || "Letra não disponível."}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
};

export default MusicDNA;
