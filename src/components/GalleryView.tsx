import { useState } from "react";
import { Download, Trash2, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import type { SessionHistoryItem } from "@/hooks/useSessionHistory";
import Lightbox from "./Lightbox";

const toolLabels: Record<string, string> = {
  upscale: "Upscale",
  bgremove: "Rem. Fundo",
  generate: "Gerada",
  edit: "Editada",
  qrcode: "QR Code",
};

const toolColorClasses: Record<string, string> = {
  upscale: "bg-tool-upscale tool-upscale",
  bgremove: "bg-tool-bgremove tool-bgremove",
  generate: "bg-tool-generate tool-generate",
  edit: "bg-tool-edit tool-edit",
  qrcode: "bg-tool-qrcode tool-qrcode",
};

interface GalleryViewProps {
  items: SessionHistoryItem[];
  onDelete: (id: string) => void;
}

type FilterType = "all" | "upscale" | "bgremove" | "generate" | "edit" | "qrcode";

const GalleryView = ({ items, onDelete }: GalleryViewProps) => {
  const [filter, setFilter] = useState<FilterType>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filtered = filter === "all" ? items : items.filter((i) => i.tool === filter);

  const filters: { value: FilterType; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "upscale", label: "Upscale" },
    { value: "bgremove", label: "Rem. Fundo" },
    { value: "generate", label: "Geradas" },
    { value: "edit", label: "Editadas" },
    { value: "qrcode", label: "QR Codes" },
  ];

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <LayoutGrid className="w-14 h-14 text-muted-foreground/30 mb-4" />
        <p className="text-muted-foreground font-medium">Galeria vazia</p>
        <p className="text-sm text-muted-foreground/60 mt-1">Imagens processadas nesta sessão aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              filter === f.value
                ? "bg-primary/15 border-primary/40 text-primary font-medium"
                : "bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {filtered.map((item, idx) => (
          <motion.div
            key={item.id}
            className="group relative rounded-xl overflow-hidden border border-border/50 bg-card/40 aspect-square cursor-pointer hover:border-primary/30 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.15)] transition-all duration-300"
            onClick={() => setLightboxIndex(idx)}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25, delay: idx * 0.04 }}
          >
            <img
              src={item.resultUrl}
              alt={item.prompt}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {/* Always-visible badge */}
            <div className="absolute top-2 left-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full backdrop-blur-sm ${toolColorClasses[item.tool] || ""}`}>
                {toolLabels[item.tool]}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-2.5">
                <p className="text-xs text-foreground/80 truncate">{item.prompt}</p>
              </div>
            </div>
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <a
                href={item.resultUrl}
                download
                target="_blank"
                rel="noopener"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg bg-card/80 border border-border/50 text-foreground hover:bg-card transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="p-1.5 rounded-lg bg-card/80 border border-border/50 text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {lightboxIndex !== null && filtered[lightboxIndex] && (
        <Lightbox
          imageUrl={filtered[lightboxIndex].resultUrl}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((prev) => Math.max(0, (prev ?? 0) - 1))}
          onNext={() => setLightboxIndex((prev) => Math.min(filtered.length - 1, (prev ?? 0) + 1))}
          hasPrev={lightboxIndex > 0}
          hasNext={lightboxIndex < filtered.length - 1}
        />
      )}
    </div>
  );
};

export default GalleryView;
