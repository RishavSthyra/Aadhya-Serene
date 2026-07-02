export function normalizeIndianWhatsAppNumber(input: string): string {
  const digits = input.replace(/\D/g, "");

  if (!digits) {
    throw new Error("Phone number is required");
  }

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.startsWith("91") && digits.length === 12) {
    return digits;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `91${digits.slice(1)}`;
  }

  throw new Error(
    "Invalid phone number. Use a 10-digit Indian number or 91XXXXXXXXXX."
  );
}
