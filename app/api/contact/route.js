import { NextResponse } from 'next/server';
import {
  createEnquiryRecord,
  getMissingMailConfigFields,
  getRequestMetadataFromHeaders,
  getRequestLabel,
  sendEnquiryNotificationEmail,
  updateEnquiryRecord,
} from '@/lib/enquiry-service';
import {
  contactApiSchema,
  createValidationErrorResponse,
} from '@/lib/validation/enquiry';

export async function POST(request) {
  const missingConfigFields = getMissingMailConfigFields();

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

  const parseResult = contactApiSchema.safeParse({
    ...payload,
    source: payload?.source || 'website',
  });

  if (!parseResult.success) {
    return NextResponse.json(createValidationErrorResponse(parseResult.error), {
      status: 400,
    });
  }

  const submission = parseResult.data;
  const requestLabel = getRequestLabel(submission.requestType);
  const requestMetadata = getRequestMetadataFromHeaders(request.headers);
  let record = null;

  try {
    record = await createEnquiryRecord({
      projectName: 'Aadhya Serene',
      source: submission.source || 'website',
      channel: 'contact_form',
      name: submission.name,
      phone: submission.phone,
      email: submission.email,
      requestType: submission.requestType,
      requestLabel,
      preferredTime: submission.preferredTime,
      message: submission.message,
      metadata: {
        requestContext: requestMetadata,
      },
      emailDelivery: { status: 'pending' },
      whatsappDelivery: { status: 'not_requested' },
    });

    await sendEnquiryNotificationEmail({
      projectName: 'Aadhya Serene',
      source: submission.source || 'website',
      channel: 'contact_form',
      name: submission.name,
      phone: submission.phone,
      email: submission.email,
      requestType: submission.requestType,
      requestLabel,
      preferredTime: submission.preferredTime,
      message: submission.message,
    });

    await updateEnquiryRecord(record?._id, {
      $set: {
        emailDelivery: {
          status: 'sent',
          sentAt: new Date(),
          error: '',
        },
      },
    });

    return NextResponse.json({
      message: 'Your enquiry has been saved and emailed to our team. We will reach out shortly.',
    });
  } catch (error) {
    console.error('Contact enquiry processing failed:', error);

    if (record?._id) {
      await updateEnquiryRecord(record._id, {
        $set: {
          emailDelivery: {
            status: 'failed',
            error: error instanceof Error ? error.message : String(error),
          },
        },
      }).catch((updateError) => {
        console.error('Failed to update enquiry delivery state:', updateError);
      });
    }

    return NextResponse.json(
      { error: 'We could not complete your enquiry right now. Please try again in a moment.' },
      { status: 500 }
    );
  }
}
