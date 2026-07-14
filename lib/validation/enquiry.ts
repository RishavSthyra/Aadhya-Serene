import { z } from "zod";

export const REQUEST_TYPE_OPTIONS = [
  "register_interest",
  "book_unit",
  "site_visit",
  "brochure",
  "whatsapp_flow",
] as const;

export const RESIDENCE_TYPE_OPTIONS = [
  "2_bhk",
  "3_bhk",
  "both",
] as const;

export const LANDING_CONFIG_OPTIONS = ["2 BHK", "3 BHK"] as const;

export const LANDING_BUDGET_OPTIONS = [
  "99L - 1.4 Cr",
  "1.4 Cr +",
  "99L - 1.2 Cr",
  "1.2 Cr +",
] as const;

export const FORM_MESSAGE_MAX_LENGTH = 1000;
export const PREFERRED_TIME_MAX_LENGTH = 120;
export const SOURCE_MAX_LENGTH = 120;
export const PROJECT_NAME_MAX_LENGTH = 120;

const NAME_PATTERN = /^[\p{L}][\p{L}\p{M}\s.'-]{1,79}$/u;
const FIELD_ERROR_MESSAGE = "Please correct the highlighted fields.";
const EMAIL_REQUIRED_SOURCES = new Set([
  "contact_page",
  "ready_to_move_contact_page",
]);
const RESIDENCE_REQUIRED_SOURCES = new Set(["ready_to_move_contact_page"]);
const LANDING_SOURCE_SET = new Set([
  "ready_to_move_landing",
  "ready_to_move_popup_route",
]);

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function emptyStringToUndefined(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = collapseWhitespace(value);
  return trimmed ? trimmed : undefined;
}

export function sanitizePhoneInput(value: string) {
  return String(value || "").replace(/\D/g, "").slice(0, 12);
}

export function sanitizeNameInput(value: string) {
  return String(value || "").replace(/[^\p{L}\p{M}\s.'-]/gu, "").replace(/\s{2,}/g, " ");
}

export function sanitizeEmailInput(value: string) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

export function sanitizeSingleLineText(value: string) {
  return String(value || "").replace(/\s{2,}/g, " ");
}

export function sanitizeMessageInput(value: string) {
  return String(value || "").replace(/\r\n/g, "\n");
}

export function isValidIndianPhoneInput(value: string) {
  const digits = sanitizePhoneInput(value);

  return (
    digits.length === 10 ||
    (digits.length === 11 && digits.startsWith("0")) ||
    (digits.length === 12 && digits.startsWith("91"))
  );
}

export function normalizeIndianPhoneNumber(input: string) {
  const digits = sanitizePhoneInput(input);

  if (!digits) {
    throw new Error("Phone number is required");
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 11 && digits.startsWith("0")) {
    return `91${digits.slice(1)}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  throw new Error(
    "Invalid phone number. Use a 10-digit Indian number or 91XXXXXXXXXX."
  );
}

const nameFieldSchema = z
  .string({ error: "Full name is required." })
  .transform((value) => collapseWhitespace(value))
  .pipe(
    z
      .string()
      .min(2, "Enter your full name.")
      .max(80, "Full name must be 80 characters or fewer.")
      .refine((value) => NAME_PATTERN.test(value), {
        message: "Use letters, spaces, apostrophes, periods, or hyphens only.",
      })
  );

const phoneInputSchema = z
  .string({ error: "Phone number is required." })
  .transform((value) => sanitizePhoneInput(value))
  .pipe(
    z
      .string()
      .min(1, "Phone number is required.")
      .refine((value) => isValidIndianPhoneInput(value), {
        message: "Enter a valid Indian mobile number.",
      })
  );

const normalizedPhoneFieldSchema = phoneInputSchema.transform((value) =>
  normalizeIndianPhoneNumber(value)
);

const requiredEmailFieldSchema = z
  .string({ error: "Email address is required." })
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .string()
      .min(1, "Email address is required.")
      .email("Enter a valid email address.")
      .max(120, "Email address must be 120 characters or fewer.")
  );

const optionalEmailFieldSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .transform((value) => value.trim().toLowerCase())
    .pipe(
      z
        .string()
        .email("Enter a valid email address.")
        .max(120, "Email address must be 120 characters or fewer.")
    )
    .optional()
);

const requestTypeFieldSchema = z.enum(REQUEST_TYPE_OPTIONS, {
  error: "Select a valid request type.",
});

const residenceTypeFieldSchema = z.enum(RESIDENCE_TYPE_OPTIONS, {
  error: "Select a residence preference.",
});

const configFieldSchema = z.enum(LANDING_CONFIG_OPTIONS, {
  error: "Select a valid configuration.",
});

const budgetFieldSchema = z.enum(LANDING_BUDGET_OPTIONS, {
  error: "Select a valid budget range.",
});

const preferredTimeFieldSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .transform((value) => collapseWhitespace(value))
    .pipe(
      z.string().max(
        PREFERRED_TIME_MAX_LENGTH,
        `Preferred time must be ${PREFERRED_TIME_MAX_LENGTH} characters or fewer.`
      )
    )
    .optional()
);

const messageFieldSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .transform((value) => value.trim())
    .pipe(
      z.string().max(
        FORM_MESSAGE_MAX_LENGTH,
        `Message must be ${FORM_MESSAGE_MAX_LENGTH} characters or fewer.`
      )
    )
    .optional()
);

const sourceFieldSchema = z
  .string()
  .transform((value) => value.trim())
  .pipe(
    z
      .string()
      .min(1, "Source is required.")
      .max(SOURCE_MAX_LENGTH, `Source must be ${SOURCE_MAX_LENGTH} characters or fewer.`)
  );

const projectNameFieldSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string()
    .transform((value) => collapseWhitespace(value))
    .pipe(
      z.string().max(
        PROJECT_NAME_MAX_LENGTH,
        `Project name must be ${PROJECT_NAME_MAX_LENGTH} characters or fewer.`
      )
    )
    .optional()
);

export const landingLeadFormSchema = z.object({
  name: nameFieldSchema,
  phone: phoneInputSchema,
  config: configFieldSchema,
  budget: budgetFieldSchema,
  message: messageFieldSchema,
});

export const contactPageFormSchema = z.object({
  name: nameFieldSchema,
  phone: phoneInputSchema,
  email: requiredEmailFieldSchema,
  requestType: z.enum(["register_interest", "book_unit", "site_visit", "brochure"], {
    error: "Select a valid request type.",
  }),
  preferredTime: preferredTimeFieldSchema,
  message: messageFieldSchema,
});

export const readyToMoveContactFormSchema = z.object({
  requestType: z.enum(["register_interest", "book_unit", "site_visit", "brochure"], {
    error: "Choose one inquiry purpose.",
  }),
  residenceType: residenceTypeFieldSchema,
  name: nameFieldSchema,
  email: requiredEmailFieldSchema,
  phone: phoneInputSchema,
  preferredTime: preferredTimeFieldSchema,
  message: messageFieldSchema,
});

export const whatsAppLeadFormSchema = z.object({
  name: nameFieldSchema,
  phone: phoneInputSchema,
});

export const contactApiSchema = z
  .object({
    name: nameFieldSchema,
    phone: normalizedPhoneFieldSchema,
    email: optionalEmailFieldSchema,
    requestType: requestTypeFieldSchema,
    config: z.preprocess(emptyStringToUndefined, configFieldSchema.optional()),
    budget: z.preprocess(emptyStringToUndefined, budgetFieldSchema.optional()),
    preferredTime: preferredTimeFieldSchema,
    message: messageFieldSchema,
    source: sourceFieldSchema,
    residenceType: z.preprocess(
      emptyStringToUndefined,
      residenceTypeFieldSchema.optional()
    ),
  })
  .superRefine((value, ctx) => {
    if (EMAIL_REQUIRED_SOURCES.has(value.source) && !value.email) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Email address is required.",
      });
    }

    if (RESIDENCE_REQUIRED_SOURCES.has(value.source) && !value.residenceType) {
      ctx.addIssue({
        code: "custom",
        path: ["residenceType"],
        message: "Choose a residence preference.",
      });
    }

    if (LANDING_SOURCE_SET.has(value.source) && !value.config) {
      ctx.addIssue({
        code: "custom",
        path: ["config"],
        message: "Select a valid configuration.",
      });
    }

    if (LANDING_SOURCE_SET.has(value.source) && !value.budget) {
      ctx.addIssue({
        code: "custom",
        path: ["budget"],
        message: "Select a valid budget range.",
      });
    }
  });

export const whatsAppApiSchema = z.object({
  name: nameFieldSchema,
  phone: normalizedPhoneFieldSchema,
  projectName: projectNameFieldSchema,
  source: z.preprocess(
    emptyStringToUndefined,
    sourceFieldSchema.optional()
  ),
});

export function getZodFieldErrors(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of error.issues) {
    const fieldName = String(issue.path[0] || "form");

    if (!fieldErrors[fieldName]) {
      fieldErrors[fieldName] = issue.message;
    }
  }

  return fieldErrors;
}

export function getFormFieldErrors<T extends z.ZodTypeAny>(
  schema: T,
  values: unknown
) {
  const result = schema.safeParse(values);

  if (result.success) {
    return {};
  }

  return getZodFieldErrors(result.error);
}

export function getVisibleFieldErrors(
  errors: Record<string, string>,
  touched: Record<string, boolean>
) {
  return Object.fromEntries(
    Object.entries(errors).filter(([fieldName]) => touched[fieldName])
  );
}

export function touchAllFields(values: Record<string, unknown>) {
  return Object.keys(values).reduce<Record<string, boolean>>((accumulator, key) => {
    accumulator[key] = true;
    return accumulator;
  }, {});
}

export function createValidationErrorResponse(error: z.ZodError) {
  return {
    error: FIELD_ERROR_MESSAGE,
    fieldErrors: getZodFieldErrors(error),
  };
}
