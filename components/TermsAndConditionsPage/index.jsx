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

const EFFECTIVE_DATE = 'July 3, 2026';

const tocItems = [
  { label: 'Acceptance of Terms', href: '#acceptance-of-terms' },
  { label: 'Website Purpose', href: '#website-purpose' },
  { label: 'Content & Accuracy', href: '#content-and-accuracy' },
  { label: 'Permitted Use', href: '#permitted-use' },
  { label: 'Lead Submissions', href: '#lead-submissions' },
  { label: 'Intellectual Property', href: '#intellectual-property' },
  { label: 'Liability & Updates', href: '#liability-and-updates' },
  { label: 'Contact Us', href: '#contact-us' },
];

const contactItems = [
  { label: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { label: 'Phone', value: CONTACT_PHONE, href: CONTACT_PHONE_LINK },
  { label: 'Project', value: PROJECT_LOCATION },
];

const noteItems = [
  {
    id: 'cookie-notice',
    label: 'Cookie Notice',
    copy:
      'This website may use cookies, analytics tags, and ad attribution tools to understand how visitors discover the project and to improve response quality.',
  },
  {
    id: 'pricing-and-availability',
    label: 'Pricing & Availability',
    copy:
      'Pricing, inventory, and possession timelines may change without notice and should always be reconfirmed with the sales team before making a decision.',
  },
  {
    id: 'brochure-disclaimer',
    label: 'Brochure Disclaimer',
    copy:
      'Brochures, renderings, and floor plans are meant for general reference and may include artistic or illustrative elements that are subject to project updates.',
  },
  {
    id: 'third-party-links',
    label: 'Third-Party Links',
    copy:
      'If this site links to external maps, forms, WhatsApp, or partner tools, their own terms and privacy practices will apply when you use them.',
  },
];

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      activeTab="terms-and-conditions"
      tabs={LEGAL_TABS}
      heroId="terms-and-conditions"
      heroTitle="Terms & Conditions"
      heroCopy="These terms describe the rules for using the Aadhya Serene website, browsing project information, and submitting enquiries through our digital channels."
      effectiveDate={EFFECTIVE_DATE}
      metaCopy="This page is intended to support Meta listings, lead journeys, brochure requests, and website visits with clear, buyer-friendly usage terms."
      tocItems={tocItems}
      metaCardCopy="These terms are written for a project-marketing website and should be read together with the Aadhya Serene Privacy Policy and user data deletion instructions."
    >
      <PolicySection id="acceptance-of-terms" title="Acceptance of Terms">
        <p>
          By accessing or using the Aadhya Serene website, you agree to these
          Terms &amp; Conditions and to use the website only for lawful,
          informational, and genuine project-enquiry purposes.
        </p>
        <p>
          If you do not agree with these terms, please discontinue use of the
          website and avoid submitting personal information through the forms or
          communication buttons provided on the site.
        </p>
      </PolicySection>

      <PolicySection id="website-purpose" title="Website Purpose">
        <p>
          This website is designed to present information about the Aadhya Serene
          residential project, including apartment configurations, amenities,
          location context, walkthroughs, brochures, and lead-enquiry options.
        </p>
        <p>
          The website does not create a binding offer to sell, reserve, allot, or
          transfer any unit. Final availability, pricing, specifications, terms of
          sale, and documentation remain subject to direct confirmation with the
          project sales team and applicable legal documentation.
        </p>
      </PolicySection>

      <PolicySection id="content-and-accuracy" title="Content & Accuracy">
        <p>
          We aim to keep the information on this website useful and current,
          including details related to floor plans, amenities, visuals, pricing
          cues, and possession status. However, some content may be updated,
          revised, or withdrawn without prior notice.
        </p>
        <p>
          Measurements, renderings, illustrations, lifestyle visuals, and written
          descriptions should be treated as indicative unless a formal project
          document expressly states otherwise.
        </p>
      </PolicySection>

      <PolicySection id="permitted-use" title="Permitted Use">
        <p>You agree not to misuse the website or its materials. This includes not to:</p>
        <ul className={styles.list}>
          <li>Copy, republish, scrape, or commercially reuse project content without permission.</li>
          <li>Upload false, misleading, harmful, or unlawful information through enquiry forms.</li>
          <li>Attempt to interfere with website security, code, hosting, or analytics systems.</li>
          <li>Use automated tools to harvest contact details, pricing cues, or proprietary content.</li>
        </ul>
      </PolicySection>

      <PolicySection id="lead-submissions" title="Lead Submissions">
        <p>
          When you submit your details through a form, WhatsApp click, callback
          request, or brochure request, you confirm that the information provided
          is yours or that you are authorised to share it.
        </p>
        <p>
          You also understand that the Aadhya Serene team or its authorised
          representatives may contact you about your enquiry using phone, email,
          WhatsApp, or similar channels, subject to applicable law and your stated
          communication preferences.
        </p>
      </PolicySection>

      <PolicySection id="intellectual-property" title="Intellectual Property">
        <p>
          All branding, logos, project names, written copy, floor plans, visual
          assets, interface elements, videos, and downloadable materials on this
          website remain the property of their respective owners unless expressly
          stated otherwise.
        </p>
        <p>
          No part of this website may be reproduced, modified, distributed, or
          publicly displayed for commercial use without prior written permission.
        </p>
      </PolicySection>

      <PolicySection id="liability-and-updates" title="Liability & Updates">
        <p>
          This website is provided on an as-available basis. To the fullest extent
          permitted by law, we do not guarantee uninterrupted access, absolute
          accuracy, or fitness for every buyer-specific purpose.
        </p>
        <p>
          We may revise these terms from time to time to reflect changes in the
          website, the project-marketing journey, legal obligations, or third-party
          platform requirements. Continued use of the website after updates are
          published will be treated as acceptance of the revised terms.
        </p>
      </PolicySection>

      <PolicySection id="contact-us" title="Contact Us">
        <p>
          For questions about these terms, website content, or project-enquiry
          communications, please contact the Aadhya Serene team.
        </p>
        <PolicyContactCard items={contactItems} />
      </PolicySection>

      <PolicyNotes items={noteItems} />
    </LegalPage>
  );
}
