import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_LIFETIME_MS = 10 * 60 * 1000;

function getTokenSecret() {
  const secret =
    process.env.THANK_YOU_TOKEN_SECRET
    || process.env.JWT_SECRET
    || process.env.MONGODB_URI
    || process.env.MONGODB_DIRECT_URI;

  if (!secret) {
    throw new Error('A server secret is required to create thank-you links.');
  }

  return secret;
}

function sign(payload) {
  return createHmac('sha256', getTokenSecret()).update(payload).digest('base64url');
}

export function createThankYouToken(leadId, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({
    leadId: String(leadId),
    expiresAt: now + TOKEN_LIFETIME_MS,
  })).toString('base64url');

  return `${payload}.${sign(payload)}`;
}

export function verifyThankYouToken(token, now = Date.now()) {
  try {
    const [payload, suppliedSignature, extraPart] = String(token || '').split('.');
    if (!payload || !suppliedSignature || extraPart) return null;

    const expectedSignature = sign(payload);
    const suppliedBuffer = Buffer.from(suppliedSignature, 'base64url');
    const expectedBuffer = Buffer.from(expectedSignature, 'base64url');

    if (
      suppliedBuffer.length !== expectedBuffer.length
      || !timingSafeEqual(suppliedBuffer, expectedBuffer)
    ) {
      return null;
    }

    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    const leadId = String(parsed?.leadId || '');
    const expiresAt = Number(parsed?.expiresAt || 0);

    if (!/^[a-f\d]{24}$/i.test(leadId) || expiresAt < now) return null;
    return { leadId, expiresAt };
  } catch {
    return null;
  }
}
