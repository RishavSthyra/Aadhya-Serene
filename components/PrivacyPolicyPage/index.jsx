import LegalPage, {
  PolicyContactCard,
  PolicyNotes,
  PolicySection,
} from '@/components/LegalPage';
import styles from '@/components/LegalPage/legal-page.module.css';
import {
  CONTACT_EMAIL,
  CONTACT_PHONE,
  CONTACT_PHONE_LINK,
  LEGAL_TABS,
  PROJECT_LOCATION,
} from '@/components/LegalPage/constants';

const EFFECTIVE_DATE = 'July 2, 2026';

const tocItems = [
  { label: 'Introduction', href: '#introduction' },
  { label: 'Data We Collect', href: '#data-we-collect' },
  { label: 'How We Use Your Data', href: '#how-we-use-your-data' },
  { label: 'How We Share Information', href: '#how-we-share-information' },
  { label: 'Retention & Security', href: '#retention-and-security' },
  { label: 'Your Choices & Rights', href: '#your-choices-and-rights' },
  { label: 'Contact Us', href: '#contact-us' },
];

const contactItems = [
  { label: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { label: 'Phone', value: CONTACT_PHONE, href: CONTACT_PHONE_LINK },
  { label: 'Project', value: PROJECT_LOCATION },
];

const noteItems = [
  {
    id: 'user-agreement',
    label: 'User Agreement',
    copy:
      'By using this website, you agree to use the content only for lawful, personal, and project-enquiry purposes.',
  },
  {
    id: 'cookie-notice',
    label: 'Cookie Notice',
    copy:
      'This website may use essential cookies, analytics tools, and ad attribution technologies to understand traffic and lead quality.',
  },
  {
    id: 'copyright-policy',
    label: 'Copyright Policy',
    copy:
      'Project visuals, floor plans, renderings, branding, and written content on this site are protected and should not be reused without permission.',
  },
  {
    id: 'california-privacy-disclosure',
    label: 'California Privacy Disclosure',
    copy:
      'If a visitor is entitled to specific privacy rights under applicable California law, requests can be submitted through the contact details listed on this page.',
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      activeTab="privacy-policy"
      tabs={LEGAL_TABS}
      heroId="privacy-policy"
      heroTitle="Privacy Policy"
      heroCopy="This policy explains how Aadhya Serene collects, uses, and protects information shared through our website, enquiry forms, WhatsApp journeys, brochure requests, and site-visit interactions."
      effectiveDate={EFFECTIVE_DATE}
      metaCopy="We updated this page to reflect how this project website handles enquiries related to pricing, availability, brochures, floor plans, walkthroughs, and site visits."
      tocItems={tocItems}
      metaCardCopy="This page follows the tone and visual language used across the Aadhya Serene ready-to-move experience."
    >
      <PolicySection id="introduction" title="Your Privacy Matters">
        <p>
          Aadhya Serene is a residential project website designed to help
          prospective buyers explore near-possession 2 and 3 BHK homes in North
          Bengaluru. When you browse this website or submit an enquiry, we may
          collect information that helps us respond to your interest in the
          project.
        </p>
        <p>
          This policy applies to interactions across the public site, including
          home page enquiry forms, WhatsApp lead capture, brochure requests,
          callback requests, site-visit scheduling, and other direct contact
          channels made available on the website.
        </p>
      </PolicySection>

      <PolicySection id="data-we-collect" title="Data We Collect">
        <p>Depending on how you interact with the website, we may collect:</p>
        <ul className={styles.list}>
          <li>Name, phone number, email address, and communication preference.</li>
          <li>Apartment interest such as 2 BHK or 3 BHK preference and budget range.</li>
          <li>Messages you submit about pricing, floor plans, brochures, financing, or visits.</li>
          <li>Engagement details such as pages viewed, forms opened, buttons clicked, or lead-source information.</li>
          <li>Technical data like device, browser, approximate location, IP-related logs, and analytics events.</li>
        </ul>
        <p>
          If you contact us on WhatsApp or by phone after using this site, the
          information shared in those conversations may also be used to continue
          your enquiry and support your purchase journey.
        </p>
      </PolicySection>

      <PolicySection id="how-we-use-your-data" title="How We Use Your Data">
        <p>We use collected information to operate the project website and to:</p>
        <ul className={styles.list}>
          <li>Respond to enquiries about pricing, availability, specifications, and possession status.</li>
          <li>Send brochures, floor plans, project details, and requested follow-up communication.</li>
          <li>Arrange callbacks, WhatsApp responses, and site-visit coordination.</li>
          <li>Understand marketing performance and improve the website experience.</li>
          <li>Maintain records of lead conversations and buyer-interest history.</li>
        </ul>
        <p>
          We do not ask for payment card data through this website, and we do not
          knowingly collect sensitive personal information unless you choose to
          include it in your enquiry.
        </p>
      </PolicySection>

      <PolicySection id="how-we-share-information" title="How We Share Information">
        <p>
          We may share enquiry information with internal sales teams, project
          representatives, CRM or communication tools, hosting providers, and
          service partners who help us operate the website and respond to leads.
        </p>
        <p>
          Information may also be processed through advertising and analytics
          tools used to measure campaign performance, provided those tools are
          configured for legitimate business use related to this project.
        </p>
        <p>
          We do not sell your personal information as part of a public data
          marketplace. We may disclose information if required by law, to protect
          legal rights, or to investigate fraud or misuse of the website.
        </p>
      </PolicySection>

      <PolicySection id="retention-and-security" title="Retention & Security">
        <p>
          We retain enquiry information for as long as reasonably needed to manage
          active sales conversations, buyer support, legal compliance, and project
          reporting. Retention periods may vary depending on whether you remain in
          contact with our team.
        </p>
        <p>
          We use commercially reasonable administrative and technical safeguards to
          protect submitted data. No internet transmission or storage system is
          fully guaranteed to be secure, so we encourage you not to submit
          unnecessary confidential information through public forms.
        </p>
      </PolicySection>

      <PolicySection id="your-choices-and-rights" title="Your Choices & Rights">
        <p>
          You may request that we update, correct, or stop using your enquiry
          information for follow-up communication. You can also ask about the
          details we currently hold in relation to your website enquiry.
        </p>
        <p>
          If you do not want cookies or analytics technologies to operate through
          your browser, you can manage those settings directly in your browser or
          device. Some website features may work differently after such changes.
        </p>
      </PolicySection>

      <PolicySection id="contact-us" title="Contact Us">
        <p>
          For privacy-related questions, data correction requests, or communication
          preferences, contact the Aadhya Serene team using the details below.
        </p>
        <PolicyContactCard items={contactItems} />
      </PolicySection>

      <PolicyNotes items={noteItems} />
    </LegalPage>
  );
}
