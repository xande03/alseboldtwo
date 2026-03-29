import { useCallback, useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

interface UploadZoneProps {
  onImageSelect: (file: File, preview: string) => void;
  currentPreview: string | null;
}

const UploadZone = ({ onImageSelect, currentPreview }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      onImageSelect(file, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  if (currentPreview) {
    return (
      <div className="relative group rounded-xl overflow-hidden">
        <img
          src={currentPreview}
          alt="Original"
          className="w-full h-auto max-h-[300px] sm:max-h-[500px] object-contain bg-secondary/30 rounded-xl"
        />
        <label className="absolute inset-0 flex items-center justify-center bg-background/60 opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-primary" />
            <span className="text-sm text-foreground/80">Trocar imagem</span>
          </div>
          <input type="file" accept="image/*" onChange={handleChange} className="hidden" />
        </label>
      </div>
    );
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`upload-zone flex flex-col items-center justify-center gap-3 sm:gap-4 p-8 sm:p-12 cursor-pointer min-h-[200px] sm:min-h-[300px] ${isDragging ? "border-primary/50 bg-primary/5" : ""}`}
    >
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-secondary flex items-center justify-center">
        <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
      </div>
      <div className="text-center">
        <p className="text-foreground font-medium mb-1 text-sm sm:text-base">Arraste sua imagem aqui</p>
        <p className="text-xs sm:text-sm text-muted-foreground">ou toque para selecionar • PNG, JPG, WEBP</p>
      </div>
      <input type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </label>
  );
};

export default UploadZone;
