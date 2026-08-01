import { connectMongo } from "@/lib/mongodb";
import { WhatsAppConversation } from "@/lib/models";

const conversations: any = WhatsAppConversation;

type ConversationIntent = "site_visit" | "callback";

type StartConversationInput = {
  phoneNumber: string;
  name?: string;
  projectName?: string;
  source?: string;
  enquiryRecordId?: string;
};

type SelectionInput = {
  phoneNumber: string;
  buttonId: string;
  nextState: string;
  incomingMessage: string;
  messageId?: string;
  intent?: ConversationIntent;
};

function conversationHistoryEntry(input: {
  direction: "inbound" | "outbound" | "system";
  type: string;
  buttonId?: string;
  message?: string;
  messageId?: string;
}) {
  return {
    direction: input.direction,
    type: input.type,
    buttonId: input.buttonId || "",
    message: input.message || "",
    messageId: input.messageId || "",
    createdAt: new Date(),
  };
}

export async function startWhatsAppConversation(input: StartConversationInput) {
  await connectMongo();

  return conversations.findOneAndUpdate(
    { phoneNumber: input.phoneNumber },
    {
      $set: {
        enquiryRecordId: input.enquiryRecordId || "",
        name: input.name || "Customer",
        projectName: input.projectName || "Aadhya Serene",
        source: input.source || "website",
        currentState: "AWAITING_ENTRY",
        lastButton: "",
        siteVisitRequested: false,
        callbackRequested: false,
      },
      $push: {
        history: conversationHistoryEntry({
          direction: "system",
          type: "conversation_started",
          message: "WhatsApp conversation initialized.",
        }),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();
}

export async function getWhatsAppConversation(phoneNumber: string) {
  await connectMongo();
  return conversations.findOne({ phoneNumber }).lean();
}

export async function hasProcessedIncomingMessage(phoneNumber: string, messageId?: string) {
  if (!messageId) return false;

  await connectMongo();
  return Boolean(
    await conversations.exists({
      phoneNumber,
      "history.messageId": messageId,
    })
  );
}

export async function recordConversationSelection(input: SelectionInput) {
  await connectMongo();

  const existing = await conversations.findOne({
    phoneNumber: input.phoneNumber,
  }).lean();
  const intentField =
    input.intent === "site_visit"
      ? "siteVisitRequested"
      : input.intent === "callback"
        ? "callbackRequested"
        : null;
  const intentWasNew = intentField ? !existing?.[intentField] : false;
  const update: Record<string, unknown> = {
    currentState: input.nextState,
    lastButton: input.buttonId,
  };

  if (intentField) {
    update[intentField] = true;
  }

  const conversation = await conversations.findOneAndUpdate(
    { phoneNumber: input.phoneNumber },
    {
      $set: update,
      $setOnInsert: {
        phoneNumber: input.phoneNumber,
        name: "Customer",
        projectName: "Aadhya Serene",
        source: "whatsapp",
      },
      $push: {
        history: conversationHistoryEntry({
          direction: "inbound",
          type: "button_reply",
          buttonId: input.buttonId,
          message: input.incomingMessage,
          messageId: input.messageId,
        }),
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  return { conversation, intentWasNew };
}

export async function linkConversationToEnquiry(phoneNumber: string, enquiryRecordId: string) {
  await connectMongo();
  return conversations.findOneAndUpdate(
    { phoneNumber },
    { $set: { enquiryRecordId } },
    { new: true }
  ).lean();
}

export async function recordConversationOutboundMessage(
  phoneNumber: string,
  type: string,
  message: string
) {
  await connectMongo();
  return conversations.findOneAndUpdate(
    { phoneNumber },
    {
      $push: {
        history: conversationHistoryEntry({
          direction: "outbound",
          type,
          message,
        }),
      },
    },
    { new: true }
  ).lean();
}
