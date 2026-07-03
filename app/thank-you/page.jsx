import Link from 'next/link';
import Script from 'next/script';
import React from "react";
import { BackgroundLines } from "@/components/ui/background-lines";
 
export default function ThankYouPage() {
  return (
    <>
      <Script id="google-ads-submit-lead-conversion" strategy="afterInteractive">
        {`
          gtag('event', 'conversion', {
            'send_to': 'AW-18286156175/gN3uCL7IwskcEI-zwo9E',
            'value': 1.0,
            'currency': 'INR'
          });
        `}
      </Script>
      <BackgroundLines className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
        <div className="relative z-20 mx-auto flex w-full max-w-5xl flex-col items-center justify-center bg-transparent pt-24 text-center sm:pt-28">
          <span className="inline-flex rounded-full border border-[#d8c4a2] bg-[#f6efe1] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#a9772f]">
            Enquiry Received
          </span>

          <h1 className="bg-gradient-to-b from-neutral-900 to-neutral-700 bg-clip-text py-4 font-sans text-3xl font-bold tracking-tight text-transparent md:py-8 md:text-5xl lg:text-7xl">
            Thank you for reaching out.
          </h1>

          <p className="mx-auto max-w-3xl text-base leading-8 text-neutral-700 md:text-lg">
            Your enquiry has been successfully shared with our team. We will get in touch shortly with the details, next steps, and the support you need to move forward with confidence.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="inline-flex min-h-[56px] items-center justify-center rounded-full border border-[#d4c0a0] bg-[linear-gradient(180deg,#fffdf8_0%,#f5ead8_100%)] px-8 text-sm font-semibold uppercase tracking-[0.18em] text-[#3f3120] shadow-[0_18px_40px_rgba(112,83,35,0.14)] transition hover:-translate-y-0.5 hover:shadow-[0_24px_54px_rgba(112,83,35,0.18)]"
            >
              Back to Home
            </Link>

            <a
              href="https://app.aadhyaserene.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-[linear-gradient(180deg,#1f1a14_0%,#111111_100%)] px-8 text-sm font-semibold uppercase tracking-[0.18em] text-white shadow-[0_22px_50px_rgba(17,17,17,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_28px_60px_rgba(17,17,17,0.28)]"
            >
              Open Aadhya App
            </a>
          </div>
        </div>
      </BackgroundLines>
    </>
  );
}
