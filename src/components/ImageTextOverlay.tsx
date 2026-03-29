import { useState, useRef, useEffect, useCallback } from "react";
import { Type, Download, RotateCcw, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

interface ImageTextOverlayProps {
  imageSrc: string;
  onDone: (resultUrl: string) => void;
  onCancel: () => void;
}

const colorPresets = [
  "#ffffff", "#000000", "#ef4444", "#f97316", "#eab308",
  "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899",
];

const fontOptions = [
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Courier New', monospace", label: "Courier New" },
  { value: "Impact, sans-serif", label: "Impact" },
  { value: "'Comic Sans MS', cursive", label: "Comic Sans" },
  { value: "Verdana, sans-serif", label: "Verdana" },
  { value: "'Times New Roman', serif", label: "Times New Roman" },
];

const stickerEmojis = ["⭐", "❤️", "🔥", "😎", "🎉", "👑", "💎", "🌟", "🎵", "✨", "🦄", "🌈"];

const ImageTextOverlay = ({ imageSrc, onDone, onCancel }: ImageTextOverlayProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [text, setText] = useState("");
  const [fontSize, setFontSize] = useState(32);
  const [color, setColor] = useState("#ffffff");
  const [bold, setBold] = useState(false);
  const [fontFamily, setFontFamily] = useState("Arial, sans-serif");
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [imgObj, setImgObj] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setImgObj(img);
    img.src = imageSrc;
  }, [imageSrc]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgObj) return;
    canvas.width = imgObj.width;
    canvas.height = imgObj.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(imgObj, 0, 0);

    // Draw guide lines
    if (position) {
      ctx.strokeStyle = "rgba(59,130,246,0.5)";
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 4]);
      // Horizontal
      ctx.beginPath();
      ctx.moveTo(0, position.y);
      ctx.lineTo(imgObj.width, position.y);
      ctx.stroke();
      // Vertical
      ctx.beginPath();
      ctx.moveTo(position.x, 0);
      ctx.lineTo(position.x, imgObj.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (position && text) {
      const font = `${bold ? "bold " : ""}${fontSize}px ${fontFamily}`;
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(text, position.x, position.y);
      ctx.shadowColor = "transparent";
    }

    // Crosshair marker
    if (position) {
      ctx.strokeStyle = "rgba(255,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(position.x, position.y, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "rgba(59,130,246,0.3)";
      ctx.fill();
    }
  }, [imgObj, text, fontSize, color, bold, fontFamily, position]);

  useEffect(() => { draw(); }, [draw]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imgObj) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = imgObj.width / rect.width;
    const scaleY = imgObj.height / rect.height;
    let clientX: number, clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    if (coords) setPosition(coords);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    const coords = getCanvasCoords(e);
    if (coords) setPosition(coords);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const coords = getCanvasCoords(e);
    if (coords) setPosition(coords);
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    const coords = getCanvasCoords(e);
    if (coords) setPosition(coords);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const coords = getCanvasCoords(e);
    if (coords) setPosition(coords);
  };

  const addSticker = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  const handleConfirm = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgObj!, 0, 0);
    if (position && text) {
      ctx.font = `${bold ? "bold " : ""}${fontSize}px ${fontFamily}`;
      ctx.fillStyle = color;
      ctx.textBaseline = "top";
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(text, position.x, position.y);
    }
    const dataUrl = canvas.toDataURL("image/png");
    onDone(dataUrl);
  };

  const handleDownload = () => {
    handleConfirm();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "imagem-com-texto.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  if (!imgObj) return null;

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="glass-panel p-4">
        <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
          <GripVertical className="w-4 h-4" />
          Clique ou arraste na imagem para posicionar o texto:
        </p>
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => setIsDragging(false)}
          className="w-full rounded-lg cursor-crosshair border border-border/40"
          style={{ maxHeight: "500px", objectFit: "contain", touchAction: "none" }}
        />
      </div>

      <div className="glass-panel p-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Texto</label>
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Digite o texto..." className="bg-secondary/50" />
        </div>

        {/* Stickers */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Figurinhas</label>
          <div className="flex gap-1.5 flex-wrap">
            {stickerEmojis.map((emoji) => (
              <button key={emoji} onClick={() => addSticker(emoji)} className="w-9 h-9 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center text-lg transition-colors hover:scale-110">
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Font selector */}
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Fonte</label>
          <Select value={fontFamily} onValueChange={setFontFamily}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {fontOptions.map((f) => (
                <SelectItem key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Tamanho: {fontSize}px</label>
          <Slider value={[fontSize]} onValueChange={([v]) => setFontSize(v)} min={12} max={120} step={2} />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Cor</label>
          <div className="flex gap-2 items-center flex-wrap">
            {colorPresets.map(c => (
              <button key={c} onClick={() => setColor(c)} className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? "border-primary scale-110" : "border-border/50"}`} style={{ backgroundColor: c }} />
            ))}
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-7 h-7 rounded cursor-pointer" />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant={bold ? "default" : "outline"} size="sm" onClick={() => setBold(!bold)}>
            <strong>B</strong>
          </Button>
          <span className="text-xs text-muted-foreground">{bold ? "Negrito ativo" : "Normal"}</span>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1"><RotateCcw className="w-4 h-4" />Voltar</Button>
          <Button onClick={handleDownload} disabled={!position || !text} className="flex-1"><Download className="w-4 h-4" />Confirmar e baixar</Button>
        </div>
      </div>
    </motion.div>
  );
};

export default ImageTextOverlay;
