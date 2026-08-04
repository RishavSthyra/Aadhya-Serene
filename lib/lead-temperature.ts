import { CHATBOT_BUTTONS } from "@/lib/chatbot-flow";

export type LeadTemperature = "cold" | "warm" | "hot";

type ConversationHistoryItem = {
  direction?: string;
  type?: string;
  buttonId?: string;
  message?: string;
  createdAt?: Date | string;
};

type ConversationSnapshot = {
  history?: ConversationHistoryItem[];
  callbackRequested?: boolean;
  siteVisitRequested?: boolean;
  updatedAt?: Date | string;
};

// These are genuine customer choices. Repeated taps on the same choice are
// still shown in the timeline but count once toward lead temperature.
const QUALIFYING_BUTTON_IDS = new Set([
  "explore_project",
  "brochure",
  "virtual_tour",
  "amenities",
  "location",
  "floor_plans",
  "pricing",
  "pricing_2bhk",
  "pricing_3bhk",
  "talk_to_sales",
  "request_callback",
  "book_site_visit",
  "site_visit_yes",
]);

function asIsoDate(value?: Date | string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function buttonLabel(buttonId: string, fallback: string) {
  const button = CHATBOT_BUTTONS[buttonId as keyof typeof CHATBOT_BUTTONS];
  return button?.label || fallback || buttonId;
}

export function getLeadTemperature(score: number): LeadTemperature {
  if (score >= 5) return "hot";
  if (score >= 3) return "warm";
  return "cold";
}

export function summarizeWhatsAppConversation(conversation?: ConversationSnapshot | null) {
  const responses = (conversation?.history || [])
    .filter(
      (entry) =>
        entry.direction === "inbound" &&
        entry.type === "button_reply" &&
        Boolean(entry.buttonId),
    )
    .map((entry) => ({
      buttonId: entry.buttonId || "",
      label: buttonLabel(entry.buttonId || "", entry.message || "Response"),
      receivedAt: asIsoDate(entry.createdAt),
      qualifies: QUALIFYING_BUTTON_IDS.has(entry.buttonId || ""),
    }));

  const score = new Set(
    responses.filter((response) => response.qualifies).map((response) => response.buttonId),
  ).size;

  return {
    score,
    temperature: getLeadTemperature(score),
    responses,
    callbackRequested: Boolean(conversation?.callbackRequested),
    siteVisitRequested: Boolean(conversation?.siteVisitRequested),
    lastActivityAt:
      responses.at(-1)?.receivedAt || asIsoDate(conversation?.updatedAt),
  };
}
