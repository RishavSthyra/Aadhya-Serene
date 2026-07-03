"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

function mapWhatsAppErrorMessage(error: {
  code?: number;
  details?: string;
  message?: string;
}) {
  const details = (error.details || error.message || "").toLowerCase();

  if (error.code === 132001) {
    if (details.includes("en_us")) {
      return "WhatsApp is temporarily unavailable because the selected message template is not available in en_US.";
    }

    if (details.includes("does not exist in en")) {
      return "WhatsApp is temporarily unavailable because the selected message template is not available in en.";
    }

    return "WhatsApp is temporarily unavailable because the selected message template or language does not match Meta.";
  }

  if (error.code === 131058) {
    return "This WhatsApp test template only works with Meta public test numbers. Please switch to an approved production template.";
  }

  if (error.code === 190) {
    return "WhatsApp authentication failed. Please refresh the production access token.";
  }

  return "We could not start WhatsApp right now. Please try again shortly.";
}

function getReadableErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") {
    return "We could not start WhatsApp right now. Please try again shortly.";
  }

  const payload = data as {
    error?: string;
  };

  if (payload.error) {
    try {
      const parsed = JSON.parse(payload.error) as {
        error?: {
          code?: number;
          message?: string;
          error_data?: {
            details?: string;
          };
        };
      };

      if (parsed?.error) {
        return mapWhatsAppErrorMessage({
          code: parsed.error.code,
          message: parsed.error.message,
          details: parsed.error.error_data?.details,
        });
      }
    } catch {
      return payload.error;
    }
  }

  return payload.error || "We could not start WhatsApp right now. Please try again shortly.";
}

export default function WhatsAppLeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/whatsapp/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          phone,
          projectName: "Abhigna Constructions",
          source: "ready_to_move_whatsapp_modal",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(getReadableErrorMessage(data));
      }

      setStatus("success");
      setMessage("WhatsApp message sent. Please check your phone.");
      setName("");
      setPhone("");
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "We could not start WhatsApp right now. Please try again shortly."
      );
    }
  }

  return (
    <form onSubmit={submitLead} className="space-y-7">
      <div>
        <label
          htmlFor="name"
          className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f5936]"
        >
          Name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          required
          className="w-full border-0 border-b border-[#d9c8aa] bg-transparent px-0 pb-4 pt-0 text-[1rem] font-normal leading-none text-[#17130d] outline-none transition placeholder:text-[1rem] placeholder:text-[#b7a894] focus:border-[#9f7840]"
          placeholder="Enter your name"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="mb-3 block text-[11px] font-semibold uppercase tracking-[0.22em] text-[#6f5936]"
        >
          WhatsApp number
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          inputMode="numeric"
          required
          className="w-full border-0 border-b border-[#d9c8aa] bg-transparent px-0 pb-4 pt-0 text-[1rem] font-normal leading-none text-[#17130d] outline-none transition placeholder:text-[1rem] placeholder:text-[#b7a894] focus:border-[#9f7840]"
          placeholder="10-digit mobile number"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-[#17120d] px-7 text-[12px] font-semibold uppercase tracking-[0.24em] text-[#f3e7d1] transition hover:bg-[#241a12] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === "loading" ? "Sending..." : "Get details on WhatsApp"}
      </button>

      {message ? (
        <p
          className={
            status === "error"
              ? "text-sm leading-7 text-red-700"
              : "text-sm leading-7 text-emerald-800"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
