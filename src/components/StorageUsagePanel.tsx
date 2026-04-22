import { useEffect, useState } from "react";
import { HardDrive, AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type Usage = {
  used: number;
  quota: number;
  supported: boolean;
};

const formatBytes = (bytes: number): string => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const StorageUsagePanel = () => {
  const [usage, setUsage] = useState<Usage | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
        const est = await navigator.storage.estimate();
        setUsage({
          used: est.usage || 0,
          quota: est.quota || 0,
          supported: true,
        });
      } else {
        setUsage({ used: 0, quota: 0, supported: false });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  if (loading || !usage) {
    return (
      <div className="neon-card p-4 flex items-center gap-3 text-sm text-muted-foreground">
        <HardDrive className="w-4 h-4 animate-pulse" />
        Calculando uso de armazenamento…
      </div>
    );
  }

  if (!usage.supported) {
    return (
      <div className="neon-card p-4 flex items-center gap-3 text-sm text-muted-foreground">
        <HardDrive className="w-4 h-4" />
        Seu navegador não informa o uso de armazenamento.
      </div>
    );
  }

  const percent = usage.quota > 0 ? (usage.used / usage.quota) * 100 : 0;
  const level: "ok" | "warn" | "danger" =
    percent >= 90 ? "danger" : percent >= 75 ? "warn" : "ok";

  const colorClass =
    level === "danger"
      ? "text-destructive"
      : level === "warn"
      ? "text-yellow-300"
      : "neon-text-lime";

  const message =
    level === "danger"
      ? "Armazenamento quase cheio! Exporte um backup e exclua relatórios antigos."
      : level === "warn"
      ? "Atenção: você usou mais de 75% do espaço disponível."
      : "Espaço suficiente disponível.";

  return (
    <div className="neon-card p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <HardDrive className={`w-4 h-4 ${colorClass}`} />
          <span className="font-display tracking-wider text-sm">ARMAZENAMENTO</span>
        </div>
        <Button variant="ghost" size="sm" onClick={refresh} className="h-7 px-2">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      <Progress value={Math.min(percent, 100)} className="h-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          <span className={colorClass}>{formatBytes(usage.used)}</span>
          {" / "}
          {formatBytes(usage.quota)}
        </span>
        <span className={colorClass}>{percent.toFixed(1)}%</span>
      </div>

      <div className={`flex items-start gap-2 text-xs ${level === "ok" ? "text-muted-foreground" : colorClass}`}>
        {level !== "ok" && <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
        <span>{message}</span>
      </div>
    </div>
  );
};
