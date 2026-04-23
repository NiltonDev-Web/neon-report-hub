import { get, set, del, keys } from "idb-keyval";
import type { Report } from "@/types/report";

const PREFIX = "report:";

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
  const data = JSON.parse(json);
  const reports: Report[] = Array.isArray(data) ? data : data.reports || [];
  for (const r of reports) {
    if (r && r.id) await saveReport(r);
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
