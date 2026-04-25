import { get, set, del, keys } from "idb-keyval";
import { z } from "zod";
import type { Report } from "@/types/report";

const PREFIX = "report:";
const MAX_IMPORT_BYTES = 50 * 1024 * 1024; // 50 MB
const MAX_REPORTS_PER_IMPORT = 1000;
const MAX_EQUIPMENTS_PER_REPORT = 500;
const MAX_PHOTOS_PER_EQUIPMENT = 100;

// Only allow inline base64 data URLs for images — blocks external URL injection
// (which would otherwise leak the user's IP / fingerprint to third-party servers).
const photoSchema = z
  .string()
  .max(15 * 1024 * 1024) // ~15 MB per photo as data URL
  .regex(/^data:image\/(jpeg|jpg|png|webp|gif);base64,[A-Za-z0-9+/=]+$/, {
    message: "Foto deve ser um data URL base64 de imagem",
  });

const equipmentSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().max(500),
  brand: z.string().max(200).optional(),
  model: z.string().max(200).optional(),
  serial: z.string().max(200).optional(),
  patrimony: z.string().max(200).optional(),
  location: z.string().max(500).optional(),
  status: z.enum(["operational", "attention", "critical", "inoperative"]),
  reportedIssue: z.string().max(5000).optional(),
  diagnosis: z.string().max(5000).optional(),
  actionTaken: z.string().max(5000).optional(),
  partsReplaced: z.string().max(5000).optional(),
  observations: z.string().max(5000).optional(),
  photos: z.array(photoSchema).max(MAX_PHOTOS_PER_EQUIPMENT),
});

const clientSchema = z.object({
  name: z.string().max(300),
  document: z.string().max(50).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().max(255).optional(),
  address: z.string().max(500).optional(),
});

const reportSchema = z.object({
  id: z.string().min(1).max(100),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  title: z.string().max(500),
  technician: z.string().max(300),
  serviceDate: z.string().max(50),
  client: clientSchema,
  equipments: z.array(equipmentSchema).max(MAX_EQUIPMENTS_PER_REPORT),
  generalNotes: z.string().max(10000).optional(),
});

const importPayloadSchema = z.union([
  z.array(reportSchema).max(MAX_REPORTS_PER_IMPORT),
  z.object({
    version: z.number().optional(),
    exportedAt: z.number().optional(),
    reports: z.array(reportSchema).max(MAX_REPORTS_PER_IMPORT),
  }),
]);

export async function saveReport(report: Report): Promise<void> {
  await set(PREFIX + report.id, report);
}

export async function getReport(id: string): Promise<Report | undefined> {
  return (await get(PREFIX + id)) as Report | undefined;
}

export async function deleteReport(id: string): Promise<void> {
  await del(PREFIX + id);
}

export async function listReports(): Promise<Report[]> {
  const allKeys = await keys();
  const reportKeys = allKeys.filter((k) => typeof k === "string" && (k as string).startsWith(PREFIX));
  const reports = await Promise.all(reportKeys.map((k) => get(k) as Promise<Report>));
  return reports
    .filter(Boolean)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function exportAllReports(): Promise<string> {
  const reports = await listReports();
  return JSON.stringify({ version: 1, exportedAt: Date.now(), reports }, null, 2);
}

export async function importReports(json: string): Promise<number> {
  // Hard byte cap to prevent storage exhaustion via huge payloads
  if (new Blob([json]).size > MAX_IMPORT_BYTES) {
    throw new Error(`Arquivo excede o limite de ${MAX_IMPORT_BYTES / (1024 * 1024)} MB`);
  }
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("JSON inválido");
  }
  const parsed = importPayloadSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Formato de backup inválido ou corrompido");
  }
  const reports = (Array.isArray(parsed.data) ? parsed.data : parsed.data.reports) as Report[];
  for (const r of reports) {
    await saveReport(r);
  }
  return reports.length;
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export type BackupSimulationResult = {
  exportedCount: number;
  importedCount: number;
  bytes: number;
  durationMs: number;
  ok: boolean;
  mismatches: string[];
  json: string;
};

/**
 * Simula um ciclo completo de backup: exporta tudo para JSON,
 * limpa o IndexedDB, importa de volta e compara o resultado para
 * verificar integridade dos dados (ids, contagens, fotos).
 */
export async function simulateBackupCycle(): Promise<BackupSimulationResult> {
  const start = performance.now();
  const before = await listReports();
  const json = await exportAllReports();
  const bytes = new Blob([json]).size;

  const allKeys = await keys();
  const reportKeys = allKeys.filter(
    (k) => typeof k === "string" && (k as string).startsWith(PREFIX)
  );
  await Promise.all(reportKeys.map((k) => del(k)));

  const importedCount = await importReports(json);
  const after = await listReports();

  const mismatches: string[] = [];
  if (before.length !== after.length) {
    mismatches.push(`Contagem divergente: antes ${before.length}, depois ${after.length}`);
  }
  const beforeMap = new Map(before.map((r) => [r.id, r]));
  for (const r of after) {
    const orig = beforeMap.get(r.id);
    if (!orig) {
      mismatches.push(`ID ausente após import: ${r.id}`);
      continue;
    }
    if (orig.equipments.length !== r.equipments.length) {
      mismatches.push(`Equipamentos divergentes em "${r.title}"`);
    }
    const op = orig.equipments.reduce((s, e) => s + e.photos.length, 0);
    const np = r.equipments.reduce((s, e) => s + e.photos.length, 0);
    if (op !== np) mismatches.push(`Fotos divergentes em "${r.title}": ${op} → ${np}`);
  }

  return {
    exportedCount: before.length,
    importedCount,
    bytes,
    durationMs: Math.round(performance.now() - start),
    ok: mismatches.length === 0,
    mismatches,
    json,
  };
}
