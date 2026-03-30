import { useState, useRef } from "react";
import { FileUp, FileText, ScanLine, Download, Loader2, X, Sparkles, Zap, FileImage } from "lucide-react";
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
      const text = await ocrScan(base64);
      setOcrText(text || "Nenhum texto encontrado.");
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
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="text-center space-y-3"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center justify-center gap-3">
          <div className="p-3 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Conversor de Documentos
          </h2>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Transforme seus arquivos com facilidade. Converta imagens em PDF, extraia texto de documentos e digitalize imagens com OCR avançado.
        </p>
      </motion.div>

      <Tabs defaultValue="img2pdf" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-1 rounded-xl">
          <TabsTrigger 
            value="img2pdf" 
            className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            <FileImage className="w-4 h-4 mr-1.5" />
            Imagem → PDF
          </TabsTrigger>
          <TabsTrigger 
            value="pdf2word" 
            className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            <FileText className="w-4 h-4 mr-1.5" />
            PDF → Word
          </TabsTrigger>
          <TabsTrigger 
            value="ocr" 
            className="text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            <ScanLine className="w-4 h-4 mr-1.5" />
            Escanear
          </TabsTrigger>
        </TabsList>

        {/* Image to PDF */}
        <TabsContent value="img2pdf">
          <motion.div 
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 dark:from-blue-950/30 dark:via-cyan-950/30 dark:to-blue-900/30 border border-blue-200/50 dark:border-blue-800/50 p-6 sm:p-8 space-y-6 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 shadow-lg">
                  <FileImage className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                  Converter Imagens para PDF
                </h3>
              </div>
              
              <input ref={imgInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImagesSelect} />
              <Button 
                variant="outline" 
                onClick={() => imgInputRef.current?.click()} 
                className="w-full h-14 border-2 border-dashed border-blue-300 hover:border-blue-500 bg-white/50 hover:bg-blue-50 text-blue-700 hover:text-blue-800 transition-all duration-300 group"
              >
                <FileUp className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                <span className="font-medium">Selecionar Imagens</span>
                <Sparkles className="w-4 h-4 ml-2 opacity-60" />
              </Button>
              
              {pdfImages.length > 0 && (
                <motion.div 
                  className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  {pdfImages.map((img, i) => (
                    <motion.div 
                      key={i} 
                      className="relative group"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <img src={img.preview} alt="" className="w-full h-24 object-cover rounded-xl shadow-md border-2 border-white" />
                      <button 
                        onClick={() => removeImage(i)} 
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>
              )}
              
              <Button 
                onClick={createPdf} 
                disabled={pdfImages.length === 0 || isCreatingPdf} 
                className="w-full h-14 mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {isCreatingPdf ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-3" />
                    Gerar PDF ({pdfImages.length} imagem{pdfImages.length !== 1 ? 's' : ''})
                    <Zap className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* PDF to Word */}
        <TabsContent value="pdf2word">
          <motion.div 
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-emerald-900/30 border border-emerald-200/50 dark:border-emerald-800/50 p-6 sm:p-8 space-y-6 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-teal-400/20 to-emerald-400/20 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
                  Converter PDF para Word
                </h3>
              </div>
              
              <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
              <Button 
                variant="outline" 
                onClick={() => pdfInputRef.current?.click()} 
                disabled={isExtractingPdf} 
                className="w-full h-14 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-white/50 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 transition-all duration-300 group"
              >
                {isExtractingPdf ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                    Extraindo texto...
                  </>
                ) : (
                  <>
                    <FileUp className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Upload PDF</span>
                    <Sparkles className="w-4 h-4 ml-2 opacity-60" />
                  </>
                )}
              </Button>
              
              {pdfText && (
                <motion.div 
                  className="space-y-4 mt-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                    ✨ Texto extraído com sucesso! Edite abaixo se necessário:
                  </p>
                  <Textarea 
                    value={pdfText} 
                    onChange={(e) => setPdfText(e.target.value)} 
                    className="min-h-[200px] text-sm bg-white/70 border-emerald-200 focus:border-emerald-400 rounded-xl shadow-inner" 
                  />
                  <Button 
                    onClick={exportToWord} 
                    className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <Download className="w-5 h-5 mr-3" />
                    Confirmar e baixar .docx
                    <Zap className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </TabsContent>

        {/* OCR */}
        <TabsContent value="ocr">
          <motion.div 
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-red-50 to-orange-100 dark:from-orange-950/30 dark:via-red-950/30 dark:to-orange-900/30 border border-orange-200/50 dark:border-orange-800/50 p-6 sm:p-8 space-y-6 shadow-xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-400/20 to-orange-400/20 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 shadow-lg">
                  <ScanLine className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-orange-900 dark:text-orange-100">
                  Escanear Texto (OCR)
                </h3>
              </div>
              
              <input ref={ocrInputRef} type="file" accept="image/*" className="hidden" onChange={handleOcrUpload} />
              <Button 
                variant="outline" 
                onClick={() => ocrInputRef.current?.click()} 
                disabled={isScanning} 
                className="w-full h-14 border-2 border-dashed border-orange-300 hover:border-orange-500 bg-white/50 hover:bg-orange-50 text-orange-700 hover:text-orange-800 transition-all duration-300 group"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-3" />
                    Escaneando...
                  </>
                ) : (
                  <>
                    <ScanLine className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                    <span className="font-medium">Upload imagem para escanear</span>
                    <Sparkles className="w-4 h-4 ml-2 opacity-60" />
                  </>
                )}
              </Button>
              
              {ocrPreview && (
                <motion.div 
                  className="mt-6"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <img src={ocrPreview} alt="Preview" className="w-full max-h-48 object-contain rounded-xl shadow-lg border-2 border-white" />
                </motion.div>
              )}
              
              {ocrText && (
                <motion.div 
                  className="space-y-4 mt-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <p className="text-sm text-orange-700 dark:text-orange-300 font-medium">
                    🔍 Texto extraído (editável):
                  </p>
                  <Textarea 
                    value={ocrText} 
                    onChange={(e) => setOcrText(e.target.value)} 
                    className="min-h-[200px] text-sm bg-white/70 border-orange-200 focus:border-orange-400 rounded-xl shadow-inner" 
                  />
                  <div className="grid grid-cols-3 gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => exportOcr("txt")} 
                      className="h-12 border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-orange-700 transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      .TXT
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => exportOcr("pdf")} 
                      className="h-12 border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-orange-700 transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      .PDF
                    </Button>
                    <Button 
                      onClick={() => exportOcr("docx")} 
                      className="h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      .DOCX
                      <Zap className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
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
