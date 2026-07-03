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
  { label: 'Overview', href: '#overview' },
  { label: 'How to Request Deletion', href: '#how-to-request-deletion' },
  { label: 'Information to Include', href: '#information-to-include' },
  { label: 'What Happens Next', href: '#what-happens-next' },
  { label: 'When We May Retain Data', href: '#when-we-may-retain-data' },
  { label: 'Marketing Preferences', href: '#marketing-preferences' },
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
      'Deleting your enquiry information does not automatically clear cookies already stored in your browser. Those can be removed from your browser or device settings.',
  },
  {
    id: 'verification-required',
    label: 'Verification Required',
    copy:
      'To protect your privacy, we may need to confirm that the request genuinely comes from the same person whose enquiry details were submitted to us.',
  },
  {
    id: 'response-window',
    label: 'Response Window',
    copy:
      'We aim to review data deletion requests promptly and may contact you if more information is needed before we can process the request safely.',
  },
  {
    id: 'meta-leads',
    label: 'Meta Lead Reminder',
    copy:
      'If you submitted your details through a Meta or Facebook lead ad, this page is the correct destination to request deletion of the information we received from that lead flow.',
  },
];

export default function UserDataDeletionPage() {
  return (
    <LegalPage
      activeTab="user-data-deletion"
      tabs={LEGAL_TABS}
      heroId="user-data-deletion"
      heroTitle="User Data Deletion"
      heroCopy="This page explains how you can request deletion of personal information previously shared with Aadhya Serene through website forms, Meta lead ads, WhatsApp follow-ups, or project-enquiry conversations."
      effectiveDate={EFFECTIVE_DATE}
      metaCopy="We created these instructions to give visitors and Meta users a clear, direct path for requesting deletion of enquiry data connected with the Aadhya Serene project."
      tocItems={tocItems}
      metaCardCopy="This page is designed to work as the user data deletion instructions URL for Meta and similar lead-generation platforms."
    >
      <PolicySection id="overview" title="Overview">
        <p>
          If you have shared your name, phone number, email address, apartment
          preference, or other enquiry details with Aadhya Serene, you may request
          that we delete that information from our active website-lead and follow-up
          systems, subject to applicable legal or operational obligations.
        </p>
        <p>
          This includes information submitted through website forms, brochure
          requests, callback requests, WhatsApp journeys, and Meta or Facebook lead
          campaigns linked to this project.
        </p>
      </PolicySection>

      <PolicySection id="how-to-request-deletion" title="How to Request Deletion">
        <p>
          To request deletion of your data, please email us at{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> with the subject line{' '}
          <strong>Data Deletion Request - Aadhya Serene</strong>.
        </p>
        <p>
          You may also contact us by phone or WhatsApp if you need assistance, but we
          may still ask you to confirm the request in writing so that we can process
          it accurately and maintain a clear record of the action taken.
        </p>
      </PolicySection>

      <PolicySection id="information-to-include" title="Information to Include">
        <p>Your request will be easier to verify if you include the following details:</p>
        <ul className={styles.list}>
          <li>Your full name and the phone number or email address used in the enquiry.</li>
          <li>Where you submitted the enquiry, such as the website, WhatsApp, brochure form, or Meta lead ad.</li>
          <li>Approximate date of submission or the context of your enquiry.</li>
          <li>Any alternate contact detail you may have used while speaking with the sales team.</li>
        </ul>
      </PolicySection>

      <PolicySection id="what-happens-next" title="What Happens Next">
        <p>
          Once we receive your request, we will review the information available in
          our lead-management and communication records and take reasonable steps to
          locate the corresponding enquiry data.
        </p>
        <p>
          If additional clarification is needed, we may contact you to verify your
          identity or to narrow down which records should be removed. After
          verification, we will process the deletion request within a reasonable
          timeframe and confirm completion when appropriate.
        </p>
      </PolicySection>

      <PolicySection id="when-we-may-retain-data" title="When We May Retain Data">
        <p>
          In limited cases, we may retain certain records where doing so is
          reasonably necessary for legal compliance, fraud prevention, dispute
          resolution, internal audit purposes, or to document that a deletion
          request was fulfilled.
        </p>
        <p>
          Any retained information will be limited to what is reasonably necessary
          for those purposes and will not be used for unrelated marketing unless you
          separately request otherwise.
        </p>
      </PolicySection>

      <PolicySection id="marketing-preferences" title="Marketing Preferences">
        <p>
          If you no longer want follow-up calls, WhatsApp messages, emails, or
          remarketing related to Aadhya Serene, you can also ask us to stop
          promotional communication even if you do not want full deletion.
        </p>
        <p>
          This can be helpful if you want to remain in touch for important updates
          while ending marketing outreach, or if you only want specific channels to
          be turned off.
        </p>
      </PolicySection>

      <PolicySection id="contact-us" title="Contact Us">
        <p>
          For user data deletion requests or assistance identifying the enquiry you
          want removed, please use the contact details below.
        </p>
        <PolicyContactCard items={contactItems} />
      </PolicySection>

      <PolicyNotes items={noteItems} />
    </LegalPage>
  );
}
