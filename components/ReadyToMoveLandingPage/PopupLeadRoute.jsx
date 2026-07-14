'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck, X } from 'lucide-react';
import {
  landingLeadFormSchema,
  sanitizeMessageInput,
  sanitizeNameInput,
  sanitizePhoneInput,
} from '@/lib/validation/enquiry';
import { useValidatedForm } from '@/lib/validation/useValidatedForm';

const FORM_IMAGE = '/landing%20page%20images/interiorimage7.avif';
const RERA_NUMBER = 'PRM/KA/RERA/1251/446/PR/180625/006584';

const initialFormState = {
  name: '',
  phone: '',
  config: '2 BHK',
  budget: '99L - 1.2 Cr',
  message: '',
};

export default function PopupLeadRoute() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitState, setSubmitState] = useState({ type: '', message: '' });
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
    schema: landingLeadFormSchema,
    sanitizers: {
      name: sanitizeNameInput,
      phone: sanitizePhoneInput,
      message: sanitizeMessageInput,
    },
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const updateField = (key, value) => setFieldValue(key, value);
  const handleFieldBlur = (key) => setFieldTouched(key);

  const submitForm = async (event) => {
    event.preventDefault();

    const parseResult = validateForm();

    if (!parseResult.success) {
      setSubmitState({
        type: 'error',
        message: 'Please correct the highlighted fields.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitState({ type: '', message: '' });

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...parseResult.data,
          requestType: 'site_visit',
          source: 'ready_to_move_popup_route',
          preferredTime: `Config: ${parseResult.data.config} | Budget: ${parseResult.data.budget}`,
          message: parseResult.data.message
            ? `Notes: ${parseResult.data.message}`
            : 'Pricing & floor plan enquiry from popup route.',
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        if (payload?.fieldErrors) {
          applyServerErrors(payload.fieldErrors);
        }
        throw new Error(payload?.error || 'Something went wrong.');
      }

      setSubmitState({
        type: 'success',
        message: 'Thanks! Your enquiry has been sent to our team.',
      });
      resetForm();

      window.setTimeout(() => {
        window.location.href = '/thank-you';
      }, 700);
    } catch (error) {
      setSubmitState({
        type: 'error',
        message: error.message || 'We could not submit your enquiry right now.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[rgba(10,10,12,0.72)] p-4 backdrop-blur-xl sm:p-6">
      <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center sm:min-h-[calc(100vh-3rem)]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="flex w-full items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex w-full max-w-5xl overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#f7f6f1] shadow-[0_36px_120px_rgba(0,0,0,0.34)]"
          >
            <Link
              href="/ready-to-move"
              className="absolute right-4 top-4 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-black/80 text-white shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl transition hover:scale-[1.04]"
              aria-label="Close form"
            >
              <X className="h-4 w-4" />
            </Link>

            <div className="relative hidden w-[34%] shrink-0 overflow-hidden md:block">
              <img
                src={FORM_IMAGE}
                alt="Aadhya Serene interior"
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.48)_100%)]" />
              <div className="absolute inset-x-4 bottom-4 rounded-[1.3rem] border border-white/15 bg-black/28 px-4 py-4 text-white backdrop-blur-lg">
                <p className="text-[10px] uppercase tracking-[0.28em] text-[#f1d6a4]">
                  Aadhya Serene
                </p>
                <p className="mt-2 text-sm leading-6 text-white/90">
                  Share a few details and our team will review your enquiry and
                  follow up with pricing, floor plans, and site visit assistance.
                </p>
              </div>
            </div>

            <form onSubmit={submitForm} className="relative flex min-h-0 flex-1 flex-col">
              <div className="border-b border-black/8 px-5 py-5 sm:px-6">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[#9b7234]">
                  Priority Enquiry
                </p>
                <h1 className="mt-2 text-[1.65rem] font-semibold tracking-[-0.03em] text-black">
                  Get the Price Sheet, Floor Plans &amp; a Free Site Visit
                </h1>
                <p className="mt-1.5 text-[14px] leading-7 text-[#5c5c58]">
                  Takes 30 seconds. We&apos;ll only contact you about Aadhya
                  Serene.
                </p>
                <ReraBadge className="mt-5" />
              </div>

              <div className="min-h-0 flex-1 px-5 py-5 sm:px-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="Full Name"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(value) => updateField('name', value)}
                    onBlur={() => handleFieldBlur('name')}
                    error={visibleErrors.name}
                    errorId="popup-route-name-error"
                  />
                  <Field
                    label="Phone Number"
                    placeholder="+91"
                    value={formData.phone}
                    onChange={(value) => updateField('phone', value)}
                    onBlur={() => handleFieldBlur('phone')}
                    error={visibleErrors.phone}
                    errorId="popup-route-phone-error"
                    type="tel"
                    inputMode="numeric"
                  />
                  <SelectField
                    label="Configuration"
                    value={formData.config}
                    onChange={(value) => updateField('config', value)}
                    onBlur={() => handleFieldBlur('config')}
                    error={visibleErrors.config}
                    errorId="popup-route-config-error"
                    options={['2 BHK', '3 BHK']}
                  />
                  <SelectField
                    label="Budget (optional)"
                    value={formData.budget}
                    onChange={(value) => updateField('budget', value)}
                    onBlur={() => handleFieldBlur('budget')}
                    error={visibleErrors.budget}
                    errorId="popup-route-budget-error"
                    options={['99L - 1.2 Cr', '1.2 Cr +']}
                  />
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-[#4d4338]">
                    Anything specific? (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.message}
                    onChange={(event) => updateField('message', event.target.value)}
                    onBlur={() => handleFieldBlur('message')}
                    className={`w-full rounded-[1.2rem] border px-4 py-3 text-sm text-black shadow-[0_14px_32px_rgba(0,0,0,0.04)] outline-none transition focus:ring-4 ${
                      visibleErrors.message
                        ? 'border-red-300 bg-red-50/70 focus:border-red-400 focus:ring-red-100'
                        : 'border-black/8 bg-white focus:border-black focus:ring-black/8'
                    }`}
                    placeholder="Preferred facing, family needs, loan help..."
                    aria-invalid={Boolean(visibleErrors.message)}
                    aria-describedby={
                      visibleErrors.message ? 'popup-route-message-error' : undefined
                    }
                  />
                  {visibleErrors.message ? (
                    <p
                      id="popup-route-message-error"
                      className="mt-2 text-xs font-medium text-red-600"
                    >
                      {visibleErrors.message}
                    </p>
                  ) : null}
                </div>

                {submitState.message ? (
                  <div
                    className={`mt-4 rounded-[1.2rem] px-4 py-3 text-[13px] font-medium ${
                      submitState.type === 'success'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border border-red-200 bg-red-50 text-red-700'
                    }`}
                  >
                    {submitState.message}
                  </div>
                ) : null}
              </div>

              <div className="border-t border-black/8 px-5 py-4 sm:px-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full min-h-[52px] items-center justify-center gap-2 rounded-full bg-black text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending...' : 'Submit Enquiry'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  errorId,
  type = 'text',
  inputMode,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d6d68]">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        inputMode={inputMode}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`h-14 w-full rounded-[1.3rem] border px-4 text-sm text-black outline-none transition focus:ring-4 ${
          error
            ? 'border-red-300 bg-red-50/70 focus:border-red-400 focus:ring-red-100'
            : 'border-black/8 bg-[#f7f6f1] focus:border-black focus:ring-black/8'
        }`}
      />
      {error ? (
        <p id={errorId} className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SelectField({ label, value, onChange, onBlur, options, error, errorId }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6d6d68]">
        {label}
      </label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`h-14 w-full rounded-[1.3rem] border px-4 text-sm text-black outline-none transition focus:ring-4 ${
          error
            ? 'border-red-300 bg-red-50/70 focus:border-red-400 focus:ring-red-100'
            : 'border-black/8 bg-[#f7f6f1] focus:border-black focus:ring-black/8'
        }`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {error ? (
        <p id={errorId} className="mt-2 text-xs font-medium text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function ReraBadge({ className = '' }) {
  return (
    <div
      className={`inline-flex max-w-full flex-wrap items-center gap-3 rounded-full border border-[#e5dac7] bg-white/86 px-4 py-2.5 text-[#6c624f] shadow-[0_12px_28px_rgba(0,0,0,0.05)] backdrop-blur-sm ${className}`}
    >
      <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#9a7a45]">
        <ShieldCheck className="h-3.5 w-3.5" strokeWidth={1.6} />
        K-RERA
      </span>
      <span className="hidden h-3.5 w-px bg-black/10 sm:block" />
      <span className="min-w-0 text-[10px] font-medium leading-5 text-[#2f2b25] [overflow-wrap:anywhere] sm:text-[11px]">
        {RERA_NUMBER}
      </span>
    </div>
  );
}
