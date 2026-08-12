import { NextResponse } from "next/server";
import { sendGlobalTemplateMessage, WhatsAppRequestError } from "@/lib/whatsapp";
import {
  recordConversationOutboundMessage,
  startWhatsAppConversation,
} from "@/lib/whatsapp-conversation";
import {
  createEnquiryRecord,
  findRecentEnquiryRecord,
  getRequestMetadataFromHeaders,
  sendEnquiryNotificationEmail,
  updateEnquiryRecord,
} from "@/lib/enquiry-service";
import {
  getWhatsAppTemplateStatusCopy,
  shouldBlockWhatsAppRetry,
} from "@/lib/whatsapp-delivery";
import {
  createValidationErrorResponse,
  whatsAppApiSchema,
} from "@/lib/validation/enquiry";

export const runtime = "nodejs";

const DUPLICATE_WINDOW_MINUTES = 10;

function submissionWindowKey(now = new Date()) {
  return String(Math.floor(now.getTime() / (DUPLICATE_WINDOW_MINUTES * 60 * 1000)));
}

function isDuplicateKeyError(error: unknown) {
  return Boolean(error && typeof error === "object" && "code" in error && (error as { code?: number }).code === 11000);
}

export async function POST(req: Request) {
  let enquiryRecordId: string | undefined;

  try {
    const body = await req.json();
    const parseResult = whatsAppApiSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          ...createValidationErrorResponse(parseResult.error),
        },
        { status: 400 }
      );
    }

    const payload = parseResult.data;
    const name = payload.name;
    const projectName = String(
      payload.projectName || process.env.PROJECT_NAME || "Abhigna Constructions"
    ).trim();
    const source = String(payload.source || "ready_to_move_whatsapp_form").trim();
    const requestMetadata = getRequestMetadataFromHeaders(req.headers);
    const phone = payload.phone;

    const recentRecord = await findRecentEnquiryRecord({
      phone,
      source,
      channel: "whatsapp_form",
      minutes: DUPLICATE_WINDOW_MINUTES,
    });
    const shouldBlockRetry = shouldBlockWhatsAppRetry(
      recentRecord?.whatsappDelivery?.status
    );

    if (recentRecord && shouldBlockRetry) {
      return NextResponse.json({
        success: true,
        duplicate: true,
        message: "A WhatsApp message was already delivered to this number recently.",
        phone,
      });
    }

    let enquiryRecord;
    try {
      enquiryRecord = await createEnquiryRecord({
        projectName: "Aadhya Serene",
        source,
        submissionWindow: shouldBlockRetry ? submissionWindowKey() : "",
        channel: "whatsapp_form",
        name,
        phone,
        requestType: "whatsapp_flow",
        requestLabel: "WhatsApp Flow Start",
        message: "Lead started from the WhatsApp enquiry form.",
        emailDelivery: { status: "pending" },
        whatsappDelivery: { status: "pending" },
        metadata: {
          businessName: projectName,
          requestContext: requestMetadata,
        },
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        const duplicateRecord = await findRecentEnquiryRecord({
          phone,
          source,
          channel: "whatsapp_form",
          minutes: DUPLICATE_WINDOW_MINUTES,
        });

        if (shouldBlockWhatsAppRetry(duplicateRecord?.whatsappDelivery?.status)) {
          return NextResponse.json({
            success: true,
            duplicate: true,
            message: "A WhatsApp message was already delivered to this number recently.",
            phone,
          });
        }

        return NextResponse.json({
          success: false,
          error: "We could not retry the WhatsApp flow right now. Please try again once more.",
        });
      }
      throw error;
    }

    enquiryRecordId = String(enquiryRecord._id);

    await sendEnquiryNotificationEmail({
      projectName: "Aadhya Serene",
      source,
      channel: "whatsapp_form",
      name,
      phone,
      requestType: "whatsapp_flow",
      requestLabel: "WhatsApp Flow Start",
      message: "Lead started from the WhatsApp enquiry form.",
    });

    await updateEnquiryRecord(enquiryRecordId, {
      $set: {
        emailDelivery: {
          status: "sent",
          sentAt: new Date(),
          error: "",
        },
      },
    });

    await startWhatsAppConversation({
      phoneNumber: phone,
      name,
      projectName,
      source,
      enquiryRecordId,
    });

    const result = await sendGlobalTemplateMessage({
      to: phone,
      name,
    });
    const messageId = result?.messages?.[0]?.id || "";
    const templateStatus = getWhatsAppTemplateStatusCopy("accepted");

    await recordConversationOutboundMessage(
      phone,
      "template",
      templateStatus.detail
    ).catch((historyError) => {
      console.error("Unable to record ready-to-move WhatsApp template history:", historyError);
    });

    await updateEnquiryRecord(enquiryRecordId, {
      $set: {
        whatsappDelivery: {
          status: "accepted",
          metaStatus: "",
          metaStatusAt: undefined,
          metaRecipientId: "",
          metaErrorCode: 0,
          sentAt: new Date(),
          error: "",
          messageId,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "WhatsApp flow started",
      phone,
      result,
    });
  } catch (error) {
    console.error("Start WhatsApp flow error:", error);

    if (enquiryRecordId) {
      const failedField =
        error instanceof WhatsAppRequestError ? "whatsappDelivery" : "emailDelivery";

      await updateEnquiryRecord(enquiryRecordId, {
        $set: {
          [failedField]: {
            status: "failed",
            metaStatus: "",
            metaStatusAt: undefined,
            metaRecipientId: "",
            metaErrorCode:
              failedField === "whatsappDelivery" && typeof (error as WhatsAppRequestError).code === "number"
                ? (error as WhatsAppRequestError).code || 0
                : 0,
            error: error instanceof Error ? error.message : String(error),
          },
        },
      }).catch((updateError) => {
        console.error("Failed to update WhatsApp enquiry delivery state:", updateError);
      });
    }

    if (error instanceof WhatsAppRequestError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: error.code,
          details:
            process.env.NODE_ENV === "production" ? undefined : error.details,
        },
        { status: error.status || 502 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "We could not start the WhatsApp conversation right now. Please try again shortly.",
        details:
          process.env.NODE_ENV === "production"
            ? undefined
            : error instanceof Error
              ? error.message
              : String(error),
      },
      { status: 500 }
    );
  }
}
