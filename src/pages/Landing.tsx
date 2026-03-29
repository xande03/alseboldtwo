import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpCircle, Eraser, Sparkles, Wand2, QrCode, Music,
  MessageCircle, FileOutput, ArrowRight, Send,
  Zap, Upload, Download, Star, Shield, Clock, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import alseHeroBg from "@/assets/alse-hero-bg.jpg";

const TELEGRAM_URL = "https://t.me/alsebold01_bot?start=1";

const tools = [
  { icon: MessageCircle, label: "Chat IA", desc: "Converse com IA para criar conteúdo, tirar dúvidas e muito mais.", color: "hsl(var(--tool-chat))", tag: "Popular" },
  { icon: Sparkles, label: "Gerar Imagem", desc: "Crie imagens únicas a partir de texto com inteligência artificial.", color: "hsl(var(--tool-generate))", tag: "Novo" },
  { icon: ArrowUpCircle, label: "Upscale", desc: "Aumente a resolução e qualidade das suas imagens com IA.", color: "hsl(var(--tool-upscale))", tag: null },
  { icon: Eraser, label: "Remover Fundo", desc: "Remova fundos automaticamente com precisão profissional.", color: "hsl(var(--tool-bgremove))", tag: null },
  { icon: Wand2, label: "Editar Imagem", desc: "Transforme imagens com comandos em linguagem natural.", color: "hsl(var(--tool-edit))", tag: null },
  { icon: QrCode, label: "QR Code", desc: "Gere QR Codes estilizados para links, textos e mais.", color: "hsl(var(--tool-qrcode))", tag: null },
  { icon: Music, label: "Music DNA", desc: "Descubra tudo sobre qualquer música ou artista.", color: "hsl(var(--tool-musicdna))", tag: null },
  { icon: FileOutput, label: "Conversor", desc: "Converta documentos entre PDF, Word e outros formatos.", color: "hsl(var(--tool-converter))", tag: null },
];

const steps = [
  { icon: Zap, title: "Escolha a ferramenta", desc: "Selecione entre 8+ ferramentas de IA disponíveis.", num: "01" },
  { icon: Upload, title: "Envie ou descreva", desc: "Faça upload de arquivos ou descreva o que precisa.", num: "02" },
  { icon: Download, title: "Receba o resultado", desc: "Baixe seu conteúdo processado em segundos.", num: "03" },
];

const stats = [
  { icon: Users, value: "10K+", label: "Usuários ativos" },
  { icon: Star, value: "50K+", label: "Imagens geradas" },
  { icon: Shield, value: "100%", label: "Gratuito" },
  { icon: Clock, value: "<5s", label: "Tempo médio" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const } }),
};

const Landing = () => {
  const navigate = useNavigate();
  const { scrollY } = useScroll();
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
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/30 bg-background/70 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/pwa-icon-192.png" alt="Alse Bold" className="w-9 h-9 rounded-xl shadow-sm" />
            <span className="font-display text-xl font-bold tracking-tight">Alse Bold</span>
          </div>
          <div className="flex items-center gap-2">
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
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 sm:pt-36 sm:pb-24 relative z-10">
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-8 backdrop-blur-sm">
              <Zap className="w-3.5 h-3.5" /> Plataforma brasileira de IA criativa
            </span>
          </motion.div>
          <motion.h1
            className="font-display text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight leading-[1.08] mb-6"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6 }}
          >
            Suas ideias ganham vida{" "}
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
              com inteligência artificial
            </span>
          </motion.h1>
          <motion.p
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6 }}
          >
            Gere imagens, remova fundos, crie QR Codes e converse com IA — tudo em português, grátis e direto no navegador ou Telegram.
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

      {/* Features */}
      <section className="py-16 sm:py-24 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-12" initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold mb-3">Tudo o que você precisa</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto">Ferramentas profissionais de IA, feitas para o dia a dia do brasileiro.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tools.map((tool, i) => (
              <motion.div
                key={tool.label}
                className="group relative rounded-2xl border border-border/40 bg-card/50 backdrop-blur-sm p-6 hover:border-primary/30 hover:bg-card/70 hover:shadow-[0_0_40px_-10px_hsl(var(--primary)/0.12)] transition-all duration-300 cursor-pointer"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
                onClick={() => navigate("/app")}
              >
                {tool.tag && (
                  <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    {tool.tag}
                  </span>
                )}
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110" style={{ backgroundColor: `${tool.color}15` }}>
                  <tool.icon className="w-5 h-5" style={{ color: tool.color }} />
                </div>
                <h3 className="font-display font-semibold text-base mb-1.5">{tool.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{tool.desc}</p>
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
                Acesse todas as ferramentas direto pelo Telegram. Sem cadastro, sem complicação — é só mandar mensagem.
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

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/pwa-icon-192.png" alt="Alse Bold" className="w-6 h-6 rounded-lg" />
            <span className="font-display font-semibold text-sm">Alse Bold</span>
            <span className="text-xs text-muted-foreground">© {new Date().getFullYear()}</span>
          </div>
          <p className="text-xs text-muted-foreground">Feito no Brasil 🇧🇷 — Ferramentas de IA para todos.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
