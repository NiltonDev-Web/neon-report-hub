import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, Plus, Download, Upload, Trash2, Calendar, User, ShieldCheck, Loader2, FileDown } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { StorageUsagePanel } from "@/components/StorageUsagePanel";
import { PdfExportDialog } from "@/components/PdfExportDialog";
import { Button } from "@/components/ui/button";
import { listReports, deleteReport, exportAllReports, importReports, newId, saveReport, simulateBackupCycle } from "@/lib/storage";
import type { Report } from "@/types/report";
import { toast } from "sonner";

const Reports = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [selectedReportForPdf, setSelectedReportForPdf] = useState<Report | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setReports(await listReports());
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleNew = async () => {
    const id = newId();
    const now = Date.now();
    const draft: Report = {
      id,
      createdAt: now,
      updatedAt: now,
      title: "Novo Relatório",
      technician: "",
      serviceDate: new Date().toISOString().slice(0, 10),
      client: { name: "" },
      equipments: [],
    };
    await saveReport(draft);
    navigate(`/relatorio/${id}`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir este relatório? Não pode ser desfeito.")) return;
    await deleteReport(id);
    toast.success("Relatório excluído");
    load();
  };

  const handleExport = async () => {
    const json = await exportAllReports();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `neontech-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado");
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const n = await importReports(text);
      toast.success(`${n} relatório(s) importado(s)`);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Arquivo inválido");
    }
  };

  const handleSimulateBackup = async () => {
    if (!reports.length) {
      toast.error("Nada para simular — crie um relatório primeiro");
      return;
    }
    if (!confirm(
      "Simular backup?\n\nIsto irá:\n1) Exportar tudo para JSON\n2) Limpar o IndexedDB\n3) Reimportar e verificar integridade\n\nUm arquivo de backup será baixado como segurança."
    )) return;

    setSimulating(true);
    const t = toast.loading("Simulando ciclo de backup…");
    try {
      const result = await simulateBackupCycle();

      // Baixa o JSON como salvaguarda
      const blob = new Blob([result.json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `neontech-simulacao-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);

      await load();
      toast.dismiss(t);

      const kb = (result.bytes / 1024).toFixed(1);
      if (result.ok) {
        toast.success(
          `✅ Integridade OK — ${result.exportedCount} relatório(s), ${kb} KB, ${result.durationMs}ms`
        );
      } else {
        toast.error(
          `⚠ ${result.mismatches.length} divergência(s): ${result.mismatches.slice(0, 2).join(" | ")}`,
          { duration: 8000 }
        );
      }
    } catch (e) {
      toast.dismiss(t);
      toast.error("Falha ao simular backup");
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="min-h-screen grid-bg">
      <AppHeader>
        <input ref={importRef} type="file" accept="application/json" className="hidden" aria-label="Importar arquivo JSON"
          onChange={(e) => { if (e.target.files?.[0]) handleImport(e.target.files[0]); e.target.value = ""; }} />
        <Button variant="outline" size="sm" onClick={() => importRef.current?.click()}>
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Importar</span>
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!reports.length}>
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Backup</span>
        </Button>
      </AppHeader>

      <main className="container py-8">
        <section className="mb-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-black mb-3">
            <span className="neon-text-blue">RELATÓRIOS</span>{" "}
            <span className="neon-text-lime">TÉCNICOS</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Registre clientes, equipamentos e fotos. Tudo salvo no seu dispositivo. Exporte em PDF a qualquer momento.
          </p>
          <Button
            size="lg"
            onClick={handleNew}
            className="mt-6 bg-gradient-neon text-background font-bold tracking-wider shadow-glow-blue hover:shadow-glow-lime transition-shadow"
          >
            <Plus className="w-5 h-5 mr-2" /> NOVO RELATÓRIO
          </Button>
        </section>

        <section className="mb-6 max-w-md mx-auto space-y-3">
          <StorageUsagePanel />
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateBackup}
            disabled={simulating || !reports.length}
            className="w-full border-[hsl(var(--neon-lime))]/40 hover:bg-[hsl(var(--neon-lime))]/10"
          >
            {simulating
              ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Simulando…</>
              : <><ShieldCheck className="w-4 h-4 mr-2 neon-text-lime" /> Simular backup (verificar integridade)</>}
          </Button>
        </section>

        <section>
          <h2 className="font-display text-xl mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 neon-text-blue" />
            Meus relatórios <span className="text-muted-foreground text-sm">({reports.length})</span>
          </h2>

          {loading ? (
            <p className="text-muted-foreground">Carregando…</p>
          ) : reports.length === 0 ? (
            <div className="neon-card p-10 text-center">
              <p className="text-muted-foreground mb-4">Nenhum relatório ainda.</p>
              <Button onClick={handleNew} variant="secondary">
                <Plus className="w-4 h-4 mr-1" /> Criar o primeiro
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((r) => (
                <article key={r.id} className="neon-card p-5 hover:shadow-glow-blue transition-shadow group">
                  <Link to={`/relatorio/${r.id}`} className="block space-y-2">
                    <h3 className="font-display text-lg neon-text-blue line-clamp-1">{r.title || "Sem título"}</h3>
                    <p className="text-sm flex items-center gap-1 text-muted-foreground">
                      <User className="w-3.5 h-3.5" /> {r.client.name || "Cliente não informado"}
                    </p>
                    <p className="text-sm flex items-center gap-1 text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(r.serviceDate).toLocaleDateString("pt-BR")}
                    </p>
                    <div className="flex items-center gap-3 text-xs pt-2 border-t border-border">
                      <span className="neon-text-lime">{r.equipments.length} equip.</span>
                      <span className="text-muted-foreground">
                        {r.equipments.reduce((s, e) => s + e.photos.length, 0)} fotos
                      </span>
                    </div>
                  </Link>
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        if (!r.equipments.length) {
                          toast.error("Este relatório não possui equipamentos cadastrados.");
                          return;
                        }
                        setSelectedReportForPdf(r);
                      }}
                      className="flex-1 border-[hsl(var(--neon-blue))]/40 hover:bg-[hsl(var(--neon-blue))]/10 text-xs text-[hsl(var(--neon-blue))]"
                    >
                      <FileDown className="w-3.5 h-3.5 mr-1" /> PDF
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(r.id)}
                      className="text-destructive hover:bg-destructive/10 text-xs px-2"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <PdfExportDialog
        open={Boolean(selectedReportForPdf)}
        onOpenChange={(open) => {
          if (!open) setSelectedReportForPdf(null);
        }}
        report={selectedReportForPdf}
      />
    </div>
  );
};

export default Reports;
