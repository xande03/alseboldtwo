import { useState, useCallback } from "react";
import { Download, Wifi, WifiOff, MonitorSmartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { upscaleImage } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useSessionHistory } from "@/hooks/useSessionHistory";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar, { type ToolView } from "@/components/AppSidebar";
import UploadZone from "@/components/UploadZone";
import PromptInput from "@/components/PromptInput";
import ImageComparison from "@/components/ImageComparison";
import AspectRatioSelector, { type AspectRatioOption } from "@/components/AspectRatioSelector";
import BackgroundRemover from "@/components/BackgroundRemover";
import ImageGenerator from "@/components/ImageGenerator";
import ImageEditor from "@/components/ImageEditor";
import QRCodeGenerator from "@/components/QRCodeGenerator";
import ImageToQR from "@/components/ImageToQR";
import MusicDNA from "@/components/MusicDNA";
import AIChat from "@/components/AIChat";
import GalleryView from "@/components/GalleryView";
import DocumentConverter from "@/components/DocumentConverter";
import TextSummarizer from "@/components/TextSummarizer";
import SignatureGenerator from "@/components/SignatureGenerator";
import VideoFrameGenerator from "@/components/VideoFrameGenerator";


const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const Index = () => {
  const [activeView, setActiveView] = useState<ToolView>("upscale");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [upscaledUrl, setUpscaledUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioOption>("original");
  const { toast } = useToast();
  const { canInstall, isOnline, install } = usePWAInstall();
  const { allItems, addItem, removeItem } = useSessionHistory();

  const handleImageSelect = (file: File, previewUrl: string) => {
    setSelectedFile(file);
    setPreview(previewUrl);
    setUpscaledUrl(null);
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

  const handleUpscale = async () => {
    if (!selectedFile || !preview || !prompt.trim()) return;
    setIsProcessing(true);
    try {
      const compressed = await compressImage(preview);
      const upscaledUrl = await upscaleImage(compressed, prompt, 2);

      setUpscaledUrl(upscaledUrl);
      addItem({ imageUrl: preview, resultUrl: upscaledUrl, prompt, tool: "upscale" });
      toast({ title: "Upscale concluído!", description: "Sua imagem foi aprimorada com sucesso." });
    } catch (err: any) {
      console.error("Upscale error:", err);
      toast({ title: "Erro no processamento", description: err.message || "Tente novamente.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const viewTitles: Record<ToolView, string> = {
    upscale: "Upscale de Imagem",
    bgremove: "Remover Fundo",
    generate: "Gerar Imagem",
    edit: "Editar Imagem",
    qrcode: "QR Code Generator",
    imagetoqr: "Imagem para QR",
    musicdna: "Music DNA",
    chat: "Chat IA",
    converter: "Conversor de Documentos",
    summarizer: "Resumidor de Texto",
    signature: "Assinatura Digital",
    videoframes: "Gerador de Frames",
    gallery: "Galeria",
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar activeView={activeView} onViewChange={setActiveView} />

        <div className="flex-1 flex flex-col min-w-0">
          {!isOnline && (
            <div className="bg-destructive/20 border-b border-destructive/30 px-4 py-2 text-center text-sm text-destructive flex items-center justify-center gap-2">
              <WifiOff className="w-4 h-4" />
              Você está offline. Algumas funcionalidades podem não estar disponíveis.
            </div>
          )}

          <header className="border-b border-border/40 bg-background/70 backdrop-blur-xl sticky top-0 z-50 shadow-[0_1px_12px_-4px_hsl(var(--primary)/0.08)]">
            <div className="px-4 sm:px-6 h-14 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground" />
                <h2 className="font-display text-lg font-semibold text-foreground">{viewTitles[activeView]}</h2>
              </div>

              <div className="flex items-center gap-2">
                <div className={`hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full ${isOnline ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? "Online" : "Offline"}
                </div>
                {canInstall && (
                  <button onClick={install} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
                    <MonitorSmartphone className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Instalar</span>
                  </button>
                )}
                
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
            <AnimatePresence mode="wait">
              {activeView === "upscale" && (
                <motion.div key="upscale" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }} className="space-y-4 sm:space-y-6">
                  <motion.div className="glass-panel p-3 sm:p-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    {upscaledUrl && preview ? (
                      <div className="space-y-3 sm:space-y-4">
                        <ImageComparison originalUrl={preview} upscaledUrl={upscaledUrl} />
                        <a href={upscaledUrl} download target="_blank" rel="noopener" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium">
                          <Download className="w-4 h-4" />
                          Baixar imagem aprimorada
                        </a>
                      </div>
                    ) : (
                      <UploadZone onImageSelect={handleImageSelect} currentPreview={preview} />
                    )}
                  </motion.div>
                  <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <AspectRatioSelector value={aspectRatio} onChange={setAspectRatio} disabled={isProcessing} />
                  </motion.div>
                  <motion.div className="glass-panel p-4 sm:p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <PromptInput value={prompt} onChange={setPrompt} onSubmit={handleUpscale} isLoading={isProcessing} disabled={!preview || !prompt.trim()} />
                  </motion.div>
                </motion.div>
              )}

              {activeView === "bgremove" && (
                <motion.div key="bgremove" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <BackgroundRemover onResult={(imageUrl, resultUrl, prompt) => addItem({ imageUrl, resultUrl, prompt, tool: "bgremove" })} />
                </motion.div>
              )}

              {activeView === "generate" && (
                <motion.div key="generate" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <ImageGenerator onResult={(resultUrl, prompt) => addItem({ imageUrl: resultUrl, resultUrl, prompt, tool: "generate" })} />
                </motion.div>
              )}

              {activeView === "edit" && (
                <motion.div key="edit" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <ImageEditor onResult={(imageUrl, resultUrl, prompt) => addItem({ imageUrl, resultUrl, prompt, tool: "edit" })} />
                </motion.div>
              )}

              {activeView === "qrcode" && (
                <motion.div key="qrcode" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <QRCodeGenerator onResult={(resultUrl, prompt) => addItem({ imageUrl: resultUrl, resultUrl, prompt, tool: "qrcode" })} />
                </motion.div>
              )}

              {activeView === "imagetoqr" && (
                <motion.div key="imagetoqr" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <ImageToQR onResult={(resultUrl, prompt) => addItem({ imageUrl: resultUrl, resultUrl, prompt, tool: "imagetoqr" })} />
                </motion.div>
              )}

              {activeView === "musicdna" && (
                <motion.div key="musicdna" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <MusicDNA onResult={(resultUrl, prompt) => addItem({ imageUrl: "", resultUrl, prompt, tool: "musicdna" })} />
                </motion.div>
              )}

              {activeView === "chat" && (
                <motion.div key="chat" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <AIChat />
                </motion.div>
              )}

              {activeView === "converter" && (
                <motion.div key="converter" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <DocumentConverter />
                </motion.div>
              )}

              {activeView === "summarizer" && (
                <motion.div key="summarizer" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <TextSummarizer onResult={(resultText, prompt) => addItem({ imageUrl: "", resultUrl: "", prompt, tool: "summarizer" })} />
                </motion.div>
              )}

              {activeView === "signature" && (
                <motion.div key="signature" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <SignatureGenerator onResult={(resultUrl, prompt) => addItem({ imageUrl: resultUrl, resultUrl, prompt, tool: "signature" })} />
                </motion.div>
              )}

              {activeView === "videoframes" && (
                <motion.div key="videoframes" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <VideoFrameGenerator onResult={(resultUrl, prompt) => addItem({ imageUrl: resultUrl, resultUrl, prompt, tool: "videoframes" })} />
                </motion.div>
              )}

              {activeView === "gallery" && (
                <motion.div key="gallery" variants={pageVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.3 }}>
                  <GalleryView items={allItems} onDelete={removeItem} />
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
