import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import {
  ArrowUpCircle, Eraser, Sparkles, Wand2, QrCode, Music,
  MessageCircle, FileOutput, ArrowRight, Send, ArrowDown,
  Zap, Upload, Download, Star, Shield, Clock, Users,
  CheckCircle, Image, FileText, PenLine, Film
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import alseHeroBg from "@/assets/alse-hero-bg.jpg";
import alceImg from "@/assets/alce.webp";

const TELEGRAM_URL = "https://t.me/alsebold01_bot?start=1";

const tools = [
  { icon: MessageCircle, label: "Chat IA", desc: "Converse com modelos avançados (Llama 3.3 70B via Groq) para criar conteúdo, programar e tirar dúvidas.", color: "hsl(var(--tool-chat))", tag: "Popular", tech: "Groq API" },
  { icon: Sparkles, label: "Gerar Imagem", desc: "Crie imagens a partir de texto com DALL-E 3 da OpenAI, com fallback automático via Pollinations.ai.", color: "hsl(var(--tool-generate))", tag: "Novo", tech: "DALL-E 3" },
  { icon: ArrowUpCircle, label: "Upscale", desc: "Aumente resolução e qualidade de imagens usando reimaginação por IA com DALL-E 3.", color: "hsl(var(--tool-upscale))", tag: null, tech: "OpenAI" },
  { icon: Eraser, label: "Remover Fundo", desc: "Remoção de fundo com processamento Canvas — ideal para fotos de produtos e retratos.", color: "hsl(var(--tool-bgremove))", tag: null, tech: "Canvas API" },
  { icon: Wand2, label: "Editar Imagem", desc: "Transforme imagens com comandos em linguagem natural usando GPT-4o + DALL-E 3.", color: "hsl(var(--tool-edit))", tag: null, tech: "GPT-4o" },
  { icon: QrCode, label: "QR Code", desc: "Gere QR Codes customizados para links, textos, Wi-Fi e mais, com biblioteca qrcode.js.", color: "hsl(var(--tool-qrcode))", tag: null, tech: "qrcode.js" },
  { icon: Music, label: "Music DNA", desc: "Analise qualquer música ou artista com IA — gênero, BPM, tom, letras e curiosidades.", color: "hsl(var(--tool-musicdna))", tag: null, tech: "Groq AI" },
  { icon: FileOutput, label: "Conversor", desc: "Converta documentos entre PDF, DOCX e TXT direto no navegador com jsPDF e docx.", color: "hsl(var(--tool-converter))", tag: null, tech: "jsPDF / docx" },
  { icon: FileText, label: "Resumidor IA", desc: "Resuma textos longos instantaneamente usando Llama 3.3 70B via Groq.", color: "hsl(var(--tool-chat))", tag: null, tech: "Groq AI" },
  { icon: PenLine, label: "Assinatura", desc: "Crie assinaturas digitais personalizadas com Canvas para documentos e e-mails.", color: "hsl(var(--tool-qrcode))", tag: null, tech: "Canvas" },
  { icon: Film, label: "Video Frames", desc: "Gere sequências de frames para vídeos com IA, ideal para storyboards e animações.", color: "hsl(var(--tool-upscale))", tag: null, tech: "DALL-E 3" },
  { icon: Image, label: "Imagem→QR", desc: "Transforme qualquer imagem em um QR Code artístico e funcional.", color: "hsl(var(--tool-edit))", tag: null, tech: "qrcode.js" },
];

const steps = [
  { icon: Zap, title: "Escolha a ferramenta", desc: "12 ferramentas de IA disponíveis — chat, imagem, áudio, documentos e mais.", num: "01" },
  { icon: Upload, title: "Envie ou descreva", desc: "Faça upload de arquivos ou descreva em português o que precisa.", num: "02" },
  { icon: Download, title: "Receba o resultado", desc: "Baixe seu conteúdo processado em segundos, sem cadastro.", num: "03" },
];

const stats = [
  { icon: Users, value: "12", label: "Ferramentas de IA" },
  { icon: Star, value: "5", label: "APIs integradas" },
  { icon: Shield, value: "100%", label: "Gratuito" },
  { icon: Clock, value: "<5s", label: "Tempo médio" },
];

const techStack = [
  { name: "OpenAI DALL-E 3", desc: "Geração e edição de imagens" },
  { name: "GPT-4o Vision", desc: "Análise e descrição de imagens" },
  { name: "Groq (Llama 3.3 70B)", desc: "Chat IA e resumos ultra-rápidos" },
  { name: "Pollinations.ai", desc: "Fallback gratuito para imagens" },
  { name: "Canvas API", desc: "Processamento local de imagens" },
  { name: "jsPDF / docx", desc: "Conversão de documentos no browser" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } }),
};

const Landing = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));
  const bgY = useTransform(scrollY, [0, 1200], [0, 200]);
  const bgOpacity = useTransform(scrollY, [0, 600], [0.55, 0.2]);
  const bgScale = useTransform(scrollY, [0, 800], [1, 1.12]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
      {/* Background with parallax */}
      <motion.div className="fixed inset-0 pointer-events-none z-0" style={{ y: bgY }}>
        <motion.img
          src={alseHeroBg}
          alt=""
          className="absolute inset-0 w-full h-[140vh] object-cover saturate-[1.6] contrast-[1.1] brightness-[1.15]"
          style={{ opacity: bgOpacity, scale: bgScale }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/50 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/20 via-transparent to-background/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
      </motion.div>

      {/* Nav */}
      <nav className={cn(
        "fixed top-0 inset-x-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-border/30 bg-background/80 backdrop-blur-2xl shadow-[0_1px_20px_-8px_hsl(var(--primary)/0.15)]"
          : "border-transparent bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/pwa-icon-192.png" alt="Alse Bold" className="w-9 h-9 rounded-xl shadow-sm" />
            <span className="font-display text-xl font-bold tracking-tight">Alse Bold</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline-block text-[10px] font-display font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mr-2">
              boa noite
            </span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button variant="ghost" size="sm" onClick={() => navigate("/app")} className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
                Web App
              </Button>
              <Button size="sm" asChild className="gap-1.5 shadow-md shadow-primary/20">
                <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                  <Send className="w-3.5 h-3.5" /> Telegram
                </a>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 sm:pt-40 sm:pb-24 relative z-10">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col items-center gap-2 mb-8">
              <span className="text-sm font-display font-medium text-primary/80 uppercase tracking-widest animate-pulse mb-2">
                boa noite
              </span>
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm">
                <Zap className="w-3.5 h-3.5" /> 12 ferramentas de IA • 100% gratuito
              </span>
            </div>
          </motion.div>
          <motion.h1
            className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight leading-[1.08] mb-6 drop-shadow-[0_4px_24px_hsl(var(--primary)/0.15)]"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6 }}
          >
            <span className="bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
              Suas ideias ganham vida{" "}
            </span>
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite] [text-shadow:none]">
              com inteligência artificial
            </span>
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6 }}
          >
            Gere imagens com DALL-E 3, converse com Llama 3.3, remova fundos, crie QR Codes e mais — tudo em português, grátis e direto no navegador ou Telegram.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.6 }}
          >
            <Button size="lg" onClick={() => navigate("/app")} className="text-base px-8 gap-2 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-shadow">
              Começar agora <ArrowRight className="w-4 h-4" />
            </Button>
            <Button size="lg" variant="outline" asChild className="text-base px-8 gap-2 border-border/50 bg-card/40 backdrop-blur-sm">
              <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                <Send className="w-4 h-4" /> Usar no Telegram
              </a>
            </Button>
          </motion.div>

          <motion.div
            className="mt-14 flex items-center justify-center gap-2 text-xs text-muted-foreground/70"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }}
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            >
              <ArrowDown className="w-4 h-4" />
            </motion.div>
            Explore as ferramentas
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 pb-16 sm:pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="text-center p-5 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30"
                variants={fadeUp} custom={i}
              >
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features — all 12 tools */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">12 ferramentas reais, funcionando agora</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">Cada ferramenta usa APIs reais — OpenAI, Groq, Canvas API e mais.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool, i) => (
              <motion.div
                key={tool.label}
                className="group relative rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/30 hover:bg-card/70 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)] hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                onClick={() => navigate("/app")}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                {tool.tag && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    {tool.tag}
                  </span>
                )}
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${tool.color}15` }}>
                    <tool.icon className="w-5 h-5" style={{ color: tool.color }} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold text-base mb-1 group-hover:text-foreground transition-colors">{tool.label}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">{tool.desc}</p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary/70 bg-primary/5 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> {tool.tech}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Tecnologias reais por trás</h2>
            <p className="text-muted-foreground text-base sm:text-lg">Sem marketing vazio — veja exatamente o que alimenta cada ferramenta.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {techStack.map((tech, i) => (
              <motion.div
                key={tech.name}
                className="flex items-center gap-3 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-sm text-foreground">{tech.name}</div>
                  <div className="text-xs text-muted-foreground">{tech.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Simples de usar</h2>
            <p className="text-muted-foreground text-base sm:text-lg">Três passos para resultados profissionais.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                className="relative p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/30 text-center"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <span className="font-display text-5xl font-bold text-primary/10 absolute top-4 right-5">{step.num}</span>
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Telegram CTA */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            className="relative overflow-hidden rounded-3xl border border-border/30 bg-card/60 backdrop-blur-xl p-8 sm:p-12 text-center"
            initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Send className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold mb-3">Use também no Telegram</h2>
              <p className="text-muted-foreground text-base mb-8 max-w-md mx-auto">
                Acesse todas as 12 ferramentas direto pelo Telegram. Sem cadastro, sem complicação — é só mandar mensagem.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" asChild className="text-base px-8 gap-2 shadow-lg shadow-primary/20">
                  <a href={TELEGRAM_URL} target="_blank" rel="noopener noreferrer">
                    <Send className="w-4 h-4" /> Abrir no Telegram
                  </a>
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate("/app")} className="text-base px-8 gap-2 border-border/50">
                  <ArrowRight className="w-4 h-4" /> Usar Web App
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Alse Fish */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-10" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">A inspiração por trás do nome</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
              O Alse (Alosa alosa) sobe rios contra a correnteza para seguir em frente — assim como suas ideias.
            </p>
          </motion.div>
          <motion.div
            className="relative overflow-hidden rounded-3xl min-h-[420px] flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          >
            <img
              src={alceImg}
              alt="O Alse (Alosa alosa)"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8 text-center">
              <motion.div
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-card/60 text-primary border border-primary/20 backdrop-blur-sm"
                initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Zap className="w-3.5 h-3.5" /> Alse Bold
              </motion.div>
            </div>
          </motion.div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.blockquote
              className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-6"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
            >
              <p className="text-base leading-relaxed text-foreground/90">
                "A persistência é o caminho do êxito. Quem não desiste, cresce e inspira — cada passo dado contra a correnteza aproxima você do destino."
              </p>
              <footer className="mt-3 text-xs text-muted-foreground">Lição de vida do Alse</footer>
            </motion.blockquote>
            <motion.blockquote
              className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm p-6"
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
            >
              <p className="text-base leading-relaxed text-foreground/90">
                "Nossa maior glória não está em nunca cair, mas em levantar toda vez que caímos — a força vem da resiliência, não da ausência de obstáculos."
              </p>
              <footer className="mt-3 text-xs text-muted-foreground">Inspirado em Confúcio</footer>
            </motion.blockquote>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/pwa-icon-192.png" alt="Alse Bold" className="w-6 h-6 rounded-lg" />
            <span className="font-display font-semibold text-sm">Alse Bold</span>
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs text-muted-foreground">Feito no Brasil 🇧🇷 — 12 ferramentas de IA reais, 100% gratuitas.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
