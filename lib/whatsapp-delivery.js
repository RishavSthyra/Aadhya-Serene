const SUCCESS_STATUSES = new Set(["accepted", "sent", "delivered", "read"]);
const RETRY_BLOCKED_STATUSES = new Set(["delivered", "read"]);

export function isWhatsAppDeliverySuccessStatus(status) {
  return SUCCESS_STATUSES.has(String(status || "").trim().toLowerCase());
}

export function shouldBlockWhatsAppRetry(status) {
  return RETRY_BLOCKED_STATUSES.has(String(status || "").trim().toLowerCase());
}

export function getWhatsAppDeliveryStatusLabel(status) {
  switch (String(status || "").trim().toLowerCase()) {
    case "accepted":
      return "accepted by API";
    case "sent":
      return "sent by WhatsApp";
    case "delivered":
      return "delivered";
    case "read":
      return "read";
    case "failed":
      return "failed";
    case "not_requested":
      return "not requested";
    default:
      return "pending";
  }
}

const META_ERROR_CODE_COPY = {
  130472: {
    label: "experiment holdout",
    detail: "Meta says this phone number is currently excluded by an experiment.",
  },
  131026: {
    label: "message undeliverable",
    detail: "Meta could not deliver this message to the recipient's WhatsApp account.",
  },
  131049: {
    label: "engagement policy block",
    detail: "Meta blocked delivery to protect ecosystem engagement quality.",
  },
};

export function getWhatsAppMetaErrorCopy(code, fallbackError = "") {
  const numericCode = Number(code || 0);
  const known = META_ERROR_CODE_COPY[numericCode];

  if (known) {
    return {
      code: numericCode,
      label: known.label,
      detail: known.detail,
    };
  }

  return {
    code: numericCode,
    label: numericCode ? "meta delivery error" : "",
    detail: fallbackError || "Meta reported a delivery failure.",
  };
}

export function getWhatsAppTemplateStatusCopy(status, error) {
  switch (String(status || "").trim().toLowerCase()) {
    case "accepted":
      return {
        title: "WhatsApp template accepted by API",
        detail: "Meta accepted the welcome template request. Handset delivery is still pending.",
      };
    case "sent":
      return {
        title: "WhatsApp template sent by WhatsApp",
        detail: "WhatsApp marked the welcome template as sent. Delivery to the handset may still be pending.",
      };
    case "delivered":
      return {
        title: "WhatsApp template delivered",
        detail: "The welcome template was delivered to the customer's WhatsApp.",
      };
    case "read":
      return {
        title: "WhatsApp template read",
        detail: "The customer opened the welcome template in WhatsApp.",
      };
    case "failed":
      return {
        title: "WhatsApp template failed",
        detail: error || "WhatsApp could not deliver the welcome template.",
      };
    default:
      return {
        title: "WhatsApp template pending",
        detail: "WhatsApp delivery is still pending.",
      };
  }
}
