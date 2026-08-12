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
