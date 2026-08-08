import { ArrowUpCircle, Eraser, Sparkles, LayoutGrid, Wand2, QrCode, Music, MessageCircle, FileOutput, FileText, PenLine, Film, Search } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import ThemeToggle from "@/components/ThemeToggle";

export type ToolView = "upscale" | "bgremove" | "generate" | "edit" | "qrcode" | "imagetoqr" | "musicdna" | "chat" | "converter" | "summarizer" | "signature" | "videoframes" | "gallery" | "search";

const tools: { value: ToolView; label: string; subtitle: string; icon: typeof ArrowUpCircle; bgColor: string; iconColor: string }[] = [
  { value: "chat", label: "Chat IA", subtitle: "AI assistant", icon: MessageCircle, bgColor: "bg-indigo-500/15", iconColor: "text-indigo-500" },
  { value: "generate", label: "Gerar Imagem", subtitle: "AI generation", icon: Sparkles, bgColor: "bg-yellow-500/15", iconColor: "text-yellow-500" },
  { value: "edit", label: "Image Editor", subtitle: "Edit with AI", icon: Wand2, bgColor: "bg-pink-500/15", iconColor: "text-pink-500" },
  { value: "upscale", label: "Upscale", subtitle: "Enhance quality", icon: ArrowUpCircle, bgColor: "bg-purple-500/15", iconColor: "text-purple-500" },
  { value: "bgremove", label: "Remover Fundo", subtitle: "Remove BG", icon: Eraser, bgColor: "bg-cyan-500/15", iconColor: "text-cyan-500" },
  { value: "converter", label: "Converter", subtitle: "Convert docs", icon: FileOutput, bgColor: "bg-blue-500/15", iconColor: "text-blue-500" },
  { value: "videoframes", label: "Video Studio", subtitle: "Create videos", icon: Film, bgColor: "bg-red-500/15", iconColor: "text-red-500" },
  { value: "summarizer", label: "Resumidor IA", subtitle: "Resuma textos", icon: FileText, bgColor: "bg-violet-500/15", iconColor: "text-violet-500" },
  { value: "search", label: "Localizador", subtitle: "Busca de texto", icon: Search, bgColor: "bg-slate-500/15", iconColor: "text-slate-500" },
  { value: "signature", label: "Assinatura", subtitle: "Assinatura digital", icon: PenLine, bgColor: "bg-teal-500/15", iconColor: "text-teal-500" },
  { value: "qrcode", label: "QR Code", subtitle: "Generate QR", icon: QrCode, bgColor: "bg-amber-500/15", iconColor: "text-amber-500" },
  { value: "imagetoqr", label: "Imagem→QR", subtitle: "Image to QR", icon: QrCode, bgColor: "bg-orange-500/15", iconColor: "text-orange-500" },
  { value: "musicdna", label: "Music DNA", subtitle: "Analyze music", icon: Music, bgColor: "bg-green-500/15", iconColor: "text-green-500" },
  { value: "gallery", label: "Galeria", subtitle: "Suas criações", icon: LayoutGrid, bgColor: "bg-orange-500/15", iconColor: "text-orange-500" },
];

interface AppSidebarProps {
  activeView: ToolView;
  onViewChange: (view: ToolView) => void;
}

const AppSidebar = ({ activeView, onViewChange }: AppSidebarProps) => {
  const { state, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const isMobile = useIsMobile();

  const handleViewChange = (view: ToolView) => {
    onViewChange(view);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        {/* Logo */}
        <div className={`flex items-center gap-2.5 px-4 pb-4 border-b border-sidebar-border ${collapsed ? "justify-center px-2" : ""}`}>
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
            <img src="/pwa-icon-192.png" alt="Alse Bold" className="w-8 h-8 object-contain" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display text-lg font-bold tracking-tight text-sidebar-foreground">Alse Bold</h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">AI Creative Tools</p>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {tools.map((tool) => (
                <SidebarMenuItem key={tool.value}>
                  <SidebarMenuButton
                    onClick={() => handleViewChange(tool.value)}
                    isActive={activeView === tool.value}
                    tooltip={tool.label}
                    size="lg"
                    className={`gap-3 ${activeView === tool.value ? "bg-sidebar-accent text-sidebar-primary font-medium border-l-2 border-sidebar-primary shadow-[0_0_12px_-4px_hsl(var(--sidebar-primary)/0.3)]" : ""}`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${tool.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <tool.icon className={`w-5 h-5 ${tool.iconColor}`} />
                    </div>
                    {!collapsed && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-sidebar-foreground truncate">{tool.label}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{tool.subtitle}</span>
                      </div>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between px-2"}`}>
          {!collapsed && <span className="text-xs text-muted-foreground">Tema</span>}
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
