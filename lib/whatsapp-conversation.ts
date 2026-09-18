import { connectMongo } from "@/lib/mongodb";
import { Notification, WhatsAppConversation } from "@/lib/models";

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

async function appendCanonicalWhatsAppIntent(
  phoneNumber: string,
  intent: ConversationIntent,
  messageId?: string,
) {
  const record = await Notification.findOne({ phone: phoneNumber }).sort({ createdAt: -1 }).lean();
  const eventKey = `whatsapp:${intent}:${messageId || phoneNumber}`;
  if (!record?._id) return { eventKey, inserted: false };

  const event = {
    eventKey,
    type: intent === "site_visit" ? "site_visit_booked" : "whatsapp_callback_requested",
    occurredAt: new Date(),
    actorName: "WhatsApp",
    actorEmail: "",
    source: "whatsapp",
    callId: "",
    callbackDueAt: null,
    callbackStatus: intent === "callback" ? "pending" : "none",
  };

  const result = await Notification.updateOne(
    {
      _id: record._id,
      "leadLifecycle.events.eventKey": { $ne: eventKey },
    },
    {
      $set: intent === "callback"
        ? {
            "leadLifecycle.bucket": "callback_requested",
            "leadLifecycle.callbackStatus": "pending",
            "leadLifecycle.callbackDueAt": null,
            "leadLifecycle.callbackUpdatedAt": event.occurredAt,
            "leadLifecycle.stateUpdatedAt": event.occurredAt,
          }
        : {
            "leadLifecycle.bucket": "site_visit_booked",
            "leadLifecycle.siteVisitBookedAt": event.occurredAt,
            "leadLifecycle.stateUpdatedAt": event.occurredAt,
          },
      $push: { "leadLifecycle.events": event },
    },
  );

  return { eventKey, inserted: result.modifiedCount === 1 };
}

async function claimIntentNotification(
  phoneNumber: string,
  intent: ConversationIntent,
  eventKey: string,
) {
  const record = await Notification.findOne({ phone: phoneNumber }).sort({ createdAt: -1 }).lean();
  if (!record?._id) return null;

  const notification = record.metadata?.whatsappJourney?.intentNotifications?.[intent];
  if (notification?.sentAt) return null;

  const staleBefore = new Date(Date.now() - 15 * 60 * 1000);
  return Notification.findOneAndUpdate(
    {
      _id: record._id,
      [`metadata.whatsappJourney.intentNotifications.${intent}.sentAt`]: { $exists: false },
      $or: [
        { [`metadata.whatsappJourney.intentNotifications.${intent}.claimedAt`]: { $exists: false } },
        { [`metadata.whatsappJourney.intentNotifications.${intent}.claimedAt`]: { $lt: staleBefore } },
      ],
    },
    {
      $set: {
        [`metadata.whatsappJourney.intentNotifications.${intent}.eventKey`]: eventKey,
        [`metadata.whatsappJourney.intentNotifications.${intent}.claimedAt`]: new Date(),
      },
    },
    { new: true },
  ).lean();
}

export async function claimWhatsAppIntentNotification(
  phoneNumber: string,
  intent: ConversationIntent,
  eventKey: string,
) {
  return Boolean(await claimIntentNotification(phoneNumber, intent, eventKey));
}

export async function releaseWhatsAppIntentNotificationClaim(
  phoneNumber: string,
  intent: ConversationIntent,
  eventKey: string,
) {
  const record = await Notification.findOne({ phone: phoneNumber }).sort({ createdAt: -1 }).lean();
  if (!record?._id) return;

  await Notification.updateOne(
    {
      _id: record._id,
      [`metadata.whatsappJourney.intentNotifications.${intent}.eventKey`]: eventKey,
      [`metadata.whatsappJourney.intentNotifications.${intent}.sentAt`]: { $exists: false },
    },
    {
      $unset: {
        [`metadata.whatsappJourney.intentNotifications.${intent}`]: 1,
      },
    },
  );
}

export async function markWhatsAppIntentNotificationSent(
  phoneNumber: string,
  intent: ConversationIntent,
  eventKey: string,
) {
  const record = await Notification.findOne({ phone: phoneNumber }).sort({ createdAt: -1 }).lean();
  if (!record?._id) return;

  await Notification.updateOne(
    {
      _id: record._id,
      [`metadata.whatsappJourney.intentNotifications.${intent}.eventKey`]: eventKey,
    },
    {
      $set: {
        [`metadata.whatsappJourney.intentNotifications.${intent}.sentAt`]: new Date(),
        "metadata.whatsappJourney.lastIntent": intent,
        "metadata.whatsappJourney.intentNotifiedAt": new Date(),
        "metadata.whatsappJourney.intentNotificationEventKey": eventKey,
        "metadata.whatsappJourney.intentNotificationSentAt": new Date(),
      },
    },
  );
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

export async function hasProcessedIncomingMessage(
  phoneNumber: string,
  messageId?: string,
  intent?: ConversationIntent,
) {
  if (!messageId) return false;

  await connectMongo();
  const conversation = await conversations.findOne({
    phoneNumber,
    "history.messageId": messageId,
  }).lean();
  if (!conversation) return false;

  if (!intent) return true;

  const eventKey = `whatsapp:${intent}:${messageId}`;
  const record = await Notification.findOne({ phone: phoneNumber }).sort({ createdAt: -1 }).lean();
  const eventExists = Boolean(
    record?.leadLifecycle?.events?.some((event: any) => event.eventKey === eventKey),
  );
  const notificationSent = record?.metadata?.whatsappJourney?.intentNotificationEventKey === eventKey
    && Boolean(record?.metadata?.whatsappJourney?.intentNotificationSentAt);

  return eventExists && notificationSent;
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
  const intentEventKey = input.intent
    ? `whatsapp:${input.intent}:${input.messageId || input.phoneNumber}`
    : '';
  const existingRecord = input.intent
    ? await Notification.findOne({ phone: input.phoneNumber }).sort({ createdAt: -1 }).lean()
    : null;
  const intentEventExists = Boolean(
    intentEventKey
      && existingRecord?.leadLifecycle?.events?.some((event: any) => event.eventKey === intentEventKey),
  );
  const intentAlreadyNotified = Boolean(
    intentEventKey
      && existingRecord?.metadata?.whatsappJourney?.intentNotificationEventKey === intentEventKey
      && existingRecord?.metadata?.whatsappJourney?.intentNotificationSentAt,
  );
  const intentWasNew = input.intent
    ? !intentAlreadyNotified
    : Boolean(intentField && !existing?.[intentField]);
  const shouldAppendIntentEvent = Boolean(input.intent && !intentEventExists);
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

  if (shouldAppendIntentEvent && input.intent) {
    await appendCanonicalWhatsAppIntent(input.phoneNumber, input.intent, input.messageId);
  }

  return {
    conversation,
    intentWasNew,
    intentEventKey,
    intentNotificationSent: intentAlreadyNotified,
  };
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
