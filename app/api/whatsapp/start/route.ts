import { NextResponse } from "next/server";
import { normalizeIndianWhatsAppNumber } from "@/lib/phone";
import { sendTemplateMessage, WhatsAppRequestError } from "@/lib/whatsapp";
import { upsertLeadState } from "@/lib/lead-store";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body.name || "there").trim();
    const projectName = String(
      body.projectName || process.env.PROJECT_NAME || "Abhigna Constructions"
    ).trim();

    const phone = normalizeIndianWhatsAppNumber(String(body.phone || ""));

    upsertLeadState(phone, {
      name,
      projectName,
      step: "STARTED",
    });

    const result = await sendTemplateMessage({
      to: phone,
      name,
      projectName,
    });

    return NextResponse.json({
      success: true,
      message: "WhatsApp flow started",
      phone,
      result,
    });
  } catch (error) {
    console.error("Start WhatsApp flow error:", error);

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
