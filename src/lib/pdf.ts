import jsPDF from "jspdf";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";
import type { Report, Equipment } from "@/types/report";
import { STATUS_LABEL } from "@/types/report";

const A4_W = 210;
const A4_H = 297;
const MARGIN = 14;

export interface GeneratePDFOptions {
  equipmentId?: string; // Se fornecido, gera o relatório exclusivo deste equipamento
}

export async function generatePDF(report: Report, options?: GeneratePDFOptions): Promise<void> {
  const targetEquipment = options?.equipmentId
    ? report.equipments.find((e) => e.id === options.equipmentId)
    : undefined;
  const isIndividual = Boolean(targetEquipment);

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > A4_H - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const line = () => {
    doc.setDrawColor(0, 180, 255);
    doc.setLineWidth(0.4);
    doc.line(MARGIN, y, A4_W - MARGIN, y);
    y += 4;
  };

  // Header
  doc.setFillColor(11, 16, 32);
  doc.rect(0, 0, A4_W, 26, "F");
  doc.setTextColor(0, 220, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(
    isIndividual ? "RELATÓRIO TÉCNICO — EQUIPAMENTO" : "RELATÓRIO TÉCNICO",
    MARGIN,
    11
  );
  doc.setFontSize(10);
  doc.setTextColor(180, 255, 80);
  const subtitle = isIndividual && targetEquipment
    ? `${report.title || "Sem título"} | ${targetEquipment.name || "Equipamento"}`
    : (report.title || "Sem título");
  doc.text(subtitle.slice(0, 65), MARGIN, 18);

  if (isIndividual && targetEquipment) {
    doc.setFontSize(8.5);
    doc.setTextColor(200, 230, 255);
    doc.text(`Status: ${STATUS_LABEL[targetEquipment.status]}`, MARGIN, 23);
  }

  y = 33;

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.text(`Data do serviço: ${formatDate(report.serviceDate)}`, MARGIN, y);
  doc.text(`Técnico: ${report.technician || "-"}`, A4_W / 2, y);
  y += 5;
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, MARGIN, y);
  if (isIndividual) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 100, 160);
    doc.text(`[Relatório Individual por Equipamento]`, A4_W / 2, y);
    doc.setTextColor(20, 20, 20);
    doc.setFont("helvetica", "normal");
  }
  y += 4;
  line();

  // Client
  ensureSpace(30);
  sectionTitle(doc, "DADOS DO CLIENTE", y);
  y += 7;
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  const c = report.client;
  doc.text(`Nome: ${c.name || "-"}`, MARGIN, y); y += 5;
  if (c.document) { doc.text(`Documento: ${c.document}`, MARGIN, y); y += 5; }
  if (c.phone) { doc.text(`Telefone: ${c.phone}`, MARGIN, y); y += 5; }
  if (c.email) { doc.text(`E-mail: ${c.email}`, MARGIN, y); y += 5; }
  if (c.address) {
    const lines = doc.splitTextToSize(`Endereço: ${c.address}`, A4_W - MARGIN * 2);
    doc.text(lines, MARGIN, y); y += lines.length * 5;
  }
  y += 2;
  line();

  // Equipments
  const equipmentsToRender: Equipment[] = isIndividual && targetEquipment
    ? [targetEquipment]
    : report.equipments;

  for (let i = 0; i < equipmentsToRender.length; i++) {
    const eq = equipmentsToRender[i];
    ensureSpace(40);
    const equipTitle = isIndividual
      ? `EQUIPAMENTO: ${eq.name || "Sem identificação"}`
      : `EQUIPAMENTO ${i + 1}: ${eq.name || "Sem identificação"}`;
    sectionTitle(doc, equipTitle, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(eq.name || "-", MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(`[${STATUS_LABEL[eq.status]}]`, A4_W - MARGIN, y, { align: "right" });
    y += 6;

    const info: [string, string | undefined][] = [
      ["Marca", eq.brand],
      ["Modelo", eq.model],
      ["Nº Série", eq.serial],
      ["Patrimônio", eq.patrimony],
      ["Localização", eq.location],
    ];
    for (const [k, v] of info) {
      if (v) { doc.text(`${k}: ${v}`, MARGIN, y); y += 5; ensureSpace(6); }
    }

    const blocks: [string, string | undefined][] = [
      ["Problema relatado", eq.reportedIssue],
      ["Diagnóstico", eq.diagnosis],
      ["Ação realizada", eq.actionTaken],
      ["Peças trocadas", eq.partsReplaced],
      ["Observações", eq.observations],
    ];
    for (const [k, v] of blocks) {
      if (!v) continue;
      ensureSpace(10);
      doc.setFont("helvetica", "bold");
      doc.text(`${k}:`, MARGIN, y); y += 5;
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(v, A4_W - MARGIN * 2);
      ensureSpace(lines.length * 5);
      doc.text(lines, MARGIN, y); y += lines.length * 5 + 1;
    }

    // Photos
    if (eq.photos.length) {
      ensureSpace(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Registro Fotográfico (${eq.photos.length} foto${eq.photos.length > 1 ? "s" : ""}):`, MARGIN, y);
      y += 5;
      const cols = 2;
      const gap = 4;
      const cellW = (A4_W - MARGIN * 2 - gap) / cols;
      const cellH = cellW * 0.75;
      let col = 0;
      for (const photo of eq.photos) {
        if (col === 0) ensureSpace(cellH + 4);
        const x = MARGIN + col * (cellW + gap);
        try {
          doc.addImage(photo, "JPEG", x, y, cellW, cellH, undefined, "FAST");
        } catch {}
        col++;
        if (col === cols) {
          col = 0;
          y += cellH + gap;
        }
      }
      if (col !== 0) y += cellH + gap;
    }

    y += 2;
    line();
  }

  // General notes
  if (report.generalNotes) {
    ensureSpace(20);
    sectionTitle(doc, "OBSERVAÇÕES GERAIS", y);
    y += 7;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const lines = doc.splitTextToSize(report.generalNotes, A4_W - MARGIN * 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * 5;
  }

  // Signature
  ensureSpace(30);
  y += 10;
  doc.setDrawColor(0, 0, 0);
  doc.line(MARGIN, y, MARGIN + 80, y);
  doc.line(A4_W - MARGIN - 80, y, A4_W - MARGIN, y);
  y += 4;
  doc.setFontSize(9);
  doc.text("Assinatura do Técnico", MARGIN, y);
  doc.text("Assinatura do Cliente", A4_W - MARGIN - 80, y);

  // Footer page numbers
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Página ${p} de ${pageCount}`, A4_W - MARGIN, A4_H - 6, { align: "right" });
    const footerLabel = isIndividual && targetEquipment
      ? `NeonTech Reports • Equipamento: ${targetEquipment.name || "Individual"}`
      : "NeonTech Reports • NS Soluções em TI";
    doc.text(footerLabel, MARGIN, A4_H - 6);
  }

  const safeTitle = (report.title || "relatorio").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 25);
  let fileName = `${safeTitle}_${report.id.slice(0, 8)}.pdf`;
  let shareTitle = report.title || "Relatório Técnico";
  let shareText = `Relatório Técnico: ${report.title || "Sem título"}`;

  if (isIndividual && targetEquipment) {
    const safeEq = (targetEquipment.name || "equip").replace(/[^a-z0-9-_]+/gi, "_").slice(0, 20);
    fileName = `${safeTitle}_${safeEq}_${report.id.slice(0, 6)}.pdf`;
    shareTitle = `${report.title || "Relatório"} - ${targetEquipment.name}`;
    shareText = `Relatório Técnico do Equipamento: ${targetEquipment.name}`;
  }

  if (Capacitor.isNativePlatform()) {
    try {
      const dataUri = doc.output("datauristring");
      const base64Data = dataUri.split(",")[1];
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Documents,
        recursive: true,
      });

      await Share.share({
        title: shareTitle,
        text: shareText,
        url: savedFile.uri,
        dialogTitle: "Compartilhar Relatório em PDF",
      });
      return;
    } catch (e) {
      console.warn("Erro ao salvar nativamente com Capacitor:", e);
    }
  }

  doc.save(fileName);
}

export async function generateEquipmentPDF(report: Report, equipmentId: string): Promise<void> {
  return generatePDF(report, { equipmentId });
}

export async function generateAllEquipmentsPDF(report: Report): Promise<number> {
  let count = 0;
  for (const eq of report.equipments) {
    await generatePDF(report, { equipmentId: eq.id });
    count++;
    if (report.equipments.length > 1) {
      await new Promise((resolve) => setTimeout(resolve, 800));
    }
  }
  return count;
}

function sectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setFillColor(0, 220, 255);
  doc.rect(14, y - 4, 4, 6, "F");
  doc.setTextColor(0, 100, 160);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(text, 20, y);
  doc.setTextColor(20, 20, 20);
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}
