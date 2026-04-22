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
