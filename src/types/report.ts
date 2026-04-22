export type Client = {
  name: string;
  document?: string; // CPF/CNPJ
  phone?: string;
  email?: string;
  address?: string;
};

export type Equipment = {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  serial?: string;
  patrimony?: string;
  location?: string;
  status: "operational" | "attention" | "critical" | "inoperative";
  reportedIssue?: string;
  diagnosis?: string;
  actionTaken?: string;
  partsReplaced?: string;
  observations?: string;
  photos: string[]; // base64 data URLs
};

export type Report = {
  id: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  technician: string;
  serviceDate: string; // ISO date
  client: Client;
  equipments: Equipment[];
  generalNotes?: string;
};

export const STATUS_LABEL: Record<Equipment["status"], string> = {
  operational: "Operacional",
  attention: "Atenção",
  critical: "Crítico",
  inoperative: "Inoperante",
};

export const STATUS_COLOR: Record<Equipment["status"], string> = {
  operational: "text-[hsl(var(--neon-lime))] border-[hsl(var(--neon-lime))]",
  attention: "text-yellow-300 border-yellow-300",
  critical: "text-orange-400 border-orange-400",
  inoperative: "text-[hsl(var(--destructive))] border-[hsl(var(--destructive))]",
};
