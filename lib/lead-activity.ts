import { CHATBOT_BUTTONS } from "@/lib/chatbot-flow";
import { getWhatsAppTemplateStatusCopy } from "@/lib/whatsapp-delivery";

type ActivityEvent = {
  type: string;
  title: string;
  detail: string;
  occurredAt: string;
  status?: string;
};

function asIso(value: unknown) {
  if (!value) return "";
  const date = new Date(value as string | Date);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function buttonLabel(buttonId: string, fallback: string) {
  const button = CHATBOT_BUTTONS[buttonId as keyof typeof CHATBOT_BUTTONS];
  return button?.label || fallback || buttonId || "Customer response";
}

function deliveryEvent(input: {
  state?: { status?: string; sentAt?: Date | string; error?: string };
  title: string;
  detail: string;
  type: string;
  fallbackAt: unknown;
}) {
  const status = input.state?.status;
  if (!status || status === "pending" || status === "not_requested") return null;

  const isSent = status === "sent";
  const whatsappStatusCopy =
    input.type === "whatsapp_template"
      ? getWhatsAppTemplateStatusCopy(status, input.state?.error || "")
      : null;

  return {
    type: input.type,
    title: whatsappStatusCopy
      ? whatsappStatusCopy.title
      : isSent
        ? input.title
        : `${input.title} failed`,
    detail: whatsappStatusCopy
      ? whatsappStatusCopy.detail
      : isSent
        ? input.detail
        : input.state?.error || "Delivery could not be completed.",
    occurredAt: asIso(input.state?.sentAt) || asIso(input.fallbackAt),
    status,
  } satisfies ActivityEvent;
}

export function buildLeadActivity(lead: any, conversation?: any) {
  const events: ActivityEvent[] = [];
  const receivedAt = asIso(lead?.createdAt);

  if (receivedAt) {
    events.push({
      type: "lead_received",
      title: "Lead received",
      detail: `Received from ${lead?.source || "website"}.`,
      occurredAt: receivedAt,
      status: "received",
    });
  }

  const emailEvent = deliveryEvent({
    state: lead?.emailDelivery,
    title: "Sales email sent",
    detail: "Lead details sent to the sales team.",
    type: "sales_email",
    fallbackAt: lead?.createdAt,
  });
  if (emailEvent) events.push(emailEvent);

  const whatsappEvent = deliveryEvent({
    state: lead?.whatsappDelivery,
    title: "WhatsApp template update",
    detail: "WhatsApp delivery status updated.",
    type: "whatsapp_template",
    fallbackAt: lead?.createdAt,
  });
  if (whatsappEvent) events.push(whatsappEvent);

  for (const entry of conversation?.history || []) {
    const occurredAt = asIso(entry?.createdAt);
    if (!occurredAt) continue;

    if (entry.direction === "inbound" && entry.type === "button_reply") {
      const label = buttonLabel(entry.buttonId || "", entry.message || "");
      events.push({
        type: "customer_selection",
        title: `Customer selected ${label}`,
        detail: "WhatsApp quick reply received.",
        occurredAt,
        status: "received",
      });
      continue;
    }

    if (entry.direction === "outbound" && entry.type !== "template") {
      const title = entry.type === "document"
        ? "Brochure sent on WhatsApp"
        : entry.type === "interactive"
          ? "WhatsApp options sent"
          : "WhatsApp message sent";
      events.push({
        type: "whatsapp_outbound",
        title,
        detail: entry.message || "WhatsApp message sent to the customer.",
        occurredAt,
        status: "sent",
      });
    }
  }

  const persistedActivity = lead?.metadata?.activity || [];
  for (const event of persistedActivity) {
    const occurredAt = asIso(event?.occurredAt);
    if (!occurredAt || !event?.title) continue;
    events.push({
      type: event.type || "activity",
      title: event.title,
      detail: event.detail || "",
      occurredAt,
      status: event.status || "sent",
    });
  }

  // Older records stored only the latest intent timestamp. Keep those records
  // useful in the new sidebar while newer records use the precise activity log.
  const journey = lead?.metadata?.whatsappJourney;
  const hasPersistedIntentEmail = persistedActivity.some(
    (event: any) => event?.type === "sales_intent_email",
  );
  if (!hasPersistedIntentEmail && journey?.lastIntent && journey?.intentNotifiedAt) {
    const intentLabel = journey.lastIntent === "site_visit" ? "Site visit" : "Callback";
    events.push({
      type: "sales_intent_email",
      title: `${intentLabel} request email sent to sales`,
      detail: "Sales team notified after the customer's WhatsApp request.",
      occurredAt: asIso(journey.intentNotifiedAt),
      status: "sent",
    });
  }

  return events.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt));
}
