import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, Plus, Download, Upload, Trash2, Calendar, User } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { StorageUsagePanel } from "@/components/StorageUsagePanel";
import { Button } from "@/components/ui/button";
import { listReports, deleteReport, exportAllReports, importReports, newId, saveReport } from "@/lib/storage";
import type { Report } from "@/types/report";
import { toast } from "sonner";

const Reports = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
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
    window.location.href = `/relatorio/${id}`;
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
    } catch {
      toast.error("Arquivo inválido");
    }
  };

  return (
    <div className="min-h-screen grid-bg">
      <AppHeader>
        <input ref={importRef} type="file" accept="application/json" className="hidden"
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
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => handleDelete(r.id)}
                    className="mt-3 w-full text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Excluir
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Reports;
