import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const REQUEST_TYPE_LABELS = {
  register_interest: 'Register Interest',
  book_unit: 'Book a Unit',
  site_visit: 'Schedule a Site Visit',
  brochure: 'Request Brochure',
};

const DEFAULT_TO_EMAIL = 'sales@abhignaconstructions.com';
const DEFAULT_FROM_EMAIL = 'website@aadhyaserene.com';

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

function getMailConfig() {
  const host = cleanValue(process.env.SMTP_HOST || process.env.MAILTRAP_HOST);
  const portValue = cleanValue(process.env.SMTP_PORT || process.env.MAILTRAP_PORT);
  const user = cleanValue(process.env.SMTP_USER || process.env.MAILTRAP_USER);
  const pass = cleanValue(process.env.SMTP_PASS || process.env.MAILTRAP_PASS);
  const to = cleanValue(
    process.env.SMTP_TO ||
      process.env.CONTACT_TO_EMAIL ||
      process.env.MAILTRAP_TO ||
      DEFAULT_TO_EMAIL
  );
  const from = cleanValue(
    process.env.SMTP_FROM ||
      process.env.CONTACT_FROM_EMAIL ||
      process.env.MAILTRAP_FROM ||
      DEFAULT_FROM_EMAIL
  );

  return {
    host,
    port: Number(portValue),
    portValue,
    user,
    pass,
    to,
    from,
  };
}

function getMissingConfigFields(mailConfig) {
  const missingFields = [];

  if (!mailConfig.host) {
    missingFields.push('host');
  }

  if (!mailConfig.portValue || Number.isNaN(mailConfig.port)) {
    missingFields.push('port');
  }

  if (!mailConfig.user) {
    missingFields.push('user');
  }

  if (!mailConfig.pass) {
    missingFields.push('pass');
  }

  if (!mailConfig.to) {
    missingFields.push('to');
  }

  return missingFields;
}

export async function POST(request) {
  const mailConfig = getMailConfig();
  const missingConfigFields = getMissingConfigFields(mailConfig);

  if (missingConfigFields.length) {
    console.error('Contact mail service is not configured yet:', missingConfigFields);
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
    source: cleanValue(payload?.source),
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
  const enquirySource = submission.source || 'website';
  const submittedAt = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  });

  const transporter = nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secure: mailConfig.port === 465,
    auth: {
      user: mailConfig.user,
      pass: mailConfig.pass,
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
              ${buildInfoRow('Source', enquirySource)}
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
    `Source: ${enquirySource}`,
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
      from: `Aadhya Serene <${mailConfig.from}>`,
      to: mailConfig.to,
      replyTo: submission.email,
      subject: `[Aadhya Serene] ${requestLabel} - ${submission.name} (${enquirySource})`,
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
