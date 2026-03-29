import { RectangleHorizontal, Square, RectangleVertical, Maximize } from "lucide-react";

export type AspectRatioOption = "original" | "1:1" | "16:9" | "9:16" | "4:3" | "3:4" | "3:2" | "2:3";

interface AspectRatioSelectorProps {
  value: AspectRatioOption;
  onChange: (value: AspectRatioOption) => void;
  disabled?: boolean;
}

const options: { value: AspectRatioOption; label: string; icon: React.ReactNode }[] = [
  { value: "original", label: "Original", icon: <Maximize className="w-3.5 h-3.5" /> },
  { value: "1:1", label: "1:1", icon: <Square className="w-3.5 h-3.5" /> },
  { value: "16:9", label: "16:9", icon: <RectangleHorizontal className="w-3.5 h-3.5" /> },
  { value: "9:16", label: "9:16", icon: <RectangleVertical className="w-3.5 h-3.5" /> },
  { value: "4:3", label: "4:3", icon: <RectangleHorizontal className="w-3.5 h-3.5" /> },
  { value: "3:2", label: "3:2", icon: <RectangleHorizontal className="w-3.5 h-3.5" /> },
];

const AspectRatioSelector = ({ value, onChange, disabled }: AspectRatioSelectorProps) => {
  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Proporção da imagem
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`
              flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all
              ${value === opt.value
                ? "bg-primary/15 border-primary/40 text-primary font-medium"
                : "bg-secondary/50 border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
              }
              disabled:opacity-40 disabled:cursor-not-allowed
            `}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AspectRatioSelector;
