export const CHATBOT_BUTTONS = {
  explore_project: {
    id: "explore_project",
    label: "Explore Project",
    aliases: ["Explore Project"],
  },
  pricing: {
    id: "pricing",
    label: "Pricing",
    aliases: ["Pricing", "Pricing and availability"],
  },
  talk_to_sales: {
    id: "talk_to_sales",
    label: "Talk to Sales",
    aliases: ["Talk to Sales", "Talk to sales team"],
  },
  brochure: {
    id: "brochure",
    label: "Brochure",
    aliases: ["Brochure", "Project brochure"],
  },
  virtual_tour: {
    id: "virtual_tour",
    label: "Virtual Tour",
    aliases: ["Virtual Tour", "App Link", "App link"],
  },
  amenities: {
    id: "amenities",
    label: "Amenities",
    aliases: ["Amenities"],
  },
  location: {
    id: "location",
    label: "Location",
    aliases: ["Location"],
  },
  floor_plans: {
    id: "floor_plans",
    label: "Floor Plans",
    aliases: ["Floor Plans", "Floor plans"],
  },
  book_site_visit: {
    id: "book_site_visit",
    label: "Book Site Visit",
    aliases: ["Book Site Visit", "Site Visit", "Book a site visit"],
  },
  request_callback: {
    id: "request_callback",
    label: "Request Callback",
    aliases: ["Request Callback", "Callback", "Request callback"],
  },
  pricing_2bhk: {
    id: "pricing_2bhk",
    label: "2 BHK",
    aliases: ["2 BHK"],
  },
  pricing_3bhk: {
    id: "pricing_3bhk",
    label: "3 BHK",
    aliases: ["3 BHK"],
  },
  site_visit_yes: {
    id: "site_visit_yes",
    label: "Yes",
    aliases: ["Yes"],
  },
  site_visit_not_now: {
    id: "site_visit_not_now",
    label: "Not Now",
    aliases: ["Not Now", "No"],
  },
} as const;

export type ChatbotButtonId = keyof typeof CHATBOT_BUTTONS;

export type ChatbotMessageKey =
  | "main_menu"
  | "project_menu"
  | "amenities_menu"
  | "pricing_menu"
  | "site_visit_prompt"
  | "sales_menu"
  | "brochure"
  | "virtual_tour"
  | "location"
  | "floor_plans"
  | "site_visit_confirmed"
  | "callback_confirmed"
  | "site_visit_not_now"
  | "pricing_2bhk"
  | "pricing_3bhk";

export type ChatbotAction =
  | { type: "interactive"; message: ChatbotMessageKey }
  | { type: "text"; message: ChatbotMessageKey }
  | { type: "brochure"; message: ChatbotMessageKey }
  | { type: "intent"; intent: "site_visit" | "callback" };

export type ChatbotTransition = {
  nextState: string;
  actions: ChatbotAction[];
};

export const chatbotFlow: Record<ChatbotButtonId, ChatbotTransition> = {
  explore_project: {
    nextState: "EXPLORE_PROJECT",
    actions: [{ type: "interactive", message: "project_menu" }],
  },
  brochure: {
    nextState: "EXPLORE_PROJECT",
    actions: [{ type: "brochure", message: "brochure" }],
  },
  virtual_tour: {
    nextState: "EXPLORE_PROJECT",
    actions: [{ type: "text", message: "virtual_tour" }],
  },
  amenities: {
    nextState: "AMENITIES",
    actions: [{ type: "interactive", message: "amenities_menu" }],
  },
  location: {
    nextState: "AMENITIES",
    actions: [{ type: "text", message: "location" }],
  },
  floor_plans: {
    nextState: "AMENITIES",
    actions: [{ type: "brochure", message: "floor_plans" }],
  },
  book_site_visit: {
    nextState: "SITE_VISIT_REQUESTED",
    actions: [
      { type: "intent", intent: "site_visit" },
      { type: "text", message: "site_visit_confirmed" },
    ],
  },
  pricing: {
    nextState: "PRICING",
    actions: [{ type: "interactive", message: "pricing_menu" }],
  },
  pricing_2bhk: {
    nextState: "AWAITING_SITE_VISIT_DECISION",
    actions: [
      { type: "text", message: "pricing_2bhk" },
      { type: "interactive", message: "site_visit_prompt" },
    ],
  },
  pricing_3bhk: {
    nextState: "AWAITING_SITE_VISIT_DECISION",
    actions: [
      { type: "text", message: "pricing_3bhk" },
      { type: "interactive", message: "site_visit_prompt" },
    ],
  },
  site_visit_yes: {
    nextState: "SITE_VISIT_REQUESTED",
    actions: [
      { type: "intent", intent: "site_visit" },
      { type: "text", message: "site_visit_confirmed" },
    ],
  },
  site_visit_not_now: {
    nextState: "COMPLETED",
    actions: [{ type: "text", message: "site_visit_not_now" }],
  },
  talk_to_sales: {
    nextState: "SALES",
    actions: [{ type: "interactive", message: "sales_menu" }],
  },
  request_callback: {
    nextState: "CALLBACK_REQUESTED",
    actions: [
      { type: "intent", intent: "callback" },
      { type: "text", message: "callback_confirmed" },
    ],
  },
};

type InteractiveMessage = {
  header?: string;
  body: string;
  footer?: string;
  buttons: readonly ChatbotButtonId[];
};

export function getChatbotInteractiveMessage(
  key: Extract<ChatbotMessageKey, "main_menu" | "project_menu" | "amenities_menu" | "pricing_menu" | "site_visit_prompt" | "sales_menu">
): InteractiveMessage {
  const messages = {
    main_menu: {
      header: "Aadhya Serene",
      body: "Choose an option below to continue.",
      footer: "Aadhya Serene • Bengaluru",
      buttons: ["explore_project", "pricing", "talk_to_sales"],
    },
    project_menu: {
      header: "🏡 Aadhya Serene",
      body: "Discover everything about Aadhya Serene.\n\nChoose one of the options below.",
      buttons: ["brochure", "virtual_tour", "amenities"],
    },
    amenities_menu: {
      body: "Choose what you'd like next.",
      buttons: ["location", "floor_plans", "book_site_visit"],
    },
    pricing_menu: {
      body: "Choose the configuration you are interested in.",
      buttons: ["pricing_2bhk", "pricing_3bhk"],
    },
    site_visit_prompt: {
      body: "Would you like to book a site visit?",
      buttons: ["site_visit_yes", "site_visit_not_now"],
    },
    sales_menu: {
      body: "Our sales consultant will contact you shortly. What would you like to do?",
      buttons: ["request_callback", "book_site_visit"],
    },
  } as const;

  return messages[key];
}

function envValue(name: string, fallback: string) {
  return process.env[name]?.trim() || fallback;
}

export function getChatbotTextMessage(key: Exclude<ChatbotMessageKey, "main_menu" | "project_menu" | "amenities_menu" | "pricing_menu" | "site_visit_prompt" | "sales_menu">) {
  const brochureUrl = envValue("BROCHURE_URL", "");
  const appLink = envValue("APP_LINK", "");
  const locationUrl = envValue(
    "WHATSAPP_LOCATION_URL",
    "https://www.google.com/maps/search/?api=1&query=Aadhya+Serene+Thanisandra+Bengaluru"
  );

  const messages = {
    brochure: "Here is our latest project brochure.",
    virtual_tour: `Experience Aadhya Serene virtually.\n\n${appLink}`,
    location: `Here is the Aadhya Serene location.\n\n${locationUrl}`,
    floor_plans: `Floor plans are available in our brochure.\n\n${brochureUrl}`,
    site_visit_confirmed:
      "Great! Our sales team will contact you shortly to schedule your personalized site visit.",
    callback_confirmed: "Our sales consultant will contact you shortly.",
    site_visit_not_now: "No problem. You can request a site visit whenever you are ready.",
    pricing_2bhk: envValue(
      "WHATSAPP_PRICING_2BHK",
      "Thank you for your interest in our 2 BHK homes. Our sales team will share the latest pricing and availability shortly."
    ),
    pricing_3bhk: envValue(
      "WHATSAPP_PRICING_3BHK",
      "Thank you for your interest in our 3 BHK homes. Our sales team will share the latest pricing and availability shortly."
    ),
  } as const;

  return messages[key];
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

export function resolveChatbotButtonId(candidates: Array<string | undefined | null>): ChatbotButtonId | null {
  for (const candidate of candidates) {
    if (!candidate) continue;

    const normalizedCandidate = normalize(candidate);

    for (const [buttonId, button] of Object.entries(CHATBOT_BUTTONS)) {
      if (
        normalizedCandidate === buttonId ||
        button.aliases.some((alias) => normalize(alias) === normalizedCandidate)
      ) {
        return buttonId as ChatbotButtonId;
      }
    }
  }

  return null;
}

export function getChatbotButton(buttonId: ChatbotButtonId) {
  return CHATBOT_BUTTONS[buttonId];
}
