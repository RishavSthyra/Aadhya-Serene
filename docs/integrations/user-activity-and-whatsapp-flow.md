# Aadhya Serene Lead Activity and WhatsApp Journey

## Purpose

This document explains what happens after a lead is submitted to Aadhya Serene, the WhatsApp journey the customer receives, and the activity recorded for sales follow-up.

## Lead submission

Leads are sent to the following endpoint:

```http
POST https://www.aadhyaserene.com/api/integrations/leads
```

Each request must include:

```http
Authorization: Bearer <shared-secret>
Content-Type: application/json
```

Use the complete request payload below:

```json
{
  "leadId": "LEAD-12345",
  "name": "Customer Name",
  "phone": "9876543210",
  "email": "customer@example.com",
  "source": "partner_name",
  "projectName": "Aadhya Serene",
  "enquiryType": "register_interest",
  "message": "Please share brochure and pricing.",
  "submittedAt": "2026-08-03T10:30:00.000Z",
  "whatsappConsent": true
}
```

| Field | Required | Purpose |
| --- | --- | --- |
| `leadId` | Yes | Unique and permanent ID for the lead. |
| `name` | Yes | Customer name used in the WhatsApp greeting. |
| `phone` | Yes | Indian mobile number for WhatsApp communication. |
| `whatsappConsent` | Yes | Must be `true` before the WhatsApp template is sent. |
| `email` | No | Customer email address. |
| `source` | No | Partner or campaign name. |
| `projectName` | No | Defaults to Aadhya Serene. |
| `enquiryType` | No | For example, `register_interest`, `site_visit`, or `brochure`. |
| `message` | No | Customer enquiry message. |
| `submittedAt` | No | ISO-8601 UTC lead-submission time. |

`leadId` must be unique and permanent for that lead. Repeating the same ID is handled as a retry and does not trigger another WhatsApp message.

## What happens after a valid lead is received

```text
Lead submitted
  → Lead stored in Aadhya Serene lead database
  → Sales team notified by email
  → Approved WhatsApp welcome template sent to the customer
  → Customer chooses WhatsApp options
  → Selections, callback requests, and site-visit requests are recorded
  → Sales team views the activity in the Admin Dashboard
```

The WhatsApp template greets the customer by name. If a name is not available from an internal source, the fallback is `Customer`.

## WhatsApp conversation flow

After the welcome template, the customer can use the following quick-reply journeys.

```text
Start
├─ Explore Project
│  ├─ Brochure → Brochure sent
│  ├─ Virtual Tour → App/virtual-tour link sent
│  └─ Amenities
│     ├─ Location → Google Maps link sent
│     ├─ Floor Plans → Brochure sent
│     └─ Book Site Visit → Site-visit request recorded; sales notified
│
├─ Pricing
│  ├─ 2 BHK → Configured 2 BHK pricing response
│  └─ 3 BHK → Configured 3 BHK pricing response
│     └─ Would you like to book a site visit?
│        ├─ Yes → Site-visit request recorded; sales notified
│        └─ Not Now → Conversation continues without a site-visit request
│
└─ Talk to Sales
   ├─ Request Callback → Callback request recorded; sales notified
   └─ Book Site Visit → Site-visit request recorded; sales notified
```

## User activity recorded

For each WhatsApp quick-reply selection, the system records:

| Activity | Stored information |
| --- | --- |
| Customer selection | Internal button ID and visible button label |
| Time of selection | Timestamp in the conversation history |
| Conversation state | Current point in the WhatsApp journey |
| Callback request | `callbackRequested = true` when selected |
| Site-visit request | `siteVisitRequested = true` when selected |
| Last activity | Most recent recorded WhatsApp selection |

Examples of recorded selections include `Explore Project`, `Brochure`, `Virtual Tour`, `Amenities`, `Location`, `Floor Plans`, `Pricing`, `2 BHK`, `3 BHK`, `Talk to Sales`, `Request Callback`, and `Book Site Visit`.

Free-text messages that do not match a supported quick reply are not treated as a scored customer selection. The chatbot returns the main menu so the customer can continue through the available options.

## Lead temperature

Lead temperature is based on the number of **unique meaningful WhatsApp selections**. Selecting the same option repeatedly is visible in the activity history but counts once toward the score.

| Lead type | Meaningful selections | Sales interpretation |
| --- | ---: | --- |
| Cold | 0–2 | Lead submitted a form or has limited WhatsApp activity. |
| Warm | 3–4 | Customer is actively exploring the project or pricing. |
| Hot | 5 or more | Customer has strong engagement and should receive priority follow-up. |

Callback and site-visit requests are also shown prominently regardless of the numerical lead temperature.

## Admin Dashboard visibility

In **Admin Dashboard → Leads**, leads are grouped into:

```text
Cold | Warm | Hot
```

For each lead, the sales team can see:

- Customer name, phone number, email, source, and original enquiry
- Lead score and Cold/Warm/Hot classification
- Full list of WhatsApp quick-reply selections in order
- Callback requested status
- Site-visit requested status
- WhatsApp and email delivery status
- Last recorded WhatsApp activity

The dashboard refreshes automatically every 30 seconds and can also be refreshed manually.

## Integration requirements

- Capture customer consent before sending `"whatsappConsent": true`.
- Send a valid Indian mobile number.
- Use one unique `leadId` per new lead.
- Retry only temporary `503` failures, using the same `leadId`.
- Keep the shared Bearer secret confidential and use it only in server-to-server requests.

## API response

Successful new lead:

```json
{
  "accepted": true,
  "duplicate": false,
  "leadId": "UNIQUE-LEAD-ID",
  "whatsapp": "sent",
  "salesEmail": "sent"
}
```

A repeated `leadId` returns `200 OK` with `"duplicate": true`; this prevents duplicate WhatsApp messages.
