import { NextResponse } from "next/server";
import { sendTemplateMessage, WhatsAppRequestError } from "@/lib/whatsapp";
import { upsertLeadState } from "@/lib/lead-store";
import {
  createEnquiryRecord,
  getRequestMetadataFromHeaders,
  sendEnquiryNotificationEmail,
  updateEnquiryRecord,
} from "@/lib/enquiry-service";
import {
  createValidationErrorResponse,
  whatsAppApiSchema,
} from "@/lib/validation/enquiry";

export const runtime = "nodejs";

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

    upsertLeadState(phone, {
      name,
      projectName,
      step: "STARTED",
    });

    const enquiryRecord = await createEnquiryRecord({
      projectName: "Aadhya Serene",
      source,
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

    enquiryRecordId = String(enquiryRecord._id);
    upsertLeadState(phone, {
      enquiryRecordId,
    });

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

    const result = await sendTemplateMessage({
      to: phone,
      name,
      projectName,
    });

    await updateEnquiryRecord(enquiryRecordId, {
      $set: {
        whatsappDelivery: {
          status: "sent",
          sentAt: new Date(),
          error: "",
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
