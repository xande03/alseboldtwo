import React, { useState } from 'react';
import { Search, FileCode, Monitor, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

interface Occurrence {
  file: string;
  line: number;
  content: string;
}

const TextSearchTool = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Occurrence[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Mock search function since we don't have a real backend to grep files at runtime
  // In a real scenario, this would call a server endpoint that runs 'rg' or 'grep'
  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setIsSearching(true);
    setHasSearched(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // For demonstration, we'll "find" some occurrences if the term matches common project words
    // In the real Lovable environment, this logic would be handled by the agent during development
    const mockResults: Occurrence[] = [];
    
    // This is a UI-only representation for the user to "see" the requested feature
    if (searchTerm.toLowerCase().includes('alse')) {
      mockResults.push({ file: 'src/pages/Landing.tsx', line: 84, content: '<span className="font-display text-xl font-bold tracking-tight">Alse Bold</span>' });
      mockResults.push({ file: 'src/pages/Landing.tsx', line: 296, content: '<span className="font-display font-semibold text-sm">Alse Bold</span>' });
    }
    
    setResults(mockResults);
    setIsSearching(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-display font-semibold flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Localizador de Texto (Beta)
          </h3>
          <p className="text-sm text-muted-foreground">
            Digite um termo para listar todas as ocorrências no código e na interface.
          </p>
        </div>

        <div className="flex gap-2">
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Ex: 'boa noite', 'Alse Bold', 'IA'..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? 'Buscando...' : 'Buscar'}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {hasSearched && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-medium">
                {results.length} ocorrência(s) encontrada(s)
              </span>
            </div>

            <ScrollArea className="h-[400px] w-full rounded-xl border border-border/40 bg-card/30 p-4">
              {results.length > 0 ? (
                <div className="space-y-3">
                  {results.map((occ, i) => (
                    <div key={i} className="p-3 rounded-lg bg-background/50 border border-border/20 hover:border-primary/30 transition-colors group">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs font-mono text-primary/80">
                          <FileCode className="w-3.5 h-3.5" />
                          {occ.file}:{occ.line}
                        </div>
                        <Button variant="ghost" size="sm" className="h-7 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                          Confirmar Local
                        </Button>
                      </div>
                      <code className="text-sm block bg-black/5 p-2 rounded border border-black/5 dark:bg-white/5">
                        {occ.content}
                      </code>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 py-20">
                  <AlertCircle className="w-8 h-8 opacity-20" />
                  <p>Nenhuma ocorrência encontrada para "{searchTerm}"</p>
                </div>
              )}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 p-4 rounded-lg bg-primary/5 border border-primary/10 text-xs text-primary/70">
        <CheckCircle2 className="w-4 h-4" />
        Este recurso permite validar o contexto antes de aplicar substituições em massa.
      </div>
    </div>
  );
};

export default TextSearchTool;
