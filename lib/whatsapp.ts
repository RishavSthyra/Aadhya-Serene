type TemplateMessageInput = {
  to: string;
  name: string;
  projectName: string;
};

const GRAPH_API_VERSION = "v25.0";

type WhatsAppApiErrorPayload = {
  error?: {
    message?: string;
    code?: number;
    type?: string;
    error_data?: {
      details?: string;
      messaging_product?: string;
    };
    fbtrace_id?: string;
  };
};

export class WhatsAppRequestError extends Error {
  code?: number;
  details?: string;
  type?: string;
  status: number;

  constructor({
    message,
    code,
    details,
    type,
    status,
  }: {
    message: string;
    code?: number;
    details?: string;
    type?: string;
    status: number;
  }) {
    super(message);
    this.name = "WhatsAppRequestError";
    this.code = code;
    this.details = details;
    this.type = type;
    this.status = status;
  }
}

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

function getFriendlyWhatsAppErrorMessage(payload: WhatsAppApiErrorPayload) {
  const error = payload.error;
  const details = error?.error_data?.details?.toLowerCase() || "";

  if (error?.code === 132001) {
    if (details.includes("does not exist in en_us")) {
      return "WhatsApp is not configured correctly right now. The selected template is not available in en_US.";
    }

    if (details.includes("does not exist in en")) {
      return "WhatsApp is not configured correctly right now. The selected template is not available in en.";
    }

    return "WhatsApp is not configured correctly right now. The selected message template or language does not match Meta.";
  }

  if (error?.code === 131058) {
    return "The current WhatsApp test template only works with Meta public test numbers. Please switch to an approved production template.";
  }

  if (error?.code === 190) {
    return "WhatsApp authentication failed. Please refresh the WhatsApp access token in production.";
  }

  return "We could not start the WhatsApp conversation right now. Please try again shortly.";
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

  const data = (await response.json()) as WhatsAppApiErrorPayload;

  if (!response.ok) {
    console.error("WhatsApp API error:", JSON.stringify(data, null, 2));

    throw new WhatsAppRequestError({
      message: getFriendlyWhatsAppErrorMessage(data),
      code: data.error?.code,
      details: data.error?.error_data?.details || data.error?.message,
      type: data.error?.type,
      status: response.status,
    });
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
