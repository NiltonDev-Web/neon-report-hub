import { useState } from "react";
import { FileDown, FileText, Wrench, Camera, Loader2, Sparkles, Layers } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generatePDF, generateAllEquipmentsPDF } from "@/lib/pdf";
import type { Report, Equipment } from "@/types/report";
import { STATUS_LABEL, STATUS_COLOR } from "@/types/report";
import { toast } from "sonner";

interface PdfExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: Report | null;
}

export const PdfExportDialog = ({
  open,
  onOpenChange,
  report,
}: PdfExportDialogProps) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  if (!report) return null;

  const totalPhotos = report.equipments.reduce((sum, e) => sum + e.photos.length, 0);

  const handleExportFull = async () => {
    try {
      setLoadingAction("full");
      const t = toast.loading("Gerando relatório completo em PDF…");
      await generatePDF(report);
      toast.dismiss(t);
      toast.success("PDF completo gerado com sucesso!");
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF completo.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportEquipment = async (eq: Equipment) => {
    try {
      setLoadingAction(eq.id);
      const eqLabel = eq.name || "Equipamento";
      const t = toast.loading(`Gerando PDF de "${eqLabel}"…`);
      await generatePDF(report, { equipmentId: eq.id });
      toast.dismiss(t);
      toast.success(`PDF de "${eqLabel}" gerado com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDF do equipamento.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExportAllSeparate = async () => {
    try {
      setLoadingAction("all-separate");
      const t = toast.loading(`Gerando ${report.equipments.length} relatórios individuais…`);
      const count = await generateAllEquipmentsPDF(report);
      toast.dismiss(t);
      toast.success(`${count} relatórios individuais gerados com sucesso!`);
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar PDFs individuais.");
    } finally {
      setLoadingAction(null);
    }
  };

  const isBusy = loadingAction !== null;

  return (
    <Dialog open={open} onOpenChange={isBusy ? undefined : onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col p-6 border-cyan-500/30 bg-background/95 backdrop-blur-md">
        <DialogHeader className="pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2 text-xl font-display">
            <FileDown className="w-5 h-5 text-[hsl(var(--neon-blue))]" />
            <span className="neon-text-blue">Opções de Exportação em PDF</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Escolha se deseja gerar o documento técnico completo ou relatórios individuais separados por equipamento.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Opção 1: Relatório Completo */}
          <section className="p-4 rounded-xl border border-border bg-card/60 hover:border-[hsl(var(--neon-lime))]/60 transition-all space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[hsl(var(--neon-lime))]" />
                  <h4 className="font-semibold text-foreground text-base">
                    Relatório Geral Completo
                  </h4>
                  <Badge variant="outline" className="text-xs border-[hsl(var(--neon-lime))]/50 text-[hsl(var(--neon-lime))]">
                    Padrão
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Gera um documento consolidado contendo os dados do cliente, cabeçalho e todos os{" "}
                  <strong className="text-foreground">{report.equipments.length} equipamento(s)</strong> com suas fotos e laudos.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-muted-foreground">
                Total: {report.equipments.length} equip. • {totalPhotos} foto(s)
              </span>
              <Button
                size="sm"
                onClick={handleExportFull}
                disabled={isBusy || report.equipments.length === 0}
                className="bg-gradient-neon text-background font-bold shadow-glow-lime hover:opacity-90"
              >
                {loadingAction === "full" ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Gerando…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Gerar PDF Completo
                  </>
                )}
              </Button>
            </div>
          </section>

          {/* Opção 2: Por Equipamento Individual */}
          <section className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[hsl(var(--neon-blue))]" />
                <h4 className="font-semibold text-foreground text-sm uppercase tracking-wider">
                  Relatório por Equipamento Individual ({report.equipments.length})
                </h4>
              </div>

              {report.equipments.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportAllSeparate}
                  disabled={isBusy}
                  className="text-xs border-[hsl(var(--neon-blue))]/40 hover:bg-[hsl(var(--neon-blue))]/10 text-[hsl(var(--neon-blue))]"
                >
                  {loadingAction === "all-separate" ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Exportando todos…
                    </>
                  ) : (
                    <>
                      <FileDown className="w-3.5 h-3.5 mr-1.5" />
                      Gerar Todos Separados
                    </>
                  )}
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Cada documento foca exclusivamente no equipamento selecionado, incluindo seus dados cadastrais, diagnósticos técnicos, peças trocadas e fotos específicas:
            </p>

            {report.equipments.length === 0 ? (
              <div className="p-4 text-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                Nenhum equipamento cadastrado neste relatório.
              </div>
            ) : (
              <div className="space-y-2">
                {report.equipments.map((eq, idx) => (
                  <div
                    key={eq.id}
                    className="p-3 rounded-lg border border-border/80 bg-card/40 flex items-center justify-between gap-3 hover:border-[hsl(var(--neon-blue))]/40 transition"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-foreground truncate">
                          ⚡ {idx + 1}. {eq.name || "Sem identificação"}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded border ${STATUS_COLOR[eq.status]}`}>
                          {STATUS_LABEL[eq.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {eq.model && <span>Mod: {eq.model}</span>}
                        {eq.serial && <span>Série: {eq.serial}</span>}
                        <span className="flex items-center gap-1">
                          <Camera className="w-3 h-3" /> {eq.photos.length} foto(s)
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleExportEquipment(eq)}
                      disabled={isBusy}
                      className="border-[hsl(var(--neon-blue))]/50 hover:bg-[hsl(var(--neon-blue))]/10 text-xs text-[hsl(var(--neon-blue))] shrink-0"
                    >
                      {loadingAction === eq.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                          Gerando…
                        </>
                      ) : (
                        <>
                          <FileDown className="w-3.5 h-3.5 mr-1" />
                          PDF do Equipamento
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

