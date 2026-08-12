import { NextResponse } from "next/server";
import {
  chatbotFlow,
  getChatbotButton,
  getChatbotInteractiveMessage,
  getChatbotTextMessage,
  resolveChatbotButtonId,
  type ChatbotAction,
  type ChatbotButtonId,
} from "@/lib/chatbot-flow";
import {
  hasProcessedIncomingMessage,
  linkConversationToEnquiry,
  recordConversationOutboundMessage,
  recordConversationSelection,
} from "@/lib/whatsapp-conversation";
import {
  findLatestEnquiryRecord,
  sendEnquiryNotificationEmail,
  updateEnquiryRecord,
} from "@/lib/enquiry-service";
import {
  sendDocumentMessage,
  sendInteractiveButtonMessage,
  sendTextMessage,
} from "@/lib/whatsapp";

export const runtime = "nodejs";

type IncomingMessage = {
  id?: string;
  from?: string;
  type?: string;
  text?: { body?: string };
  button?: { payload?: string; text?: string };
  interactive?: {
    button_reply?: { id?: string; title?: string };
    list_reply?: { id?: string; title?: string };
  };
};

type StatusUpdate = {
  id?: string;
  status?: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: Array<{
    code?: number;
    title?: string;
    message?: string;
    error_data?: {
      details?: string;
    };
  }>;
};

const WHATSAPP_STATUS_ORDER: Record<string, number> = {
  pending: 0,
  accepted: 1,
  sent: 2,
  delivered: 3,
  read: 4,
};

function getIncomingMessageSelection(message: IncomingMessage) {
  const candidates = [
    message.interactive?.button_reply?.id,
    message.interactive?.list_reply?.id,
    message.button?.payload,
    message.interactive?.button_reply?.title,
    message.interactive?.list_reply?.title,
    message.button?.text,
    message.text?.body,
  ];

  return {
    buttonId: resolveChatbotButtonId(candidates),
    text: candidates.find(Boolean)?.trim() || "",
  };
}

function normalizeStatusValue(status?: string) {
  const value = String(status || "").trim().toLowerCase();
  return ["sent", "delivered", "read", "failed"].includes(value) ? value : "";
}

function getStatusTimestamp(timestamp?: string) {
  if (!timestamp) {
    return new Date();
  }

  if (/^\d+$/.test(timestamp)) {
    return new Date(Number(timestamp) * 1000);
  }

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getStatusError(status: StatusUpdate) {
  const firstError = status.errors?.[0];

  return (
    firstError?.error_data?.details ||
    firstError?.message ||
    firstError?.title ||
    (firstError?.code ? `WhatsApp error ${firstError.code}` : "")
  );
}

async function rememberOutboundMessage(phoneNumber: string, type: string, message: string) {
  await recordConversationOutboundMessage(phoneNumber, type, message).catch((error) => {
    console.error("Unable to record WhatsApp outbound message:", error);
  });
}

async function sendConfiguredInteractiveMessage(
  phoneNumber: string,
  messageKey: Parameters<typeof getChatbotInteractiveMessage>[0]
) {
  const message = getChatbotInteractiveMessage(messageKey);

  await sendInteractiveButtonMessage({
    to: phoneNumber,
    header: message.header,
    body: message.body,
    footer: message.footer,
    buttons: message.buttons.map((buttonId) => {
      const button = getChatbotButton(buttonId);
      return { id: button.id, title: button.label };
    }),
  });

  await rememberOutboundMessage(phoneNumber, "interactive", message.body);
}

async function sendConfiguredTextMessage(
  phoneNumber: string,
  messageKey: Parameters<typeof getChatbotTextMessage>[0]
) {
  const text = getChatbotTextMessage(messageKey);
  await sendTextMessage(phoneNumber, text);
  await rememberOutboundMessage(phoneNumber, "text", text);
}

async function sendConfiguredBrochure(
  phoneNumber: string,
  messageKey: "brochure" | "floor_plans"
) {
  const caption = getChatbotTextMessage(messageKey);
  const brochureUrl = process.env.BROCHURE_URL?.trim();

  if (!brochureUrl) {
    await sendTextMessage(
      phoneNumber,
      `${caption}\n\nThe brochure link is not configured yet. Our sales team will share it shortly.`
    );
    await rememberOutboundMessage(phoneNumber, "text", caption);
    return;
  }

  try {
    await sendDocumentMessage({
      to: phoneNumber,
      link: brochureUrl,
      filename: "Aadhya-Serene-Brochure.pdf",
      caption,
    });
    await rememberOutboundMessage(phoneNumber, "document", caption);
  } catch (error) {
    console.error("WhatsApp brochure document delivery failed; sending a link instead:", error);
    const fallback = `${caption}\n\n${brochureUrl}`;
    await sendTextMessage(phoneNumber, fallback);
    await rememberOutboundMessage(phoneNumber, "text", fallback);
  }
}

async function resolveEnquiryRecord(phoneNumber: string, conversation: any) {
  let recordId = conversation?.enquiryRecordId || "";
  let record = null;

  if (recordId) {
    record = await findLatestEnquiryRecord({ _id: recordId });
  }

  if (!record) {
    record = await findLatestEnquiryRecord({ phone: phoneNumber });
    if (record?._id) {
      recordId = String(record._id);
      await linkConversationToEnquiry(phoneNumber, recordId);
    }
  }

  return record;
}

async function syncConversationToEnquiry(
  phoneNumber: string,
  conversation: any,
  incomingText: string
) {
  const record = await resolveEnquiryRecord(phoneNumber, conversation);

  if (!record?._id) {
    return null;
  }

  await updateEnquiryRecord(String(record._id), {
    $set: {
      "metadata.whatsappJourney.currentState": conversation.currentState,
      "metadata.whatsappJourney.lastButton": conversation.lastButton,
      "metadata.whatsappJourney.siteVisitRequested": Boolean(conversation.siteVisitRequested),
      "metadata.whatsappJourney.callbackRequested": Boolean(conversation.callbackRequested),
      "metadata.whatsappJourney.lastIncomingText": incomingText,
      "metadata.whatsappJourney.updatedAt": new Date(),
    },
  });

  return record;
}

async function notifySalesForIntent(
  intent: "site_visit" | "callback",
  record: any,
  conversation: any
) {
  if (!record?._id) {
    console.error("Cannot notify sales: no enquiry record is linked to this WhatsApp conversation.");
    return;
  }

  const isSiteVisit = intent === "site_visit";
  const intentLabel = isSiteVisit ? "Site Visit Requested" : "Callback Requested";
  const intentMessage = isSiteVisit
    ? "The customer requested a site visit through WhatsApp."
    : "The customer requested a callback through WhatsApp.";

  await sendEnquiryNotificationEmail({
    projectName: record.projectName || "Aadhya Serene",
    source: record.source || "website",
    channel: record.channel || "contact_form",
    name: conversation.name || record.name || "Customer",
    phone: conversation.phoneNumber || record.phone,
    email: record.email || "",
    requestType: isSiteVisit ? "site_visit" : "register_interest",
    requestLabel: intentLabel,
    preferredTime: "",
    message: intentMessage,
  });

  await updateEnquiryRecord(String(record._id), {
    $set: {
      "metadata.whatsappJourney.lastIntent": intent,
      "metadata.whatsappJourney.intentNotifiedAt": new Date(),
    },
    $push: {
      "metadata.activity": {
        type: "sales_intent_email",
        title: `${intentLabel} email sent to sales`,
        detail: intentMessage,
        occurredAt: new Date(),
        status: "sent",
      },
    },
  });
}

async function runChatbotAction(
  action: ChatbotAction,
  context: {
    phoneNumber: string;
    record: any;
    conversation: any;
    intentWasNew: boolean;
  }
) {
  const actionHandlers: Record<
    ChatbotAction["type"],
    (nextAction: any) => Promise<void>
  > = {
    interactive: async (nextAction) =>
      sendConfiguredInteractiveMessage(context.phoneNumber, nextAction.message),
    text: async (nextAction) =>
      sendConfiguredTextMessage(context.phoneNumber, nextAction.message),
    brochure: async (nextAction) =>
      sendConfiguredBrochure(context.phoneNumber, nextAction.message),
    intent: async (nextAction) => {
      if (context.intentWasNew) {
        await notifySalesForIntent(nextAction.intent, context.record, context.conversation);
      }
    },
  };

  await actionHandlers[action.type](action);
}

async function handleIncomingMessage(message: IncomingMessage) {
  const phoneNumber = message.from;
  const { buttonId, text } = getIncomingMessageSelection(message);

  if (!phoneNumber || !text) {
    return;
  }

  if (await hasProcessedIncomingMessage(phoneNumber, message.id)) {
    return;
  }

  if (!buttonId) {
    await sendConfiguredInteractiveMessage(phoneNumber, "main_menu");
    return;
  }

  const transition = chatbotFlow[buttonId as ChatbotButtonId];
  const intentAction = transition.actions.find((action) => action.type === "intent");
  const { conversation, intentWasNew } = await recordConversationSelection({
    phoneNumber,
    buttonId,
    nextState: transition.nextState,
    incomingMessage: text,
    messageId: message.id,
    intent: intentAction?.type === "intent" ? intentAction.intent : undefined,
  });
  const record = await syncConversationToEnquiry(phoneNumber, conversation, text);

  for (const action of transition.actions) {
    await runChatbotAction(action, {
      phoneNumber,
      record,
      conversation,
      intentWasNew,
    });
  }
}

async function handleStatusUpdate(statusUpdate: StatusUpdate) {
  const messageId = String(statusUpdate.id || "").trim();
  const nextStatus = normalizeStatusValue(statusUpdate.status);

  if (!messageId || !nextStatus) {
    return;
  }

  const record = await findLatestEnquiryRecord({
    "whatsappDelivery.messageId": messageId,
  });

  if (!record?._id) {
    return;
  }

  const currentStatus = String(record.whatsappDelivery?.status || "").trim().toLowerCase();
  const currentRank = WHATSAPP_STATUS_ORDER[currentStatus] || 0;
  const nextRank = WHATSAPP_STATUS_ORDER[nextStatus] || 0;

  if (nextStatus !== "failed" && currentRank >= nextRank) {
    return;
  }

  await updateEnquiryRecord(String(record._id), {
    $set: {
      whatsappDelivery: {
        status: nextStatus,
        metaStatus: nextStatus,
        metaStatusAt: getStatusTimestamp(statusUpdate.timestamp),
        metaRecipientId: String(statusUpdate.recipient_id || "").trim(),
        metaErrorCode: statusUpdate.errors?.[0]?.code || 0,
        sentAt: getStatusTimestamp(statusUpdate.timestamp),
        error: nextStatus === "failed" ? getStatusError(statusUpdate) : "",
        messageId,
      },
    },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const entries = body.entry || [];

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        for (const statusUpdate of change.value?.statuses || []) {
          await handleStatusUpdate(statusUpdate);
        }

        for (const message of change.value?.messages || []) {
          await handleIncomingMessage(message);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    return NextResponse.json(
      {
        received: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
