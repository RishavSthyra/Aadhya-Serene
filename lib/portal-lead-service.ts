import { timingSafeEqual } from "node:crypto";

import {
  createEnquiryRecord,
  findLatestEnquiryRecord,
  getRequestLabel,
  sendEnquiryNotificationEmail,
  updateEnquiryRecord,
} from "@/lib/enquiry-service";
import { sendGlobalTemplateMessage } from "@/lib/whatsapp";
import {
  recordConversationOutboundMessage,
  startWhatsAppConversation,
} from "@/lib/whatsapp-conversation";

export type PortalLead = {
  leadId: string;
  name: string;
  phone: string;
  source?: string;
  email?: string;
  projectName?: string;
  enquiryType?: string;
  preferredTime?: string;
  message?: string;
  submittedAt?: string;
  whatsappConsent: true;
};

export function authorizePortalLeadRequest(request: Request) {
  const expected = process.env.EXTERNAL_LEAD_API_KEY?.trim();
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!expected || !supplied) return false;

  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(supplied);
  return (
    expectedBuffer.length === suppliedBuffer.length &&
    timingSafeEqual(expectedBuffer, suppliedBuffer)
  );
}

function normalizeLeadSource(source?: string) {
  const normalized = source?.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "_");
  return normalized || "external_partner";
}

function isDuplicateKeyError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000);
}

export async function findPortalLead(source: string, leadId: string) {
  return findLatestEnquiryRecord({
    "metadata.externalLead.provider": source,
    "metadata.externalLead.leadId": leadId,
  });
}

/**
 * Persists a property-portal lead and starts the same global WhatsApp flow as
 * the Ready-to-Move form. A duplicate portal lead returns the original record
 * and never sends the template again.
 */
export async function processPortalLead(lead: PortalLead) {
  const source = normalizeLeadSource(lead.source);
  const existing = await findPortalLead(source, lead.leadId);
  if (existing) {
    return {
      record: existing,
      duplicate: true,
      whatsappSent: existing.whatsappDelivery?.status === "sent",
      salesEmailSent: existing.emailDelivery?.status === "sent",
    };
  }

  const requestType = lead.enquiryType || "register_interest";
  const requestLabel = getRequestLabel(requestType);
  let record;

  try {
    record = await createEnquiryRecord({
      projectName: lead.projectName || "Aadhya Serene",
      source,
      channel: "portal_lead",
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      requestType,
      requestLabel,
      preferredTime: lead.preferredTime,
      message: lead.message,
      emailDelivery: { status: "pending" },
      whatsappDelivery: { status: "pending" },
      metadata: {
        externalLead: {
          provider: source,
          leadId: lead.leadId,
          submittedAt: lead.submittedAt || "",
          whatsappConsent: true,
        },
      },
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const duplicate = await findPortalLead(source, lead.leadId);
      if (duplicate) {
        return {
          record: duplicate,
          duplicate: true,
          whatsappSent: duplicate.whatsappDelivery?.status === "sent",
          salesEmailSent: duplicate.emailDelivery?.status === "sent",
        };
      }
    }
    throw error;
  }

  const recordId = String(record._id);

  let salesEmailSent = false;
  try {
    await sendEnquiryNotificationEmail({
      projectName: lead.projectName || "Aadhya Serene",
      source,
      channel: "portal_lead",
      name: lead.name,
      phone: lead.phone,
      email: lead.email,
      requestType,
      requestLabel,
      preferredTime: lead.preferredTime,
      message: lead.message,
    });
    await updateEnquiryRecord(recordId, {
      $set: { emailDelivery: { status: "sent", sentAt: new Date(), error: "" } },
    });
    salesEmailSent = true;
  } catch (error) {
    await updateEnquiryRecord(recordId, {
      $set: { emailDelivery: { status: "failed", error: error instanceof Error ? error.message : String(error) } },
    });
    // The portal has already supplied a valid lead. Do not suppress the
    // customer's WhatsApp template just because email delivery is temporary.
    console.error("Property portal sales-email delivery failed:", error);
  }

  try {
    await startWhatsAppConversation({
      phoneNumber: lead.phone,
      name: lead.name || "Customer",
      projectName: lead.projectName || "Aadhya Serene",
      source,
      enquiryRecordId: recordId,
    });
    const result = await sendGlobalTemplateMessage({ to: lead.phone, name: lead.name || "Customer" });
    await recordConversationOutboundMessage(lead.phone, "template", "Global WhatsApp template sent from property portal.");
    await updateEnquiryRecord(recordId, {
      $set: {
        whatsappDelivery: {
          status: "sent",
          sentAt: new Date(),
          error: "",
          messageId: result?.messages?.[0]?.id || "",
        },
      },
    });
    return { record, duplicate: false, whatsappSent: true, salesEmailSent };
  } catch (error) {
    await updateEnquiryRecord(recordId, {
      $set: {
        whatsappDelivery: {
          status: "failed",
          error: error instanceof Error ? error.message : String(error),
        },
      },
    });
    console.error("Property portal WhatsApp delivery failed:", error);
    return { record, duplicate: false, whatsappSent: false, salesEmailSent };
  }
}
