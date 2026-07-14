'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, MapPin, Phone, Send, ShieldCheck } from 'lucide-react';
import styles from './enquiry-contact-page.module.css';
import {
  readyToMoveContactFormSchema,
  sanitizeEmailInput,
  sanitizeMessageInput,
  sanitizeNameInput,
  sanitizePhoneInput,
  sanitizeSingleLineText,
} from '@/lib/validation/enquiry';
import { useValidatedForm } from '@/lib/validation/useValidatedForm';

const RERA_NUMBER = 'PRM/KA/RERA/1251/446/PR/190614/002604';
const CONTACT_PHONE = '+91 96209 93333';
const CONTACT_PHONE_LINK = 'tel:+919620993333';
const CONTACT_EMAIL = 'info@sthyra.com';
const CONTACT_EMAIL_LINK = 'mailto:info@sthyra.com';
const CONTACT_ADDRESS = 'Thanisandra Main Road, North Bengaluru';

const initialFormState = {
  requestType: '',
  residenceType: '',
  name: '',
  email: '',
  phone: '',
  preferredTime: '',
  message: '',
};

const contactItems = [
  {
    icon: Phone,
    label: 'Call Us',
    primary: CONTACT_PHONE,
    secondary: 'Connect directly with our sales team.',
    href: CONTACT_PHONE_LINK,
    actionLabel: 'Call Now',
  },
  {
    icon: Mail,
    label: 'Email Us',
    primary: CONTACT_EMAIL,
    secondary: 'Every enquiry from this page goes straight to email.',
    href: CONTACT_EMAIL_LINK,
    actionLabel: 'Send Email',
  },
  {
    icon: MapPin,
    label: 'Visit Location',
    primary: CONTACT_ADDRESS,
    secondary: 'Near-possession residences in a well-connected North Bengaluru address.',
  },
];

const purposeOptions = [
  { value: 'register_interest', label: 'Price Sheet & Availability' },
  { value: 'site_visit', label: 'Book a Site Visit' },
  { value: 'brochure', label: 'Brochure Request' },
  { value: 'book_unit', label: 'Unit Booking Support' },
];

const residenceOptions = [
  { value: '2_bhk', label: '2 BHK Residence' },
  { value: '3_bhk', label: '3 BHK Residence' },
  { value: 'both', label: 'Show Me Both Options' },
];

const timeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this_week', label: 'Later This Week' },
  { value: 'weekend', label: 'Weekend' },
];

export default function EnquiryContactPage() {
  const {
    values: formData,
    visibleErrors,
    applyServerErrors,
    resetForm,
    setFieldTouched,
    setFieldValue,
    validateForm,
  } = useValidatedForm({
    initialValues: initialFormState,
    schema: readyToMoveContactFormSchema,
    sanitizers: {
      name: sanitizeNameInput,
      email: sanitizeEmailInput,
      phone: sanitizePhoneInput,
      preferredTime: sanitizeSingleLineText,
      message: sanitizeMessageInput,
    },
  });
  const [submitState, setSubmitState] = useState('idle');
  const [statusMessage, setStatusMessage] = useState(
    'Share your details and our team will reach out with pricing, plans, or a visit slot.'
  );

  function updateField(event) {
    const { name, value } = event.target;
    setFieldValue(name, value);
  }

  function handleBlur(event) {
    setFieldTouched(event.target.name);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitState === 'sending') {
      return;
    }

    const parseResult = validateForm();

    if (!parseResult.success) {
      setSubmitState('error');
      setStatusMessage('Please correct the highlighted fields.');
      return;
    }

    setSubmitState('sending');
    setStatusMessage('Sending your enquiry to the team...');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...parseResult.data,
          requestType: parseResult.data.requestType || 'register_interest',
          preferredTime: [parseResult.data.residenceType, parseResult.data.preferredTime]
            .filter(Boolean)
            .join(' | '),
          message:
            parseResult.data.message || 'Lead captured from the near-possession contact page.',
          source: 'ready_to_move_contact_page',
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (result.fieldErrors) {
          applyServerErrors(result.fieldErrors);
        }
        throw new Error(result.error || 'We could not send your enquiry right now.');
      }

      resetForm();
      setSubmitState('success');
      setStatusMessage(result.message || 'Your enquiry has been sent successfully.');

      window.setTimeout(() => {
        window.location.href = '/thank-you';
      }, 700);
    } catch (error) {
      setSubmitState('error');
      setStatusMessage(error.message || 'Something went wrong while sending your enquiry.');
    }
  }

  return (
    <main className={styles.pageShell}>
      <div className={styles.pageGlow} aria-hidden="true" />

      <section className={styles.pageCard}>
        <div className={styles.topRow}>
          <div className={styles.headingBlock}>
            <span className={styles.eyebrow}>Aadhya Serene Contact</span>
            <h1 className={`font-display ${styles.pageTitle}`}>Let&apos;s Get In Touch</h1>
            <p className={styles.pageCopy}>
              Tell us what you would like to know and we&apos;ll follow up with pricing, floor
              plans, site-visit help, and the next steps that matter to you.
            </p>
          </div>

          <div className={styles.sideMeta}>
            <div className={styles.reraBadge}>
              <ShieldCheck size={16} strokeWidth={1.8} />
              <span>K-RERA</span>
              <strong>{RERA_NUMBER}</strong>
            </div>

            <Link href="/ready-to-move" className={styles.backLink}>
              Back to Near Possession Page
            </Link>
          </div>
        </div>

        <div className={styles.contactGrid}>
          {contactItems.map(({ icon: Icon, label, primary, secondary, href, actionLabel }) => {
            return (
              <div key={label} className={styles.contactCard}>
                <span className={styles.contactIcon}>
                  <Icon size={18} strokeWidth={1.8} />
                </span>
                <span className={styles.contactLabel}>{label}</span>
                {href ? (
                  <a href={href} className={`${styles.contactPrimary} ${styles.contactPrimaryLink}`}>
                    {primary}
                  </a>
                ) : (
                  <strong className={styles.contactPrimary}>{primary}</strong>
                )}
                <span className={styles.contactSecondary}>{secondary}</span>
                {href ? (
                  <a href={href} className={styles.contactAction}>
                    {actionLabel}
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>

        <div className={styles.divider} />

        <div className={styles.formIntro}>
          <h2 className={styles.formHeading}>Or fill out the form below</h2>
          <p className={styles.formCopy}>
            This page is built for ad traffic, but the enquiry still goes to the same mail inbox
            your team is monitoring.
          </p>
        </div>

        <form className={styles.formCard} onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <label className={styles.field}>
              <span>Inquiry Purpose</span>
              <select
                name="requestType"
                value={formData.requestType}
                onChange={updateField}
                onBlur={handleBlur}
                className={`${styles.select} ${visibleErrors.requestType ? styles.inputError : ''}`}
                required
                aria-invalid={Boolean(visibleErrors.requestType)}
                aria-describedby={
                  visibleErrors.requestType ? 'ready-contact-request-type-error' : undefined
                }
              >
                <option value="" disabled>
                  Choose one option
                </option>
                {purposeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {visibleErrors.requestType ? (
                <p id="ready-contact-request-type-error" className={styles.fieldError}>
                  {visibleErrors.requestType}
                </p>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Residence Preference</span>
              <select
                name="residenceType"
                value={formData.residenceType}
                onChange={updateField}
                onBlur={handleBlur}
                className={`${styles.select} ${
                  visibleErrors.residenceType ? styles.inputError : ''
                }`}
                required
                aria-invalid={Boolean(visibleErrors.residenceType)}
                aria-describedby={
                  visibleErrors.residenceType ? 'ready-contact-residence-type-error' : undefined
                }
              >
                <option value="" disabled>
                  Choose one option
                </option>
                {residenceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {visibleErrors.residenceType ? (
                <p id="ready-contact-residence-type-error" className={styles.fieldError}>
                  {visibleErrors.residenceType}
                </p>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Full Name</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={updateField}
                onBlur={handleBlur}
                className={`${styles.input} ${visibleErrors.name ? styles.inputError : ''}`}
                placeholder="Enter your full name"
                autoComplete="name"
                required
                aria-invalid={Boolean(visibleErrors.name)}
                aria-describedby={visibleErrors.name ? 'ready-contact-name-error' : undefined}
              />
              {visibleErrors.name ? (
                <p id="ready-contact-name-error" className={styles.fieldError}>
                  {visibleErrors.name}
                </p>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Email Address</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={updateField}
                onBlur={handleBlur}
                className={`${styles.input} ${visibleErrors.email ? styles.inputError : ''}`}
                placeholder="Enter your email address"
                autoComplete="email"
                required
                aria-invalid={Boolean(visibleErrors.email)}
                aria-describedby={visibleErrors.email ? 'ready-contact-email-error' : undefined}
              />
              {visibleErrors.email ? (
                <p id="ready-contact-email-error" className={styles.fieldError}>
                  {visibleErrors.email}
                </p>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Phone Number</span>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={updateField}
                onBlur={handleBlur}
                className={`${styles.input} ${visibleErrors.phone ? styles.inputError : ''}`}
                placeholder="+91"
                autoComplete="tel"
                inputMode="numeric"
                required
                aria-invalid={Boolean(visibleErrors.phone)}
                aria-describedby={visibleErrors.phone ? 'ready-contact-phone-error' : undefined}
              />
              {visibleErrors.phone ? (
                <p id="ready-contact-phone-error" className={styles.fieldError}>
                  {visibleErrors.phone}
                </p>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Preferred Callback Window</span>
              <select
                name="preferredTime"
                value={formData.preferredTime}
                onChange={updateField}
                onBlur={handleBlur}
                className={`${styles.select} ${
                  visibleErrors.preferredTime ? styles.inputError : ''
                }`}
                aria-invalid={Boolean(visibleErrors.preferredTime)}
                aria-describedby={
                  visibleErrors.preferredTime ? 'ready-contact-preferred-time-error' : undefined
                }
              >
                <option value="">Choose one option</option>
                {timeOptions.map((option) => (
                  <option key={option.value} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
              {visibleErrors.preferredTime ? (
                <p id="ready-contact-preferred-time-error" className={styles.fieldError}>
                  {visibleErrors.preferredTime}
                </p>
              ) : null}
            </label>

            <label className={`${styles.field} ${styles.fullWidthField}`}>
              <span>Anything specific?</span>
              <textarea
                name="message"
                value={formData.message}
                onChange={updateField}
                onBlur={handleBlur}
                className={`${styles.textarea} ${visibleErrors.message ? styles.inputError : ''}`}
                placeholder="Tell us if you want the price sheet, a call back, a site visit, or help choosing between 2 and 3 BHK options."
                rows={5}
                aria-invalid={Boolean(visibleErrors.message)}
                aria-describedby={visibleErrors.message ? 'ready-contact-message-error' : undefined}
              />
              {visibleErrors.message ? (
                <p id="ready-contact-message-error" className={styles.fieldError}>
                  {visibleErrors.message}
                </p>
              ) : null}
            </label>
          </div>

          <div
            className={`${styles.statusPill} ${
              submitState === 'success'
                ? styles.statusSuccess
                : submitState === 'error'
                  ? styles.statusError
                  : ''
            }`}
          >
            {statusMessage}
          </div>

          <div className={styles.actionRow}>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitState === 'sending'}
            >
              <span>{submitState === 'sending' ? 'Sending Enquiry' : 'Submit Form'}</span>
              <Send size={16} strokeWidth={1.9} />
            </button>

            <p className={styles.disclaimer}>
              By submitting, you consent to our team contacting you about availability, pricing,
              brochures, and site visits for Aadhya Serene.
            </p>
          </div>
        </form>
      </section>
    </main>
  );
}
