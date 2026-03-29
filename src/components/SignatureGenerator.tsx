import { useState, useRef, useEffect, useCallback } from "react";
import { PenLine, Trash2, Undo2, Download, Palette } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface SignatureGeneratorProps {
  onResult?: (resultUrl: string, prompt: string) => void;
}

const COLORS = [
  "#000000", "#1a1a2e", "#16213e", "#0f3460",
  "#e94560", "#533483", "#1fab89", "#62d2a2",
];

const SignatureGenerator = ({ onResult }: SignatureGeneratorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokeColor, setStrokeColor] = useState("#000000");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { toast } = useToast();

  const getContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    return ctx;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      // Initial clear state
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      saveState();
    }
  }, []);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex, getContext]);

  const getPointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = getContext();
    if (!ctx) return;

    const pos = getPointerPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    setIsDrawing(true);

    // Capture pointer for better tracking
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const ctx = getContext();
    if (!ctx) return;

    const pos = getPointerPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const stopDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    canvasRef.current?.releasePointerCapture(e.pointerId);
    saveState();
  };

  const handleUndo = () => {
    if (historyIndex <= 0) return;
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    const newIndex = historyIndex - 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const handleClear = () => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    saveState();
    toast({ title: "Canvas limpo", description: "A assinatura foi apagada." });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas for the download (without scaling issues)
    const tempCanvas = document.createElement("canvas");
    const rect = canvas.getBoundingClientRect();
    tempCanvas.width = rect.width;
    tempCanvas.height = rect.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    // Draw the original canvas content scaled down
    tempCtx.drawImage(canvas, 0, 0, rect.width, rect.height);

    const dataUrl = tempCanvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `assinatura-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();

    onResult?.(dataUrl, "Assinatura digital");
    toast({ title: "Download iniciado!", description: "Sua assinatura foi salva como PNG." });
  };

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    if (!canvas || !ctx) return true;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return !imageData.data.some((channel, i) => i % 4 === 3 && channel !== 0);
  };

  return (
    <div className="space-y-6">
      {/* Canvas */}
      <motion.div
        className="glass-panel-premium p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <PenLine className="w-5 h-5 tool-signature" />
          <h3 className="font-display font-semibold">Desenhe sua assinatura</h3>
        </div>

        <div className="relative rounded-xl overflow-hidden border-2 border-border/50 bg-white">
          <canvas
            ref={canvasRef}
            onPointerDown={startDrawing}
            onPointerMove={draw}
            onPointerUp={stopDrawing}
            onPointerLeave={stopDrawing}
            className="w-full h-[300px] touch-none cursor-crosshair"
            style={{ touchAction: "none" }}
          />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
              backgroundSize: "20px 20px",
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Use o mouse ou toque para desenhar • Fundo transparente
        </p>
      </motion.div>

      {/* Controls */}
      <motion.div
        className="glass-panel-premium p-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {/* Color Picker */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Cor da linha</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setStrokeColor(color)}
                className={`w-10 h-10 rounded-xl border-2 transition-all ${
                  strokeColor === color
                    ? "border-primary scale-110 shadow-lg"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              className="w-10 h-10 rounded-xl cursor-pointer border-2 border-border/50"
            />
          </div>
        </div>

        {/* Stroke Width */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Espessura da linha</span>
            <span className="text-sm text-muted-foreground">{strokeWidth}px</span>
          </div>
          <Slider
            value={[strokeWidth]}
            onValueChange={([v]) => setStrokeWidth(v)}
            min={1}
            max={10}
            step={1}
            className="w-full"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="gap-2"
          >
            <Undo2 className="w-4 h-4" /> Desfazer
          </Button>
          <Button variant="outline" onClick={handleClear} className="gap-2">
            <Trash2 className="w-4 h-4" /> Limpar
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isCanvasEmpty()}
            className="gap-2 ml-auto shadow-lg shadow-primary/20"
          >
            <Download className="w-4 h-4" /> Baixar PNG
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default SignatureGenerator;
