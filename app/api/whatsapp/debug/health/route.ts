import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getEnvValue(name: string) {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

function maskSecret(value: string) {
  if (!value) {
    return null;
  }

  if (value.length <= 6) {
    return "*".repeat(value.length);
  }

  return `${value.slice(0, 3)}${"*".repeat(Math.max(value.length - 6, 1))}${value.slice(-3)}`;
}

export async function GET() {
  const accessToken = getEnvValue("WHATSAPP_ACCESS_TOKEN");
  const phoneNumberId = getEnvValue("WHATSAPP_PHONE_NUMBER_ID");
  const verifyToken = getEnvValue("WHATSAPP_VERIFY_TOKEN");
  const templateName = getEnvValue("WHATSAPP_TEMPLATE_NAME");
  const templateLang = getEnvValue("WHATSAPP_TEMPLATE_LANG");
  const mongoUri =
    getEnvValue("MONGODB_URI") ||
    getEnvValue("MONGO_DB_CONNECTION_STRING") ||
    getEnvValue("MONGO_DB_CONNECTIO_STRING");
  const emailUser = getEnvValue("EMAIL_USER");
  const emailPassword = getEnvValue("GOOGLE_APP_PASSWORD");

  const ok = Boolean(
    accessToken && phoneNumberId && verifyToken && templateName
  );

  return NextResponse.json(
    {
      ok,
      env: {
        hasAccessToken: Boolean(accessToken),
        phoneNumberId: phoneNumberId || null,
        hasVerifyToken: Boolean(verifyToken),
        verifyTokenPreview: maskSecret(verifyToken),
        templateName: templateName || null,
        templateLang: templateLang || null,
        hasMongoUri: Boolean(mongoUri),
        hasEmailUser: Boolean(emailUser),
        hasGoogleAppPassword: Boolean(emailPassword),
      },
    },
    {
      status: ok ? 200 : 500,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
