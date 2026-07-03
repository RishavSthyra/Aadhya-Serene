import { NextResponse } from "next/server";
import { getLeadState, upsertLeadState } from "@/lib/lead-store";
import { sendTextMessage } from "@/lib/whatsapp";
import {
  findLatestEnquiryRecord,
  updateEnquiryRecord,
} from "@/lib/enquiry-service";

export const runtime = "nodejs";

function getIncomingMessageText(message: any): string {
  if (message?.type === "text") {
    return message.text?.body || "";
  }

  if (message?.type === "button") {
    return message.button?.text || message.button?.payload || "";
  }

  if (message?.type === "interactive") {
    return (
      message.interactive?.button_reply?.title ||
      message.interactive?.button_reply?.id ||
      message.interactive?.list_reply?.title ||
      message.interactive?.list_reply?.id ||
      ""
    );
  }

  return "";
}

function cleanText(value: string): string {
  return value.trim().toLowerCase();
}

function parseMainOption(text: string) {
  const value = cleanText(text);

  if (value === "1" || value.includes("brochure")) {
    return "BROCHURE";
  }

  if (value === "2" || value.includes("pricing") || value.includes("price")) {
    return "PRICING";
  }

  if (value === "3" || value.includes("site visit") || value.includes("visit")) {
    return "SITE_VISIT";
  }

  if (value === "4" || value.includes("app link") || value === "app") {
    return "APP_LINK";
  }

  if (value === "5" || value.includes("sales") || value.includes("call")) {
    return "SALES";
  }

  return null;
}

function parseUnitType(text: string) {
  const value = cleanText(text);

  if (value === "1" || value.includes("2 bhk")) {
    return "2 BHK";
  }

  if (value === "2" || value.includes("3 bhk")) {
    return "3 BHK";
  }

  if (value === "3" || value.includes("plot") || value.includes("villa")) {
    return "Plot / Villa";
  }

  if (value === "4" || value.includes("not sure")) {
    return "Not sure yet";
  }

  return text.trim();
}

function parseBudget(text: string) {
  const value = cleanText(text);

  if (value === "1") {
    return "Below Rs 50L";
  }

  if (value === "2") {
    return "Rs 50L - Rs 75L";
  }

  if (value === "3") {
    return "Rs 75L - Rs 1Cr";
  }

  if (value === "4") {
    return "Above Rs 1Cr";
  }

  return text.trim();
}

async function sendMainMenu(to: string) {
  await sendTextMessage(
    to,
    `Please choose one option:

1. Project brochure
2. Pricing and availability
3. Book a site visit
4. App link
5. Talk to sales team`
  );
}

function buildWhatsAppLeadSummary(state: ReturnType<typeof getLeadState>) {
  if (!state) {
    return "WhatsApp lead started.";
  }

  const parts = [
    state.selectedOption ? `Intent: ${state.selectedOption}` : "",
    state.unitType ? `Unit Type: ${state.unitType}` : "",
    state.budget ? `Budget: ${state.budget}` : "",
    state.visitTime ? `Visit Time: ${state.visitTime}` : "",
    state.callTime ? `Call Time: ${state.callTime}` : "",
  ].filter(Boolean);

  return parts.length
    ? `WhatsApp journey update. ${parts.join(" | ")}`
    : "WhatsApp lead started.";
}

async function syncLeadStateToRecord(
  phone: string,
  incomingText: string,
  stateOverride?: ReturnType<typeof getLeadState>
) {
  const state = stateOverride || getLeadState(phone);

  if (!state) {
    return;
  }

  let recordId = state.enquiryRecordId;

  if (!recordId) {
    const latestRecord = await findLatestEnquiryRecord({
      phone,
      channel: "whatsapp_form",
    });

    if (!latestRecord?._id) {
      return;
    }

    recordId = String(latestRecord._id);
    upsertLeadState(phone, { enquiryRecordId: recordId });
  }

  await updateEnquiryRecord(recordId, {
    $set: {
      preferredTime: state.visitTime || state.callTime || "",
      message: buildWhatsAppLeadSummary(state),
      "metadata.whatsappJourney.step": state.step,
      "metadata.whatsappJourney.selectedOption": state.selectedOption || "",
      "metadata.whatsappJourney.unitType": state.unitType || "",
      "metadata.whatsappJourney.budget": state.budget || "",
      "metadata.whatsappJourney.visitTime": state.visitTime || "",
      "metadata.whatsappJourney.callTime": state.callTime || "",
      "metadata.whatsappJourney.lastIncomingText": incomingText,
      "metadata.whatsappJourney.updatedAt": new Date(),
    },
  });
}

async function handleIncomingMessage(from: string, incomingText: string) {
  const text = incomingText.trim();

  if (!text) {
    console.log("WhatsApp webhook: received empty inbound text", { from });
    return;
  }

  console.log("WhatsApp webhook: processing inbound message", {
    from,
    text,
  });

  let state = getLeadState(from);

  if (!state) {
    state = upsertLeadState(from, {
      step: "STARTED",
      projectName: process.env.PROJECT_NAME || "Abhigna Constructions",
    });
  }

  const brochureUrl =
    process.env.BROCHURE_URL || "https://cdn.sthyra.com/AADHYA%20SERENE/Aadhya%20Serene%20BROCHURE%20FOR%20PRINTING.pdf";

  const appLink = process.env.APP_LINK || "https://abhignaconstructions.com/";

  const projectName =
    state.projectName || process.env.PROJECT_NAME || "Abhigna Constructions";

  if (state.step === "ASKED_UNIT_TYPE") {
    const unitType = parseUnitType(text);

    const updated = upsertLeadState(from, {
      unitType,
      step: "ASKED_BUDGET",
    });
    await syncLeadStateToRecord(from, text, updated);

    await sendTextMessage(
      from,
      `Great. What is your approximate budget?

1. Below Rs 50L
2. Rs 50L - Rs 75L
3. Rs 75L - Rs 1Cr
4. Above Rs 1Cr`
    );

    return;
  }

  if (state.step === "ASKED_BUDGET") {
    const budget = parseBudget(text);

    const updated = upsertLeadState(from, {
      budget,
      step: "COMPLETED",
    });
    await syncLeadStateToRecord(from, text, updated);

    await sendTextMessage(
      from,
      `Thank you. Our team has received your details.

Project: ${projectName}
Interest: ${updated.unitType || "Not specified"}
Budget: ${updated.budget || "Not specified"}

Here is the brochure:
${brochureUrl}

Would you like to book a site visit?
Reply with: Site Visit`
    );

    return;
  }

  if (state.step === "ASKED_VISIT_TIME") {
    const visitTime = text;

    const updated = upsertLeadState(from, {
      visitTime,
      step: "COMPLETED",
    });
    await syncLeadStateToRecord(from, text, updated);

    await sendTextMessage(
      from,
      `Thank you. We received your preferred site visit time:

${visitTime}

Our team will confirm the visit shortly.`
    );

    return;
  }

  if (state.step === "ASKED_CALL_TIME") {
    const callTime = text;

    const updated = upsertLeadState(from, {
      callTime,
      step: "COMPLETED",
    });
    await syncLeadStateToRecord(from, text, updated);

    await sendTextMessage(
      from,
      `Thank you. Our sales team will contact you around:

${callTime}

You can also view the project here:
${appLink}`
    );

    return;
  }

  const option = parseMainOption(text);

  console.log("WhatsApp webhook: parsed main option", {
    from,
    text,
    option,
    currentStep: state.step,
  });

  if (option === "BROCHURE") {
    const updated = upsertLeadState(from, {
      selectedOption: "Project Brochure",
      step: "STARTED",
    });
    await syncLeadStateToRecord(from, text, updated);

    await sendTextMessage(
      from,
      `Sure. Here is the ${projectName} brochure:

${brochureUrl}

Would you also like pricing details or a site visit?

Reply with:
Pricing
Site Visit`
    );

    return;
  }

  if (option === "PRICING") {
    const updated = upsertLeadState(from, {
      selectedOption: "Pricing",
      step: "ASKED_UNIT_TYPE",
    });
    await syncLeadStateToRecord(from, text, updated);

    await sendTextMessage(
      from,
      `Sure. Which type are you interested in?

1. 2 BHK
2. 3 BHK
3. Plot / Villa
4. Not sure yet`
    );

    return;
  }

  if (option === "SITE_VISIT") {
    const updated = upsertLeadState(from, {
      selectedOption: "Book Site Visit",
      step: "ASKED_VISIT_TIME",
    });
    await syncLeadStateToRecord(from, text, updated);

    await sendTextMessage(
      from,
      `Great. Please share your preferred date and time for a site visit.

Example:
Tomorrow 11 AM`
    );

    return;
  }

  if (option === "APP_LINK") {
    const updated = upsertLeadState(from, {
      selectedOption: "App Link",
      step: "STARTED",
    });
    await syncLeadStateToRecord(from, text, updated);

    await sendTextMessage(
      from,
      `You can explore ${projectName} here:

${appLink}

Would you like our sales team to call you?
Reply with: Talk to Sales`
    );

    return;
  }

  if (option === "SALES") {
    const updated = upsertLeadState(from, {
      selectedOption: "Talk to Sales",
      step: "ASKED_CALL_TIME",
    });
    await syncLeadStateToRecord(from, text, updated);

    await sendTextMessage(
      from,
      `Sure. Our sales team will contact you.

Please share your preferred call time.

Example:
Today 5 PM`
    );

    return;
  }

  await sendMainMenu(from);
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

    console.log("WhatsApp webhook: payload received", {
      entryCount: entries.length,
      object: body.object,
    });

    for (const entry of entries) {
      const changes = entry.changes || [];

      for (const change of changes) {
        const value = change.value;
        const messages = value?.messages || [];

        console.log("WhatsApp webhook: change received", {
          field: change.field,
          messageCount: messages.length,
          hasStatuses: Array.isArray(value?.statuses) ? value.statuses.length : 0,
          metadataPhoneNumberId: value?.metadata?.phone_number_id || null,
        });

        for (const message of messages) {
          const from = message.from;
          const text = getIncomingMessageText(message);

          console.log("WhatsApp webhook: inbound message snapshot", {
            from: from || null,
            type: message?.type || null,
            text: text || null,
          });

          if (from && text) {
            await handleIncomingMessage(from, text);
          }
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
