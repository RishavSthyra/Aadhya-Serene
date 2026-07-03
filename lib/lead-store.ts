export type LeadStep =
  | "STARTED"
  | "ASKED_UNIT_TYPE"
  | "ASKED_BUDGET"
  | "ASKED_VISIT_TIME"
  | "ASKED_CALL_TIME"
  | "COMPLETED";

export type LeadState = {
  phone: string;
  name?: string;
  projectName?: string;
  enquiryRecordId?: string;
  step: LeadStep;
  selectedOption?: string;
  unitType?: string;
  budget?: string;
  visitTime?: string;
  callTime?: string;
  createdAt: string;
  updatedAt: string;
};

declare global {
  var __abhignaLeadStore: Map<string, LeadState> | undefined;
}

const store = globalThis.__abhignaLeadStore ?? new Map<string, LeadState>();

if (!globalThis.__abhignaLeadStore) {
  globalThis.__abhignaLeadStore = store;
}

export function getLeadState(phone: string): LeadState | undefined {
  return store.get(phone);
}

export function upsertLeadState(
  phone: string,
  data: Partial<Omit<LeadState, "phone" | "createdAt" | "updatedAt">>
): LeadState {
  const existing = store.get(phone);
  const now = new Date().toISOString();

  const next: LeadState = {
    phone,
    name: existing?.name,
    projectName: existing?.projectName,
    enquiryRecordId: existing?.enquiryRecordId,
    step: existing?.step || "STARTED",
    selectedOption: existing?.selectedOption,
    unitType: existing?.unitType,
    budget: existing?.budget,
    visitTime: existing?.visitTime,
    callTime: existing?.callTime,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    ...data,
  };

  store.set(phone, next);
  return next;
}

export function resetLeadState(phone: string) {
  store.delete(phone);
}
