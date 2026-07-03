import nodemailer from 'nodemailer';
import { connectMongo } from './mongodb';
import { Notification } from './models';

export const REQUEST_TYPE_LABELS = {
    register_interest: 'Register Interest',
    book_unit: 'Book a Unit',
    site_visit: 'Schedule a Site Visit',
    brochure: 'Request Brochure',
    whatsapp_flow: 'WhatsApp Flow Start',
};

const DEFAULT_TO_EMAIL = 'sales@abhignaconstructions.com';
const DEFAULT_FROM_EMAIL = 'website@aadhyaserene.com';

export function cleanValue(value) {
    return typeof value === 'string' ? value.trim() : '';
}

function escapeHtml(value) {
    return String(value)
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

export function getRequestLabel(requestType) {
    return REQUEST_TYPE_LABELS[requestType] || 'General Enquiry';
}

function getMailConfig() {
    const user = cleanValue(process.env.EMAIL_USER);
    const pass = cleanValue(process.env.GOOGLE_APP_PASSWORD);
    const to = cleanValue(
        process.env.CONTACT_TO_EMAIL || process.env.EMAIL_USER || DEFAULT_TO_EMAIL,
    );
    const from = cleanValue(
        process.env.CONTACT_FROM_EMAIL || process.env.EMAIL_USER || DEFAULT_FROM_EMAIL,
    );

    return {
        user,
        pass,
        to,
        from,
    };
}

export function getMissingMailConfigFields(mailConfig = getMailConfig()) {
    const missingFields = [];

    if (!mailConfig.user) {
        missingFields.push('EMAIL_USER');
    }

    if (!mailConfig.pass) {
        missingFields.push('GOOGLE_APP_PASSWORD');
    }

    if (!mailConfig.to) {
        missingFields.push('CONTACT_TO_EMAIL');
    }

    return missingFields;
}

function createMailConfigError(missingFields) {
    const error = new Error('Contact mail service is not configured yet.');
    error.missingFields = missingFields;
    return error;
}

function ensureMailConfig() {
    const mailConfig = getMailConfig();
    const missingConfigFields = getMissingMailConfigFields(mailConfig);

    if (missingConfigFields.length) {
        throw createMailConfigError(missingConfigFields);
    }

    return mailConfig;
}

export async function createEnquiryRecord(input) {
    await connectMongo();

    const record = await Notification.create({
        projectName: cleanValue(input.projectName) || 'Aadhya Serene',
        source: cleanValue(input.source) || 'website',
        channel: input.channel,
        name: cleanValue(input.name),
        phone: cleanValue(input.phone),
        email: cleanValue(input.email).toLowerCase(),
        requestType: cleanValue(input.requestType) || 'general_enquiry',
        requestLabel:
            cleanValue(input.requestLabel) ||
            getRequestLabel(cleanValue(input.requestType)),
        preferredTime: cleanValue(input.preferredTime),
        message: cleanValue(input.message),
        metadata:
            input.metadata && typeof input.metadata === 'object' ? input.metadata : {},
        emailDelivery: input.emailDelivery || { status: 'pending' },
        whatsappDelivery: input.whatsappDelivery || { status: 'not_requested' },
    });

    return record;
}

export async function updateEnquiryRecord(recordId, patch) {
    if (!recordId) {
        return null;
    }

    await connectMongo();

    return Notification.findByIdAndUpdate(recordId, patch, {
        new: true,
    });
}

export async function sendEnquiryNotificationEmail(submission) {
    const mailConfig = ensureMailConfig();
    const requestLabel =
        cleanValue(submission.requestLabel) ||
        getRequestLabel(cleanValue(submission.requestType));
    const enquirySource = cleanValue(submission.source) || 'website';
    const projectName = cleanValue(submission.projectName) || 'Aadhya Serene';
    const channelLabel =
        submission.channel === 'whatsapp_form' ? 'WhatsApp Lead' : 'Website Enquiry';
    const submittedAt = new Date().toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
    });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
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
            ${escapeHtml(channelLabel)}
          </div>
          <h1 style="margin:18px 0 10px;font-size:30px;line-height:1.15;font-weight:600;color:#ffffff;">
            ${escapeHtml(requestLabel)} from ${escapeHtml(submission.name)}
          </h1>
          <p style="margin:0;color:#b9c2d0;font-size:14px;line-height:1.7;">
            A fresh enquiry was submitted for ${escapeHtml(projectName)}.
          </p>
        </div>

        <div style="padding:18px 32px 32px;">
          <table style="width:100%;border-collapse:collapse;">
            <tbody>
              ${buildInfoRow('Project', projectName)}
              ${buildInfoRow('Channel', channelLabel)}
              ${buildInfoRow('Source', enquirySource)}
              ${buildInfoRow('Name', submission.name)}
              ${buildInfoRow('Phone', submission.phone)}
              ${buildInfoRow('Email', submission.email || 'Not provided')}
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
        `${projectName} enquiry`,
        '',
        `Channel: ${channelLabel}`,
        `Source: ${enquirySource}`,
        `Request: ${requestLabel}`,
        `Name: ${submission.name}`,
        `Phone: ${submission.phone}`,
        `Email: ${submission.email || 'Not provided'}`,
        `Preferred time: ${submission.preferredTime || 'Not specified'}`,
        `Submitted: ${submittedAt}`,
        '',
        'Message:',
        submission.message || 'No additional message was provided.',
    ].join('\n');

    await transporter.sendMail({
        from: `Aadhya Serene <${mailConfig.from}>`,
        to: mailConfig.to,
        replyTo: submission.email || undefined,
        subject: `[Aadhya Serene] ${requestLabel} - ${submission.name} (${enquirySource})`,
        text,
        html,
    });
}
