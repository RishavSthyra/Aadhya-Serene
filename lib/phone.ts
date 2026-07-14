import { normalizeIndianPhoneNumber } from "@/lib/validation/enquiry";

export function normalizeIndianWhatsAppNumber(input: string): string {
  return normalizeIndianPhoneNumber(input);
}
