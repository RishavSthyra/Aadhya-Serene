type TemplateMessageInput = {
  to: string;
  name: string;
  projectName: string;
};

const GRAPH_API_VERSION = "v25.0";

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getWhatsAppEndpoint() {
  const phoneNumberId = requiredEnv("WHATSAPP_PHONE_NUMBER_ID");
  return `https://graph.facebook.com/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;
}

async function sendWhatsAppPayload(payload: Record<string, unknown>) {
  const accessToken = requiredEnv("WHATSAPP_ACCESS_TOKEN");

  const response = await fetch(getWhatsAppEndpoint(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("WhatsApp API error:", JSON.stringify(data, null, 2));
    throw new Error(JSON.stringify(data));
  }

  return data;
}

export async function sendTemplateMessage({
  to,
  name,
  projectName,
}: TemplateMessageInput) {
  const templateName = requiredEnv("WHATSAPP_TEMPLATE_NAME");
  const languageCode = process.env.WHATSAPP_TEMPLATE_LANG || "en";
  const template = {
    name: templateName,
    language: {
      code: languageCode,
    },
  } as {
    name: string;
    language: {
      code: string;
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text: string;
      }>;
    }>;
  };

  if (templateName === "enquiry_start_flow") {
    template.components = [
      {
        type: "body",
        parameters: [
          {
            type: "text",
            text: name || "there",
          },
          {
            type: "text",
            text: projectName || process.env.PROJECT_NAME || "Abhigna Constructions",
          },
        ],
      },
    ];
  }

  return sendWhatsAppPayload({
    messaging_product: "whatsapp",
    to,
    type: "template",
    template,
  });
}

export async function sendTextMessage(to: string, body: string) {
  return sendWhatsAppPayload({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      preview_url: true,
      body,
    },
  });
}
