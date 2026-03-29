import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useState, useEffect } from "react";

const phrases = ["Gerando...", "Processando...", "Quase lá...", "Finalizando..."];

interface GeneratingAnimationProps {
  label?: string;
}

const GeneratingAnimation = ({ label }: GeneratingAnimationProps) => {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % phrases.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center justify-center gap-4 py-12"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="relative w-20 h-20">
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-2 rounded-xl bg-gradient-to-br from-primary/20 to-transparent backdrop-blur-sm"
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        >
          <Sparkles className="w-8 h-8 text-primary" />
        </motion.div>
      </div>

      <motion.div
        className="h-1 w-48 rounded-full bg-muted overflow-hidden"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary/60 rounded-full"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: "60%" }}
        />
      </motion.div>

      <motion.p
        key={phraseIndex}
        className="text-sm font-medium text-muted-foreground"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -5 }}
      >
        {label || phrases[phraseIndex]}
      </motion.p>
    </motion.div>
  );
};

export default GeneratingAnimation;
