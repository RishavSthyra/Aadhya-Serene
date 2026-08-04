# Aadhya Serene External Lead API

## Endpoint

```http
POST https://www.aadhyaserene.com/api/integrations/leads
```

## Headers

```http
Authorization: Bearer <shared-secret>
Content-Type: application/json
```

## Request

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

| Field | Required | Notes |
| --- | --- | --- |
| `leadId` | Yes | Unique and permanent for that lead. Re-send the same ID on retry. |
| `name` | Yes | Customer name. |
| `phone` | Yes | Indian mobile number. Use 10 digits or country-code format. |
| `whatsappConsent` | Yes | Must be `true`. |
| `source` | No | Your platform or campaign name. |
| `email`, `projectName`, `enquiryType`, `message`, `submittedAt` | No | Additional lead details. `submittedAt` must be ISO-8601 UTC. |

## Success

New lead — `201 Created`:

```json
{
  "accepted": true,
  "duplicate": false,
  "leadId": "LEAD-12345",
  "whatsapp": "sent",
  "salesEmail": "sent"
}
```

Repeated lead ID — `200 OK`:

```json
{
  "accepted": true,
  "duplicate": true,
  "leadId": "LEAD-12345"
}
```

## Errors and retries

| Status | Meaning | Action |
| --- | --- | --- |
| `400` | Invalid JSON or missing/invalid field | Correct the request. |
| `401` | Missing or incorrect secret | Correct the authorization header. |
| `503` | Temporary processing issue | Retry with the same `leadId`: after 1, 5, 15, then 60 minutes. |

The system stores accepted leads, notifies the sales team, and sends the approved WhatsApp welcome template when `whatsappConsent` is `true`.
