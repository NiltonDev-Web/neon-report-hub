import { useRef } from "react";
import { Camera, Trash2, Plus, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Equipment } from "@/types/report";
import { STATUS_LABEL } from "@/types/report";
import { fileToCompressedDataURL } from "@/lib/image";
import { toast } from "sonner";

type Props = {
  equipment: Equipment;
  index: number;
  onChange: (eq: Equipment) => void;
  onRemove: () => void;
  onGeneratePDF?: () => void;
};

export const EquipmentCard = ({ equipment, index, onChange, onRemove, onGeneratePDF }: Props) => {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof Equipment>(key: K, value: Equipment[K]) => {
    onChange({ ...equipment, [key]: value });
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    try {
      const newPhotos: string[] = [];
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue;
        newPhotos.push(await fileToCompressedDataURL(f));
      }
      update("photos", [...equipment.photos, ...newPhotos]);
      toast.success(`${newPhotos.length} foto(s) adicionada(s)`);
    } catch {
      toast.error("Erro ao processar imagem");
    }
  };

  const removePhoto = (i: number) => {
    update("photos", equipment.photos.filter((_, idx) => idx !== i));
  };

  return (
    <div className="neon-card p-5 space-y-4 animate-flicker">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="font-display text-lg neon-text-blue flex items-center gap-2">
          <span>⚡ Equipamento #{index + 1}</span>
          {equipment.name && (
            <span className="text-sm font-normal text-muted-foreground hidden sm:inline">
              — {equipment.name}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {onGeneratePDF && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onGeneratePDF}
              className="border-[hsl(var(--neon-blue))]/40 hover:bg-[hsl(var(--neon-blue))]/10 text-xs text-[hsl(var(--neon-blue))]"
              title="Gerar PDF exclusivo deste equipamento"
            >
              <FileDown className="w-3.5 h-3.5 mr-1 text-[hsl(var(--neon-blue))]" />
              PDF do Equipamento
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onRemove} className="text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4 mr-1" /> Remover
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Nome do equipamento *">
          <Input value={equipment.name} onChange={(e) => update("name", e.target.value)} placeholder="Ex.: Compressor Atlas" />
        </Field>
        <Field label="Status">
          <Select value={equipment.status} onValueChange={(v) => update("status", v as Equipment["status"])}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(STATUS_LABEL).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Marca"><Input value={equipment.brand || ""} onChange={(e) => update("brand", e.target.value)} /></Field>
        <Field label="Modelo"><Input value={equipment.model || ""} onChange={(e) => update("model", e.target.value)} /></Field>
        <Field label="Nº de série"><Input value={equipment.serial || ""} onChange={(e) => update("serial", e.target.value)} /></Field>
        <Field label="Patrimônio"><Input value={equipment.patrimony || ""} onChange={(e) => update("patrimony", e.target.value)} /></Field>
        <Field label="Localização" className="md:col-span-2">
          <Input value={equipment.location || ""} onChange={(e) => update("location", e.target.value)} placeholder="Setor / sala / endereço" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Problema relatado">
          <Textarea rows={3} value={equipment.reportedIssue || ""} onChange={(e) => update("reportedIssue", e.target.value)} />
        </Field>
        <Field label="Diagnóstico">
          <Textarea rows={3} value={equipment.diagnosis || ""} onChange={(e) => update("diagnosis", e.target.value)} />
        </Field>
        <Field label="Ação realizada">
          <Textarea rows={3} value={equipment.actionTaken || ""} onChange={(e) => update("actionTaken", e.target.value)} />
        </Field>
        <Field label="Peças trocadas">
          <Textarea rows={3} value={equipment.partsReplaced || ""} onChange={(e) => update("partsReplaced", e.target.value)} />
        </Field>
        <Field label="Observações" className="md:col-span-2">
          <Textarea rows={2} value={equipment.observations || ""} onChange={(e) => update("observations", e.target.value)} />
        </Field>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <Label className="neon-text-lime font-display tracking-wider">📸 FOTOS ({equipment.photos.length})</Label>
          <div className="flex gap-2">
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
            <input ref={galleryRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
            <Button type="button" variant="secondary" size="sm" onClick={() => cameraRef.current?.click()}>
              <Camera className="w-4 h-4 mr-1" /> Câmera
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => galleryRef.current?.click()}>
              <Plus className="w-4 h-4 mr-1" /> Galeria
            </Button>
          </div>
        </div>

        {equipment.photos.length === 0 ? (
          <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground text-sm">
            Nenhuma foto. Toque em <span className="neon-text-blue">Câmera</span> para registrar.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {equipment.photos.map((p, i) => (
              <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                <img src={p} alt={`Foto ${i + 1}`} loading="lazy" decoding="async" className="w-full h-28 object-cover" />
                <button onClick={() => removePhoto(i)} aria-label="Remover foto"
                  className="absolute top-1 right-1 bg-destructive/90 text-destructive-foreground rounded-full p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={className}>
    <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">{label}</Label>
    {children}
  </div>
);
