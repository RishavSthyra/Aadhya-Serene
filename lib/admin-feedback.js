export const ADMIN_FEEDBACK_BUDGET_OPTIONS = [
  "99L - 1.4 Cr",
  "1.4 Cr +",
  "99L - 1.2 Cr",
  "1.2 Cr +",
];

export const ADMIN_FEEDBACK_CONFIGURATION_OPTIONS = ["2 BHK", "3 BHK"];

export const ADMIN_FEEDBACK_LOCATION_MAX_LENGTH = 120;
export const ADMIN_FEEDBACK_NOTES_MAX_LENGTH = 5000;

function collapseWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function normalizeAdminFeedbackLocation(value) {
  return collapseWhitespace(value).slice(0, ADMIN_FEEDBACK_LOCATION_MAX_LENGTH);
}

export function normalizeAdminFeedbackNotes(value) {
  return String(value || "").trim().slice(0, ADMIN_FEEDBACK_NOTES_MAX_LENGTH);
}

export function buildAdminFeedbackText({
  budget = "",
  configuration = "",
  location = "",
  notes = "",
}) {
  const parts = [
    configuration ? `Configuration: ${configuration}` : "",
    budget ? `Budget: ${budget}` : "",
    location ? `Location: ${location}` : "",
    notes ? `Notes: ${notes}` : "",
  ].filter(Boolean);

  return parts.join(" | ");
}

export function getAdminFeedbackFieldErrors(input) {
  const budget = collapseWhitespace(input?.budget);
  const configuration = collapseWhitespace(input?.configuration);
  const location = normalizeAdminFeedbackLocation(input?.location);
  const notes = normalizeAdminFeedbackNotes(input?.notes);
  const fieldErrors = {};

  if (!ADMIN_FEEDBACK_BUDGET_OPTIONS.includes(budget)) {
    fieldErrors.budget = "Select a valid budget range.";
  }

  if (!ADMIN_FEEDBACK_CONFIGURATION_OPTIONS.includes(configuration)) {
    fieldErrors.configuration = "Select a valid configuration.";
  }

  if (!location) {
    fieldErrors.location = "Location is required.";
  }

  if (String(input?.location || "").trim().length > ADMIN_FEEDBACK_LOCATION_MAX_LENGTH) {
    fieldErrors.location = `Location must be ${ADMIN_FEEDBACK_LOCATION_MAX_LENGTH} characters or fewer.`;
  }

  if (notes.length > ADMIN_FEEDBACK_NOTES_MAX_LENGTH) {
    fieldErrors.notes = `Notes must be ${ADMIN_FEEDBACK_NOTES_MAX_LENGTH} characters or fewer.`;
  }

  return fieldErrors;
}

export function normalizeAdminFeedbackInput(input) {
  const budget = collapseWhitespace(input?.budget);
  const configuration = collapseWhitespace(input?.configuration);
  const location = normalizeAdminFeedbackLocation(input?.location);
  const notes = normalizeAdminFeedbackNotes(input?.notes);

  return {
    budget,
    configuration,
    location,
    notes,
    text: buildAdminFeedbackText({ budget, configuration, location, notes }),
  };
}
