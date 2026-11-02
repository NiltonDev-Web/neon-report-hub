import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Save, FileDown, Printer, Plus, Trash2 } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EquipmentCard } from "@/components/EquipmentCard";
import { PdfExportDialog } from "@/components/PdfExportDialog";
import { getReport, saveReport, deleteReport, newId } from "@/lib/storage";
import { maskCPFCNPJ } from "@/lib/utils";
import type { Equipment, Report } from "@/types/report";
// PDF lib is loaded on-demand to keep initial mobile bundle light
import { toast } from "sonner";

const ReportEditor = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [dirty, setDirty] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!id) return;
    getReport(id).then((r) => {
      if (r) setReport(r);
      else { toast.error("Relatório não encontrado"); navigate("/"); }
    });
  }, [id, navigate]);

  // Autosave
  useEffect(() => {
    if (!report || !dirty) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveReport({ ...report, updatedAt: Date.now() });
      setDirty(false);
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [report, dirty]);

  if (!report) {
    return (
      <div className="min-h-screen grid-bg">
        <AppHeader />
        <div className="container py-10 text-muted-foreground">Carregando…</div>
      </div>
    );
  }

  const update = (patch: Partial<Report>) => {
    setReport({ ...report, ...patch });
    setDirty(true);
  };
  const updateClient = (patch: Partial<Report["client"]>) => {
    setReport({ ...report, client: { ...report.client, ...patch } });
    setDirty(true);
  };

  const addEquipment = () => {
    const eq: Equipment = {
      id: newId(),
      name: "",
      status: "operational",
      photos: [],
    };
    update({ equipments: [...report.equipments, eq] });
  };

  const updateEquipment = (idx: number, eq: Equipment) => {
    const arr = [...report.equipments];
    arr[idx] = eq;
    update({ equipments: arr });
  };

  const removeEquipment = (idx: number) => {
    if (!confirm("Remover este equipamento?")) return;
    update({ equipments: report.equipments.filter((_, i) => i !== idx) });
  };

  const handleSave = async () => {
    await saveReport({ ...report, updatedAt: Date.now() });
    setDirty(false);
    toast.success("Salvo");
  };

  const handleDelete = async () => {
    if (!confirm("Excluir este relatório?")) return;
    await deleteReport(report.id);
    toast.success("Excluído");
    navigate("/");
  };

  const handlePDF = async () => {
    if (!report.client.name) {
      toast.error("Informe o nome do cliente");
      return;
    }
    if (!report.equipments.length) {
      toast.error("Adicione ao menos um equipamento");
      return;
    }
    await saveReport({ ...report, updatedAt: Date.now() });
    setDirty(false);
    setPdfDialogOpen(true);
  };

  const handleGenerateEquipmentPDF = async (equipmentId: string) => {
    if (!report.client.name) {
      toast.error("Informe o nome do cliente");
      return;
    }
    await saveReport({ ...report, updatedAt: Date.now() });
    setDirty(false);
    const eq = report.equipments.find((e) => e.id === equipmentId);
    const eqLabel = eq?.name || "Equipamento";
    toast.promise(
      import("@/lib/pdf").then(({ generatePDF }) =>
        generatePDF(report, { equipmentId })
      ),
      {
        loading: `Gerando PDF de "${eqLabel}"…`,
        success: `PDF de "${eqLabel}" gerado com sucesso!`,
        error: "Erro ao gerar PDF",
      }
    );
  };

  return (
    <div className="min-h-screen grid-bg">
      <AppHeader>
        <Button variant="outline" size="sm" onClick={handleSave}>
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">{dirty ? "Salvar" : "Salvo"}</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Imprimir</span>
        </Button>
        <Button size="sm" onClick={handlePDF} className="bg-gradient-neon text-background font-bold shadow-glow-blue">
          <FileDown className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">PDF</span>
        </Button>
      </AppHeader>

      <main className="container py-6 space-y-6 print-area">
        <div className="flex items-center justify-between gap-3 no-print">
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar</Link>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDelete} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4 mr-1" /> Excluir
          </Button>
        </div>

        {/* Header */}
        <section className="neon-card p-5 space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Título do relatório</Label>
            <Input
              value={report.title}
              onChange={(e) => update({ title: e.target.value })}
              className="text-xl font-display"
              placeholder="Ex.: Manutenção Preventiva — Setor A"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Técnico responsável</Label>
              <Input value={report.technician} onChange={(e) => update({ technician: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Data do serviço</Label>
              <Input type="date" value={report.serviceDate} onChange={(e) => update({ serviceDate: e.target.value })} />
            </div>
          </div>
        </section>

        {/* Client */}
        <section className="neon-card p-5 space-y-4">
          <h2 className="font-display text-xl neon-text-lime">👤 CLIENTE</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Nome / Razão social *</Label>
              <Input value={report.client.name} onChange={(e) => updateClient({ name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">CPF / CNPJ</Label>
              <Input 
                value={report.client.document || ""} 
                onChange={(e) => updateClient({ document: maskCPFCNPJ(e.target.value) })} 
              />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Telefone</Label>
              <Input value={report.client.phone || ""} onChange={(e) => updateClient({ phone: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">E-mail</Label>
              <Input type="email" value={report.client.email || ""} onChange={(e) => updateClient({ email: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Endereço</Label>
              <Input value={report.client.address || ""} onChange={(e) => updateClient({ address: e.target.value })} />
            </div>
          </div>
        </section>

        {/* Equipments */}
        <section className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2 className="font-display text-xl neon-text-blue">⚙ EQUIPAMENTOS ({report.equipments.length})</h2>
            <Button onClick={addEquipment} variant="secondary" className="no-print">
              <Plus className="w-4 h-4 mr-1" /> Adicionar equipamento
            </Button>
          </div>

          {report.equipments.length === 0 ? (
            <div className="neon-card p-8 text-center text-muted-foreground">
              Nenhum equipamento. Clique em <span className="neon-text-lime">Adicionar equipamento</span> para começar.
            </div>
          ) : (
            report.equipments.map((eq, i) => (
              <EquipmentCard
                key={eq.id}
                index={i}
                equipment={eq}
                onChange={(newEq) => updateEquipment(i, newEq)}
                onRemove={() => removeEquipment(i)}
                onGeneratePDF={() => handleGenerateEquipmentPDF(eq.id)}
              />
            ))
          )}
        </section>

        {/* General notes */}
        <section className="neon-card p-5 space-y-2">
          <Label className="font-display text-lg neon-text-lime">📝 OBSERVAÇÕES GERAIS</Label>
          <Textarea rows={4} value={report.generalNotes || ""} onChange={(e) => update({ generalNotes: e.target.value })}
            placeholder="Recomendações, próxima visita, pendências…" />
        </section>

        <div className="flex justify-center pt-4 no-print">
          <Button size="lg" onClick={handlePDF} className="bg-gradient-neon text-background font-bold tracking-wider shadow-glow-lime">
            <FileDown className="w-5 h-5 mr-2" /> GERAR PDF
          </Button>
        </div>
      </main>

      <PdfExportDialog
        open={pdfDialogOpen}
        onOpenChange={setPdfDialogOpen}
        report={report}
      />
    </div>
  );
};

export default ReportEditor;
