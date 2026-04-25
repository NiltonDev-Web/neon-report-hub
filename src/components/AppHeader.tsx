import { Link } from "react-router-dom";
import { Zap } from "lucide-react";

export const AppHeader = ({ children }: { children?: React.ReactNode }) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/80 border-b border-border no-print">
      <div className="container flex items-center justify-between h-16 gap-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-neon flex items-center justify-center shadow-glow-blue group-hover:animate-pulse-glow">
            <Zap className="w-5 h-5 text-background" strokeWidth={3} />
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-lg neon-text-blue">NS SOLUÇÕES EM TI</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground -mt-1">Reports</div>
          </div>
        </Link>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
};
