import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled: boolean;
}

const presets = [
  "Restaurar detalhes e nitidez máxima",
  "Aumentar resolução preservando texturas",
  "Melhorar cores e contraste com HDR",
  "Restaurar rosto com detalhes realistas",
];

const PromptInput = ({ value, onChange, onSubmit, isLoading, disabled }: PromptInputProps) => {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Descreva como deseja aprimorar a imagem..."
          className="min-h-[80px] sm:min-h-[100px] bg-secondary/50 border-border/50 resize-none text-sm sm:text-base text-foreground placeholder:text-muted-foreground/50 focus:ring-primary/30 focus:border-primary/40"
          disabled={isLoading}
        />
      </div>

      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {presets.map((preset) => (
          <button
            key={preset}
            onClick={() => onChange(preset)}
            className="text-[11px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors border border-transparent hover:border-border/50"
          >
            {preset}
          </button>
        ))}
      </div>

      <Button
        onClick={onSubmit}
        disabled={disabled || isLoading}
        className="w-full h-11 sm:h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm sm:text-base shadow-[var(--shadow-glow)] disabled:opacity-40"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
            Processando...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Upscale
          </>
        )}
      </Button>
    </div>
  );
};

export default PromptInput;
