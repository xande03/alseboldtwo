import { Clock, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoryItem {
  id: string;
  original_url: string;
  upscaled_url: string | null;
  prompt: string;
  status: string;
  created_at: string;
}

interface HistoryPanelProps {
  items: HistoryItem[];
  onSelect: (item: HistoryItem) => void;
  onDelete: (id: string) => void;
}

const HistoryPanel = ({ items, onSelect, onDelete }: HistoryPanelProps) => {
  if (items.length === 0) {
    return (
      <div className="glass-panel p-8 text-center">
        <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Nenhum histórico ainda</p>
        <p className="text-muted-foreground/60 text-xs mt-1">Suas imagens processadas aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-display text-lg font-semibold text-foreground flex items-center gap-2">
        <Clock className="w-4 h-4 text-primary" />
        Histórico
      </h3>
      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {items.map((item) => (
          <div
            key={item.id}
            className="glass-panel p-3 flex gap-3 group hover:border-primary/30 transition-colors cursor-pointer"
            onClick={() => onSelect(item)}
          >
            <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
              <img
                src={item.upscaled_url || item.original_url}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-foreground/90 truncate">{item.prompt}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${item.status === "completed" ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                  {item.status === "completed" ? "Concluído" : "Processando..."}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {item.upscaled_url && (
                <a
                  href={item.upscaled_url}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HistoryPanel;
