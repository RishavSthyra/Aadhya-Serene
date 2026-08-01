# Global WhatsApp Form Follow-up Design

## Goal

Send the approved `aadhya_serene_template_global` template to every valid website-form lead. Its single body variable receives the submitted name, or `Customer` when no name is available. After the customer presses a template quick reply, the existing WhatsApp webhook drives a configurable interactive chat flow.

## Boundaries

- Keep `/api/whatsapp/webhook` as the only WhatsApp webhook.
- Use `WHATSAPP_GLOBAL_TEMPLATE_NAME` for normal website forms handled by `/api/contact` and the ready-to-move WhatsApp modal handled by `/api/whatsapp/start`.
- Send no additional templates after the initial inbound lead template. All subsequent replies use normal interactive or text messages in the customer-service window.

## Flow

`/api/contact` saves the lead and emails the sales inbox as it does today. It then sends the global template, stores delivery status, and creates a MongoDB conversation record. The webhook resolves a stable internal button ID, persists the interaction, and runs the matching transition from `lib/chatbot-flow.ts`.

The flow supports Explore Project, Brochure, Virtual Tour, Amenities, Location, Floor Plans, site-visit booking, Pricing by configuration, and Talk to Sales/callback requests. Site-visit and callback requests are written to MongoDB and produce an email notification to the sales inbox.

## Data

`whatsapp_conversations` stores the phone number, linked enquiry ID, current state, last button, event history, timestamps, and site-visit/callback flags. The linked enquiry also receives a lightweight journey snapshot in `metadata.whatsappJourney` for the existing admin-lead interface.

## Configuration

- `WHATSAPP_GLOBAL_TEMPLATE_NAME=aadhya_serene_template_global`
- `WHATSAPP_LOCATION_URL`
- `WHATSAPP_PRICING_2BHK`
- `WHATSAPP_PRICING_3BHK`

Button display text and aliases are centralized in `lib/chatbot-flow.ts`; transport and routing use stable IDs such as `explore_project`, `pricing_2bhk`, and `book_site_visit`.

## Error handling

Email and form persistence retain their existing behavior. A WhatsApp delivery failure is recorded on the enquiry but does not discard a successfully submitted form. Brochure delivery first uses a WhatsApp document message and falls back to the configured brochure link. Incoming WhatsApp message IDs are recorded to reduce duplicate webhook responses.
