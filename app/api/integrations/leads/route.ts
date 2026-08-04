import { NextResponse } from "next/server";
import { z } from "zod";

import {
  authorizePortalLeadRequest,
  processPortalLead,
  type PortalLead,
} from "@/lib/portal-lead-service";
import { normalizeIndianPhoneNumber } from "@/lib/validation/enquiry";

export const runtime = "nodejs";

const externalLeadSchema = z.object({
  leadId: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(120),
  phone: z.string().trim().transform(normalizeIndianPhoneNumber),
  source: z.string().trim().min(1).max(80).optional(),
  email: z.string().trim().email().max(120).optional().or(z.literal("")),
  projectName: z.string().trim().min(1).max(120).optional(),
  enquiryType: z.string().trim().min(1).max(80).optional(),
  preferredTime: z.string().trim().max(120).optional(),
  message: z.string().trim().max(1000).optional(),
  submittedAt: z.string().datetime().optional(),
  whatsappConsent: z.literal(true, {
    error: "WhatsApp consent must be explicitly recorded as true.",
  }),
});

export async function POST(request: Request) {
  if (!authorizePortalLeadRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = externalLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid lead payload.", fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const result = await processPortalLead(parsed.data as PortalLead);
    return NextResponse.json(
      {
        accepted: true,
        duplicate: result.duplicate,
        leadId: parsed.data.leadId,
        whatsapp: result.whatsappSent ? "sent" : "failed",
        salesEmail: result.salesEmailSent ? "sent" : "failed",
      },
      { status: result.duplicate ? 200 : 201 },
    );
  } catch (error) {
    console.error("Unable to process external lead:", error);
    return NextResponse.json(
      { error: "Unable to process the lead. Please retry this request." },
      { status: 503 },
    );
  }
}
