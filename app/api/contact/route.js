import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const REQUEST_TYPE_LABELS = {
  register_interest: 'Register Interest',
  book_unit: 'Book a Unit',
  site_visit: 'Schedule a Site Visit',
  brochure: 'Request Brochure',
};

const REQUIRED_ENV_KEYS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_TO'];

function cleanValue(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildInfoRow(label, value) {
  return `
    <tr>
      <td style="padding:12px 0;color:#7f8a98;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;border-bottom:1px solid rgba(129,146,173,0.18);vertical-align:top;">
        ${escapeHtml(label)}
      </td>
      <td style="padding:12px 0 12px 18px;color:#f5f7fb;font-size:14px;border-bottom:1px solid rgba(129,146,173,0.18);">
        ${escapeHtml(value)}
      </td>
    </tr>
  `;
}

function getMissingEnvKeys() {
  return REQUIRED_ENV_KEYS.filter((key) => !cleanValue(process.env[key]));
}

export async function POST(request) {
  const missingEnvKeys = getMissingEnvKeys();

  if (missingEnvKeys.length) {
    return NextResponse.json(
      { error: 'Contact mail service is not configured yet.' },
      { status: 500 }
    );
  }

  let payload;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request payload.' }, { status: 400 });
  }

  const submission = {
    name: cleanValue(payload?.name),
    phone: cleanValue(payload?.phone),
    email: cleanValue(payload?.email).toLowerCase(),
    requestType: cleanValue(payload?.requestType),
    preferredTime: cleanValue(payload?.preferredTime),
    message: cleanValue(payload?.message),
  };

  if (!submission.name || !submission.phone || !submission.email || !submission.requestType) {
    return NextResponse.json(
      { error: 'Please complete the required contact details.' },
      { status: 400 }
    );
  }

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(submission.email);

  if (!isValidEmail) {
    return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
  }

  const requestLabel = REQUEST_TYPE_LABELS[submission.requestType] || 'General Enquiry';
  const submittedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const html = `
    <div style="background:#0b0f14;padding:32px;font-family:Arial,sans-serif;color:#f5f7fb;">
      <div style="max-width:680px;margin:0 auto;background:linear-gradient(180deg,rgba(24,31,40,0.96),rgba(13,17,24,0.96));border:1px solid rgba(205,183,123,0.24);border-radius:28px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.35);">
        <div style="padding:28px 32px;border-bottom:1px solid rgba(205,183,123,0.16);background:radial-gradient(circle at top left,rgba(214,188,128,0.16),transparent 42%),linear-gradient(135deg,rgba(255,255,255,0.03),rgba(255,255,255,0));">
          <div style="display:inline-block;padding:8px 14px;border-radius:999px;border:1px solid rgba(205,183,123,0.26);background:rgba(255,255,255,0.04);color:#efe5c3;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;">
            New Website Enquiry
          </div>
          <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.15;font-weight:600;color:#ffffff;">
            ${escapeHtml(requestLabel)} from ${escapeHtml(submission.name)}
          </h1>
          <p style="margin:0;color:#b9c2d0;font-size:14px;line-height:1.7;">
            A fresh enquiry was submitted through the Aadhya Serene contact page.
          </p>
        </div>

        <div style="padding:18px 32px 32px;">
          <table style="width:100%;border-collapse:collapse;">
            <tbody>
              ${buildInfoRow('Name', submission.name)}
              ${buildInfoRow('Phone', submission.phone)}
              ${buildInfoRow('Email', submission.email)}
              ${buildInfoRow('Request', requestLabel)}
              ${buildInfoRow('Preferred Time', submission.preferredTime || 'Not specified')}
              ${buildInfoRow('Submitted', submittedAt)}
            </tbody>
          </table>

          <div style="margin-top:24px;padding:22px 24px;border-radius:20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);">
            <div style="margin-bottom:10px;color:#7f8a98;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;">
              Client Message
            </div>
            <p style="margin:0;color:#f5f7fb;font-size:15px;line-height:1.8;white-space:pre-wrap;">
              ${escapeHtml(submission.message || 'No additional message was provided.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  const text = [
    `Aadhya Serene contact enquiry`,
    ``,
    `Request: ${requestLabel}`,
    `Name: ${submission.name}`,
    `Phone: ${submission.phone}`,
    `Email: ${submission.email}`,
    `Preferred time: ${submission.preferredTime || 'Not specified'}`,
    `Submitted: ${submittedAt}`,
    ``,
    `Message:`,
    submission.message || 'No additional message was provided.',
  ].join('\n');

  try {
    await transporter.sendMail({
      from: 'Aadhya Serene <noreply@aadhyaserene.dev>',
      to: process.env.SMTP_TO,
      replyTo: submission.email,
      subject: `[Aadhya Serene] ${requestLabel} - ${submission.name}`,
      text,
      html,
    });

    return NextResponse.json({
      message: 'Your enquiry is on its way. Our team will reach out shortly.',
    });
  } catch (error) {
    console.error('Contact form email failed:', error);

    return NextResponse.json(
      { error: 'We could not send your enquiry right now. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
