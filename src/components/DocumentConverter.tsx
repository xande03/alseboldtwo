import { useState, useRef } from "react";
import { FileUp, FileText, ScanLine, Download, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ocrScan } from "@/lib/api";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

const DocumentConverter = () => {
  const { toast } = useToast();

  // === Image to PDF ===
  const [pdfImages, setPdfImages] = useState<{ file: File; preview: string }[]>([]);
  const [isCreatingPdf, setIsCreatingPdf] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = files.filter(f => f.type.startsWith("image/")).map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPdfImages(prev => [...prev, ...newImages]);
    e.target.value = "";
  };

  const removeImage = (idx: number) => {
    setPdfImages(prev => prev.filter((_, i) => i !== idx));
  };

  const createPdf = async () => {
    if (pdfImages.length === 0) return;
    setIsCreatingPdf(true);
    try {
      const pdf = new jsPDF();
      for (let i = 0; i < pdfImages.length; i++) {
        const imgData = await toBase64(pdfImages[i].file);
        const img = new Image();
        await new Promise<void>((res) => { img.onload = () => res(); img.src = imgData; });
        const pageW = pdf.internal.pageSize.getWidth();
        const pageH = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pageW / img.width, pageH / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, "JPEG", (pageW - w) / 2, (pageH - h) / 2, w, h);
      }
      pdf.save("imagens.pdf");
      toast({ title: "PDF criado!", description: `${pdfImages.length} imagem(ns) convertida(s).` });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setIsCreatingPdf(false);
    }
  };

  // === PDF to Word ===
  const [pdfText, setPdfText] = useState("");
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfFileName, setPdfFileName] = useState("");
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFileName(file.name);
    setIsExtractingPdf(true);
    setPdfText("");
    try {
      const pdfjsLib = await import("pdfjs-dist");
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n\n";
      }
      setPdfText(fullText.trim() || "Nenhum texto encontrado no PDF.");
    } catch (err: any) {
      toast({ title: "Erro ao ler PDF", description: err.message, variant: "destructive" });
    } finally {
      setIsExtractingPdf(false);
      e.target.value = "";
    }
  };

  const exportToWord = async () => {
    if (!pdfText.trim()) return;
    try {
      const paragraphs = pdfText.split("\n").map(line =>
        new Paragraph({ children: [new TextRun(line)] })
      );
      const doc = new Document({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, pdfFileName.replace(/\.pdf$/i, "") + ".docx");
      toast({ title: "Word gerado!", description: "Arquivo .docx baixado com sucesso." });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  // === OCR ===
  const [ocrText, setOcrText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [ocrPreview, setOcrPreview] = useState<string | null>(null);
  const ocrInputRef = useRef<HTMLInputElement>(null);

  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setOcrText("");
    const previewUrl = URL.createObjectURL(file);
    setOcrPreview(previewUrl);
    try {
      const base64 = await toBase64(file);
      const { data, error } = await supabase.functions.invoke("ocr-scan", {
        body: { imageBase64: base64 },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setOcrText(data.text || "Nenhum texto encontrado.");
    } catch (err: any) {
      toast({ title: "Erro no OCR", description: err.message, variant: "destructive" });
    } finally {
      setIsScanning(false);
      e.target.value = "";
    }
  };

  const exportOcr = async (format: "txt" | "pdf" | "docx") => {
    if (!ocrText.trim()) return;
    if (format === "txt") {
      const blob = new Blob([ocrText], { type: "text/plain;charset=utf-8" });
      saveAs(blob, "documento.txt");
    } else if (format === "pdf") {
      const pdf = new jsPDF();
      const lines = pdf.splitTextToSize(ocrText, 170);
      pdf.setFontSize(12);
      pdf.text(lines, 20, 20);
      pdf.save("documento.pdf");
    } else {
      const paragraphs = ocrText.split("\n").map(line =>
        new Paragraph({ children: [new TextRun(line)] })
      );
      const doc = new Document({ sections: [{ children: paragraphs }] });
      const blob = await Packer.toBlob(doc);
      saveAs(blob, "documento.docx");
    }
    toast({ title: "Exportado!", description: `Arquivo .${format} baixado.` });
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="img2pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="img2pdf" className="text-xs sm:text-sm"><FileUp className="w-4 h-4 mr-1.5" />Imagem → PDF</TabsTrigger>
          <TabsTrigger value="pdf2word" className="text-xs sm:text-sm"><FileText className="w-4 h-4 mr-1.5" />PDF → Word</TabsTrigger>
          <TabsTrigger value="ocr" className="text-xs sm:text-sm"><ScanLine className="w-4 h-4 mr-1.5" />Escanear</TabsTrigger>
        </TabsList>

        {/* Image to PDF */}
        <TabsContent value="img2pdf">
          <motion.div className="glass-panel p-4 sm:p-5 space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagesSelect} />
            <Button variant="outline" onClick={() => imgInputRef.current?.click()} className="w-full">
              <FileUp className="w-4 h-4 mr-2" />Selecionar imagens
            </Button>
            {pdfImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {pdfImages.map((img, i) => (
                  <div key={i} className="relative group">
                    <img src={img.preview} alt="" className="w-full h-24 object-cover rounded-lg" />
                    <button onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <Button onClick={createPdf} disabled={pdfImages.length === 0 || isCreatingPdf} className="w-full">
              {isCreatingPdf ? <><Loader2 className="w-4 h-4 animate-spin" />Gerando PDF...</> : <><Download className="w-4 h-4" />Gerar PDF ({pdfImages.length} imagem(ns))</>}
            </Button>
          </motion.div>
        </TabsContent>

        {/* PDF to Word */}
        <TabsContent value="pdf2word">
          <motion.div className="glass-panel p-4 sm:p-5 space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
            <Button variant="outline" onClick={() => pdfInputRef.current?.click()} disabled={isExtractingPdf} className="w-full">
              {isExtractingPdf ? <><Loader2 className="w-4 h-4 animate-spin" />Extraindo texto...</> : <><FileUp className="w-4 h-4 mr-2" />Upload PDF</>}
            </Button>
            {pdfText && (
              <>
                <p className="text-xs text-muted-foreground">Edite o texto extraído abaixo e confirme para gerar o Word:</p>
                <Textarea value={pdfText} onChange={(e) => setPdfText(e.target.value)} className="min-h-[200px] text-sm bg-secondary/30" />
                <Button onClick={exportToWord} className="w-full">
                  <Download className="w-4 h-4" />Confirmar e baixar .docx
                </Button>
              </>
            )}
          </motion.div>
        </TabsContent>

        {/* OCR */}
        <TabsContent value="ocr">
          <motion.div className="glass-panel p-4 sm:p-5 space-y-4" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <input ref={ocrInputRef} type="file" accept="image/*" className="hidden" onChange={handleOcrUpload} />
            <Button variant="outline" onClick={() => ocrInputRef.current?.click()} disabled={isScanning} className="w-full">
              {isScanning ? <><Loader2 className="w-4 h-4 animate-spin" />Escaneando...</> : <><ScanLine className="w-4 h-4 mr-2" />Upload imagem para escanear</>}
            </Button>
            {ocrPreview && <img src={ocrPreview} alt="Preview" className="w-full max-h-48 object-contain rounded-lg" />}
            {ocrText && (
              <>
                <p className="text-xs text-muted-foreground">Texto extraído (editável):</p>
                <Textarea value={ocrText} onChange={(e) => setOcrText(e.target.value)} className="min-h-[200px] text-sm bg-secondary/30" />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => exportOcr("txt")} className="flex-1"><Download className="w-4 h-4" />.TXT</Button>
                  <Button variant="outline" onClick={() => exportOcr("pdf")} className="flex-1"><Download className="w-4 h-4" />.PDF</Button>
                  <Button onClick={() => exportOcr("docx")} className="flex-1"><Download className="w-4 h-4" />.DOCX</Button>
                </div>
              </>
            )}
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default DocumentConverter;
